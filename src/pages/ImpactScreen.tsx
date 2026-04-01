/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { supabase } from "../libs/supabase";
import HomeLayout from "../components/layouts/HomeLayout";
import { useNavigate } from "react-router-dom";
import AtprotoConnectModal from "../components/AtprotoConnectModal";
import { signOutAtproto } from "../libs/atproto-oauth";
import { getLatestMeasurement, type LatestMeasurement } from "../libs/hypercerts";

interface Claim {
  id: number;
  book_id: number;
  book_title: string | null;
  library_name: string | null;
  library_address: string;
  donated_amount: number;
  borrow_count: number;
  activity_uri: string | null;
  donor_did: string | null;
  created_at: string;
}

function toHyperscanUrl(atUri: string): string {
  // at://did:plc:xxx/collection/rkey
  // → https://www.hyperscan.dev/data?did=...&collection=...&rkey=...
  const withoutScheme = atUri.replace('at://', '');
  const parts = withoutScheme.split('/');
  const did = parts[0];
  const collection = parts[1];
  const rkey = parts[2];
  return `https://www.hyperscan.dev/data?did=${encodeURIComponent(did)}&collection=${collection}&rkey=${rkey}`;
}

// Simple SVG bar chart
function BorrowBarChart({ claims }: { claims: Claim[] }) {
  if (claims.length === 0) return null;

  const maxBorrow = Math.max(...claims.map((c) => c.borrow_count), 1);
  const chartH = 120;
  const barW = 32;
  const gap = 12;
  const chartW = claims.length * (barW + gap) + gap;

  return (
    <div className="overflow-x-auto mt-4">
      <svg
        width={Math.max(chartW, 300)}
        height={chartH + 40}
        className="block"
      >
        {claims.map((claim, i) => {
          const x = gap + i * (barW + gap);
          const barH = Math.max(4, (claim.borrow_count / maxBorrow) * chartH);
          const y = chartH - barH;
          const label =
            (claim.book_title ?? `Book ${claim.book_id}`)
              .split(" ")
              .slice(0, 2)
              .join(" ") + (claim.book_title && claim.book_title.split(" ").length > 2 ? "…" : "");

          return (
            <g key={claim.id}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                className="fill-zinc-800"
              />
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={10}
                className="fill-zinc-600"
              >
                {claim.borrow_count}
              </text>
              <text
                x={x + barW / 2}
                y={chartH + 14}
                textAnchor="middle"
                fontSize={9}
                className="fill-zinc-400"
              >
                {label}
              </text>
            </g>
          );
        })}
        {/* baseline */}
        <line
          x1={0}
          y1={chartH}
          x2={chartW}
          y2={chartH}
          stroke="#e4e4e7"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}

export default function ImpactScreen() {
  const { authenticated } = usePrivy();
  const { client } = useSmartWallets();
  const navigate = useNavigate();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [atprotoDid, setAtprotoDid] = useState<string | null>(null);
  const [showAtprotoModal, setShowAtprotoModal] = useState(false);
  const [measurements, setMeasurements] = useState<Record<string, LatestMeasurement | null>>({});

  const walletAddress = client?.account?.address;

  const fetchData = useCallback(async () => {
    if (!walletAddress) return;

    const [{ data: claimsData }, { data: profile }] = await Promise.all([
      supabase
        .from("hypercert_claims")
        .select("*")
        .eq("donor_wallet", walletAddress.toLowerCase())
        .order("created_at", { ascending: false }),
      supabase
        .from("user_atproto_profiles")
        .select("atproto_did")
        .eq("wallet_address", walletAddress.toLowerCase())
        .maybeSingle(),
    ]);

    const loadedClaims = (claimsData as Claim[]) ?? [];
    setClaims(loadedClaims);
    setAtprotoDid(profile?.atproto_did ?? null);
    setLoading(false);

    // Fetch latest measurement per claim (non-blocking)
    const uris = loadedClaims.map((c) => c.activity_uri).filter(Boolean) as string[];
    if (uris.length > 0) {
      Promise.all(uris.map((uri) => getLatestMeasurement(uri).then((m) => [uri, m] as const))).then(
        (results) => setMeasurements(Object.fromEntries(results))
      );
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-fetch when user returns to this tab (e.g. after borrowing a book)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchData]);

  const totalDonated = claims.reduce((s, c) => s + (c.donated_amount ?? 1), 0);
  const totalBorrows = claims.reduce((s, c) => s + c.borrow_count, 0);

  if (!authenticated) {
    return (
      <HomeLayout>
        <div className="w-full flex justify-center px-6 py-20 text-center text-zinc-400">
          Please log in to view your impact.
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="w-full flex justify-center px-6 py-10">
        <div className="w-full max-w-screen-xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">Your Impact</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Books you've donated and how many times they've been borrowed.
            </p>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="border border-zinc-200 rounded-xl p-5 bg-white">
              <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Books Donated</p>
              <p className="text-3xl font-bold text-zinc-900">{claims.length}</p>
            </div>
            <div className="border border-zinc-200 rounded-xl p-5 bg-white">
              <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Copies Donated</p>
              <p className="text-3xl font-bold text-zinc-900">{totalDonated}</p>
            </div>
            <div className="border border-zinc-200 rounded-xl p-5 bg-white col-span-2 sm:col-span-1">
              <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Total Borrows</p>
              <p className="text-3xl font-bold text-zinc-900">{totalBorrows}</p>
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-zinc-400 py-10 text-center">Loading your impact data...</div>
          ) : claims.length === 0 ? (
            <div className="border border-zinc-200 rounded-xl p-10 text-center bg-zinc-50">
              <p className="text-zinc-400 text-sm">You haven't donated any books yet.</p>
              <button
                onClick={() => navigate("/books")}
                className="mt-4 px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition"
              >
                Browse Books
              </button>
            </div>
          ) : (
            <>
              {/* ATProto identity banner */}
              {!atprotoDid && (
                <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 mb-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-700">Claim your hypercert contributor identity</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Connect your ATProto account to be credited as contributor on Hyperscan</p>
                  </div>
                  <button
                    onClick={() => setShowAtprotoModal(true)}
                    className="px-4 py-2 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-700 transition flex-shrink-0"
                  >
                    Connect Identity
                  </button>
                </div>
              )}
              {atprotoDid && (
                <div className="border border-zinc-200 rounded-xl p-4 bg-white mb-4 flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-zinc-400 shrink-0">ATProto:</span>
                    <span className="text-xs font-mono text-zinc-600 truncate">{atprotoDid}</span>
                  </div>
                  <button
                    onClick={async () => {
                      await signOutAtproto(atprotoDid);
                      if (walletAddress) {
                        await supabase.from('user_atproto_profiles').delete().eq('wallet_address', walletAddress.toLowerCase());
                      }
                      setAtprotoDid(null);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 shrink-0 ml-2"
                  >
                    Disconnect
                  </button>
                </div>
              )}

              {/* Bar chart */}
              <div className="border border-zinc-200 rounded-xl p-6 bg-white mb-6">
                <h2 className="text-sm font-semibold text-zinc-700 mb-1">Borrow count per book</h2>
                <p className="text-xs text-zinc-400 mb-2">How many times each donated book has been borrowed</p>
                <BorrowBarChart claims={claims} />
              </div>

              {/* Claims list */}
              <div className="space-y-3">
                {claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="border border-zinc-200 rounded-xl p-5 bg-white flex flex-col gap-4"
                  >
                    {/* Top row: title + stats */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-zinc-900 truncate cursor-pointer hover:underline"
                          onClick={() => navigate(`/books/${claim.book_id}`)}
                        >
                          {claim.book_title ?? `Book #${claim.book_id}`}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {claim.library_name ?? claim.library_address.slice(0, 10) + "…"} ·{" "}
                          {new Date(claim.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        {/* Hypercert hash */}
                        {claim.activity_uri && (
                          <p className="text-xs text-zinc-300 mt-0.5 font-mono truncate">
                            {claim.activity_uri}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-center">
                          <p className="text-lg font-bold text-zinc-900">{claim.donated_amount ?? 1}</p>
                          <p className="text-xs text-zinc-400">donated</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-zinc-900">{claim.borrow_count}</p>
                          <p className="text-xs text-zinc-400">borrows</p>
                        </div>
                      </div>
                    </div>

                    {/* Links + latest measurement */}
                    {claim.activity_uri && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <a
                          href={toHyperscanUrl(claim.activity_uri)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-zinc-400 hover:text-zinc-800 underline underline-offset-2"
                        >
                          View on Hyperscan ↗
                        </a>
                        {measurements[claim.activity_uri] && (
                          <a
                            href={toHyperscanUrl(measurements[claim.activity_uri]!.uri)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-400 hover:text-zinc-800 underline underline-offset-2"
                          >
                            Latest measurement: {measurements[claim.activity_uri]!.value} borrows ↗
                          </a>
                        )}
                        {measurements[claim.activity_uri] === undefined && (
                          <span className="text-xs text-zinc-300">Loading measurement…</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <AtprotoConnectModal
        isOpen={showAtprotoModal}
        walletAddress={walletAddress}
        onClose={() => setShowAtprotoModal(false)}
        onSuccess={(did) => { setAtprotoDid(did); setShowAtprotoModal(false); }}
      />
    </HomeLayout>
  );
}
