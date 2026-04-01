import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import HomeLayout from "../components/layouts/HomeLayout";
import config from "../libs/config";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { baseSepolia } from "viem/chains";
import { contractABI, contractAddress } from "../smart-contract.abi";
import { encodeFunctionData } from "viem";
import { FaBookReader } from "react-icons/fa";
import { BiDonateHeart } from "react-icons/bi";
import { USDC_DECIMALS, usdcTokenAddress, erc20Abi } from "../usdc-token";
import { useCurrency } from "../contexts/CurrencyContext";
import { usePrivy } from "@privy-io/react-auth";
import LibraryDonationModal from "../components/LibraryDonationModal";
import AtprotoConnectModal from "../components/AtprotoConnectModal";
import { useHypercerts } from "../hooks/useHypercerts";
import { supabase } from "../libs/supabase";

const baseUrl = config.env.supabase.baseUrl;

const BookDetailScreen = () => {
  const { id } = useParams();
  const { client } = useSmartWallets();
  const { authenticated } = usePrivy();
  const { convertPrice } = useCurrency();
  const { recordDonation, getDonorClaim } = useHypercerts();
  const [book, setBook] = useState<Book>();
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState("");
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showAtprotoModal, setShowAtprotoModal] = useState(false);
  const [donorClaim, setDonorClaim] = useState<{
    donated_amount: number;
    library_name: string | null;
    borrow_count: number;
    activity_uri: string | null;
    created_at: string;
  } | null>(null);
  const navigate = useNavigate();

  // Dummy book dengan ID 1 (USDC)
  const dummyBook: Book = {
    id: 1,
    title: "Introduction to Blockchain & Web3",
    description: "A comprehensive guide to understanding blockchain technology, cryptocurrencies, and Web3 development. Learn about smart contracts, DeFi, NFTs, and the future of decentralized applications. Perfect for developers and enthusiasts looking to dive into the world of blockchain.",
    author: "Satoshi Nakamoto Jr.",
    publisher: "Libere Press",
    metadataUri: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=600&fit=crop",
    epub: "ipfs://QmDummyEpubHash123456789",
    priceEth: "1000000", // 1 USDC (6 decimals)
    royalty: 500, // 5%
    addressReciepent: "0x0000000000000000000000000000000000000000",
    addressRoyaltyRecipient: "0x0000000000000000000000000000000000000000",
  };

  useEffect(() => {
    const fetchBooks = async () => {
      // If ID is 1, use dummy book
      if (id === "1") {
        setBook(dummyBook);
        return;
      }

      try {
        const res = await fetch(`${baseUrl}/rest/v1/Book?id=eq.${id}`, {
          headers: {
            apiKey: config.env.supabase.apiKey,
          },
        });
        const data = await res.json();

        setBook(data[0]);
      } catch (err) {
        console.error("Failed to get Books Data", err);
      }
    };

    if (id) fetchBooks();
  }, [id]);

  // Load donor's impact claim when book + wallet ready
  useEffect(() => {
    const walletAddress = client?.account?.address;
    if (book && walletAddress) {
      getDonorClaim(book.id, walletAddress).then(setDonorClaim);
    }
  }, [book, client?.account?.address]);

  // All books now use USDC - convert USDC units (6 decimals) to readable USDC
  const usdcUnitsToReadable = (units: string | number | bigint) => {
    return Number(units) / Math.pow(10, USDC_DECIMALS);
  };

  // Format price: show whole numbers without decimals
  const formatPrice = (price: number) => {
    return price % 1 === 0 ? price.toString() : price.toFixed(2);
  };

  const onMintBook = async () => {
    setLoading(true);
    setPurchaseStatus("");

    if (!client) {
      setPurchaseStatus("Please connect your wallet first");
      setLoading(false);
      return;
    }

    if (!book) {
      setPurchaseStatus("Book not found");
      setLoading(false);
      return;
    }

    try {
      const bookId = book.id;
      const amount = 1;
      const priceInUSDC = BigInt(book.priceEth);

      // All books now use USDC payment (ETH only for gas fees)

      // Step 1: Approve USDC spending
      setPurchaseStatus("Approving USDC spending...");
      const approveData = encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [contractAddress, priceInUSDC],
      });

      const approveTx = await client.sendTransaction({
        chain: baseSepolia,
        to: usdcTokenAddress,
        data: approveData,
        // ETH used for gas fee only
      });

      console.log("USDC Approval tx:", approveTx);

      // Step 2: Purchase the book with USDC
      setPurchaseStatus("Purchasing book with USDC...");
      const purchaseData = encodeFunctionData({
        abi: contractABI,
        functionName: "purchaseItem",
        args: [BigInt(bookId), BigInt(amount)],
      });

      const purchaseTx = await client.sendTransaction({
        chain: baseSepolia,
        to: contractAddress,
        data: purchaseData,
        value: BigInt(0), // No ETH sent to contract, USDC token used for payment
        // ETH used for gas fee only
      });

      console.log("Purchase tx:", purchaseTx);

      setPurchaseStatus("Book purchased successfully! Redirecting...");

      // Redirect to bookshelf after 2 seconds
      setTimeout(() => {
        navigate("/bookselfs");
        setLoading(false);
      }, 2000);

    } catch (error: any) {
      console.error("Transaction failed:", error);
      setPurchaseStatus(`Error: ${error.message || "Purchase failed"}`);
      setLoading(false);
    }
  };

  const onDonate = async (libraryAddress: string, amount: number, libraryName: string = 'Library') => {
    setLoading2(true);
    setPurchaseStatus("");

    if (!client) {
      setPurchaseStatus("Please connect your wallet first");
      setLoading2(false);
      return;
    }

    if (!book) {
      setPurchaseStatus("Book not found");
      setLoading2(false);
      return;
    }

    try {
      const bookId = book.id;
      const pricePerBook = BigInt(book.priceEth);
      const totalPriceInUSDC = pricePerBook * BigInt(amount);

      // All books now use USDC payment (ETH only for gas fees)

      // Step 1: Approve USDC spending
      setPurchaseStatus("Approving USDC for donation...");
      const approveData = encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [contractAddress, totalPriceInUSDC],
      });

      const approveTx = await client.sendTransaction({
        chain: baseSepolia,
        to: usdcTokenAddress,
        data: approveData,
        // ETH used for gas fee only
      });

      console.log("USDC Approval tx:", approveTx);

      // Step 2: Donate to library with USDC
      setPurchaseStatus("Donating to library with USDC...");
      const donateData = encodeFunctionData({
        abi: contractABI,
        functionName: "purchaseItemForLibrary",
        args: [libraryAddress, BigInt(bookId), BigInt(amount)],
      });

      const donateTx = await client.sendTransaction({
        chain: baseSepolia,
        to: contractAddress,
        data: donateData,
        value: BigInt(0), // No ETH sent to contract, USDC token used for payment
        // ETH used for gas fee only
      });

      console.log("Donation tx:", donateTx);

      // Record hypercert impact claim (non-blocking)
      const walletAddress = client?.account?.address;
      if (walletAddress && book) {
        recordDonation({
          bookId: book.id,
          libraryAddress,
          amount,
          bookTitle: book.title,
          libraryName,
          donorWallet: walletAddress,
          txHash: donateTx,
        }).then(() => {
          // Refresh donor claim panel after recording
          getDonorClaim(book.id, walletAddress).then(setDonorClaim);
          // Prompt ATProto identity connect jika belum ada
          supabase
            .from('user_atproto_profiles')
            .select('atproto_did')
            .eq('wallet_address', walletAddress.toLowerCase())
            .maybeSingle()
            .then(({ data }) => {
              if (!data?.atproto_did) setShowAtprotoModal(true);
            });
        }).catch(console.warn);
      }

      setPurchaseStatus("Donation successful! Thank you!");

      setTimeout(() => {
        setPurchaseStatus("");
        setLoading2(false);
      }, 3000);

    } catch (error: any) {
      console.error("Donation failed:", error);
      setPurchaseStatus(`Error: ${error.message || "Donation failed"}`);
      setLoading2(false);
    }
  };

  return (
    <HomeLayout>
      <div className="w-full flex justify-center bg-gradient-to-b from-zinc-50 to-white min-h-screen">
        <div className="container mx-auto pt-6 pb-12 max-w-screen-xl px-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <button
              onClick={() => navigate("/books")}
              className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors text-sm font-medium"
            >
              <span>&larr;</span>
              <span>Back to Books</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Book Cover - Left Side */}
            {book ? (
              <div className="lg:w-1/2">
                <div className="sticky top-24 bg-white rounded-lg shadow-lg p-8 border border-zinc-200">
                  <img
                    src={book.metadataUri}
                    alt={book.title}
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                </div>
              </div>
            ) : (
              <div className="lg:w-1/2">
                <div className="bg-zinc-200 animate-pulse rounded-lg h-[600px]" />
              </div>
            )}

            {/* Book Details - Right Side */}
            <div className="lg:w-1/2">
              {book ? (
                <div className="space-y-6">
                  {/* Title & Author */}
                  <div className="pb-6 border-b border-zinc-200">
                    <h1 className="text-3xl font-bold text-zinc-900 mb-3">
                      {book.title}
                    </h1>
                    <p className="text-base text-zinc-600">
                      by {book.author}
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">{book.publisher}</p>
                  </div>

                  {/* Price - All books use USDC */}
                  <div className="py-6 border-b border-zinc-200">
                    <div>
                      <div className="text-4xl font-bold text-zinc-900 mb-2">
                        {convertPrice(usdcUnitsToReadable(book.priceEth))}
                      </div>
                      <div className="text-sm text-zinc-500">
                        ${formatPrice(usdcUnitsToReadable(book.priceEth))} USDC
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="py-6 border-b border-zinc-200">
                    <h3 className="text-sm font-semibold text-zinc-900 mb-2 uppercase tracking-wide">About</h3>
                    <p className="text-zinc-700 leading-relaxed">{book.description}</p>
                  </div>

                  {/* Status Message */}
                  {purchaseStatus && (
                    <div className={`p-4 rounded-xl shadow-sm ${
                      purchaseStatus.includes("Error")
                        ? "bg-red-50 border-2 border-red-200 text-red-700"
                        : purchaseStatus.includes("successful")
                        ? "bg-green-50 border-2 border-green-200 text-green-700"
                        : "bg-blue-50 border-2 border-blue-200 text-blue-700"
                    }`}>
                      <p className="font-medium flex items-center gap-2">
                        <span>{purchaseStatus.includes("Error") ? "❌" : purchaseStatus.includes("successful") ? "✅" : "ℹ️"}</span>
                        <span>{purchaseStatus}</span>
                      </p>
                    </div>
                  )}

                  {/* CTA Buttons */}
                  <div className="space-y-3 pt-6">
                    {!authenticated ? (
                      // Guest user - show login buttons
                      <>
                        <button
                          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                          onClick={() => navigate("/auth")}
                        >
                          <FaBookReader />
                          <span>Login to Purchase</span>
                        </button>

                        <button
                          className="w-full border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                          onClick={() => navigate("/auth")}
                        >
                          <BiDonateHeart />
                          <span>Login to Donate</span>
                        </button>
                      </>
                    ) : (
                      // Authenticated user - show actual purchase/donate buttons
                      <>
                        <button
                          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          onClick={onMintBook}
                          disabled={loading || loading2}
                        >
                          {loading ? (
                            <span>Processing...</span>
                          ) : (
                            <>
                              <FaBookReader />
                              <span>Purchase Book</span>
                            </>
                          )}
                        </button>

                        <button
                          className="w-full border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          onClick={() => setShowLibraryModal(true)}
                          disabled={loading || loading2}
                        >
                          {loading2 ? (
                            <span>Processing...</span>
                          ) : (
                            <>
                              <BiDonateHeart />
                              <span>Donate to Library</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-[12rem] bg-zinc-200 animate-pulse h-[1.875rem] rounded mb-4" />
                  <div className="w-[25rem] bg-zinc-200 animate-pulse h-[5rem] rounded mb-4" />
                  <div className="w-[5rem] bg-zinc-200 animate-pulse h-[2rem] rounded mb-2 mt-2" />
                  <div className="w-[7rem] bg-zinc-200 animate-pulse h-[1.25rem] rounded mb-6" />
                  <div className="w-[5rem] bg-zinc-200 animate-pulse h-[2rem] rounded" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Your Impact Panel — hanya tampil untuk donor buku ini */}
      {donorClaim && (
        <div className="w-full flex justify-center px-6 mb-6">
          <div className="container mx-auto max-w-screen-xl">
            <div className="border border-zinc-200 rounded-xl p-6 bg-zinc-50">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📚</span>
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-1">Your Impact</h3>
                  <p className="text-sm text-zinc-600">
                    You donated <span className="font-semibold">{donorClaim.donated_amount} {donorClaim.donated_amount === 1 ? 'copy' : 'copies'}</span> to{' '}
                    <span className="font-semibold">{donorClaim.library_name ?? 'the library'}</span> on{' '}
                    {new Date(donorClaim.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
                  </p>
                  {donorClaim.borrow_count > 0 ? (
                    <p className="text-sm text-zinc-600 mt-1">
                      This book has been borrowed{' '}
                      <span className="font-semibold text-zinc-900">{donorClaim.borrow_count} {donorClaim.borrow_count === 1 ? 'time' : 'times'}</span>{' '}
                      since your donation.
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-400 mt-1">No borrows recorded yet.</p>
                  )}
                  {donorClaim.activity_uri && (
                    <div className="flex flex-col gap-2 mt-2">
                      <p className="text-xs text-zinc-300 font-mono truncate">{donorClaim.activity_uri}</p>
                      <a
                        href={(() => { const p = donorClaim.activity_uri.replace('at://', '').split('/'); return `https://www.hyperscan.dev/data?did=${encodeURIComponent(p[0])}&collection=${p[1]}&rkey=${p[2]}`; })()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-500 hover:text-zinc-800 underline underline-offset-2"
                      >
                        View on Hyperscan ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Library Donation Modal */}
      <LibraryDonationModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        onConfirm={(address, amount, libraryName) => {
          setShowLibraryModal(false);
          onDonate(address, amount, libraryName);
        }}
        bookPrice={book?.priceEth}
      />

      {/* ATProto Identity Connect Modal (post-donation prompt) */}
      <AtprotoConnectModal
        isOpen={showAtprotoModal}
        walletAddress={client?.account?.address}
        onClose={() => setShowAtprotoModal(false)}
        onSuccess={() => setShowAtprotoModal(false)}
      />
    </HomeLayout>
  );
};

export default BookDetailScreen;
