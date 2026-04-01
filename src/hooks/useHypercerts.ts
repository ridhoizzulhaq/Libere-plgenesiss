import { useState, useCallback } from 'react';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { getAddress } from 'viem';
import { createActivityClaim, addMeasurement } from '../libs/hypercerts';
import { linkWalletToDid } from '../libs/identity-link';
import { supabase } from '../libs/supabase';

interface HypercertClaim {
  id: number;
  book_id: number;
  library_address: string;
  donor_wallet: string;
  donor_did: string | null;
  activity_uri: string | null;
  activity_cid: string | null;
  borrow_count: number;
  donated_amount: number;
  library_name: string | null;
  book_title: string | null;
  created_at: string;
}

export function useHypercerts() {
  const { client } = useSmartWallets();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Dipanggil setelah donasi buku berhasil.
   * Membuat ATProto activity claim dan menyimpan ke Supabase.
   */
  const recordDonation = useCallback(async (params: {
    bookId: number;
    libraryAddress: string;
    amount: number;
    bookTitle: string;
    libraryName: string;
    donorWallet: string;
    txHash?: string;
  }) => {
    if (!client) {
      console.warn('Smart wallet client not available, skipping hypercert recording');
      return;
    }

    setIsRecording(true);
    setError(null);

    try {
      const checksummedWallet = getAddress(params.donorWallet).toLowerCase();

      // Step 1: Cek profil ATProto donor (jika sudah connect via modal)
      const { data: atprotoProfile } = await supabase
        .from('user_atproto_profiles')
        .select('atproto_did')
        .eq('wallet_address', checksummedWallet)
        .maybeSingle();

      const donorIdentity = atprotoProfile?.atproto_did ?? `eip155:84532:${params.donorWallet}`;

      // Step 2: Link wallet ke ATProto DID (untuk EVM link record)
      const donorDid = await linkWalletToDid({
        walletAddress: params.donorWallet,
        walletClient: client,
      });

      // Step 3: Buat activity claim di ATProto
      const { uri, cid } = await createActivityClaim({
        donorDid,
        donorIdentity,
        bookTitle: params.bookTitle,
        libraryName: params.libraryName,
        amount: params.amount,
        donorWallet: params.donorWallet,
        txHash: params.txHash,
      });

      // Step 3: Simpan ke Supabase hypercert_claims
      const { error: upsertError } = await supabase
        .from('hypercert_claims')
        .upsert({
          book_id: params.bookId,
          library_address: params.libraryAddress.toLowerCase(),
          donor_wallet: checksummedWallet,
          donor_did: donorDid,
          activity_uri: uri,
          activity_cid: cid,
          donated_amount: params.amount,
          library_name: params.libraryName,
          book_title: params.bookTitle,
          borrow_count: 0,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'book_id,library_address,donor_wallet',
        });

      if (upsertError) {
        console.warn('Supabase upsert failed:', upsertError);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.warn('Hypercert donation recording failed (non-blocking):', msg);
      setError(msg);
    } finally {
      setIsRecording(false);
    }
  }, [client]);

  /**
   * Dipanggil setelah borrow buku berhasil.
   * Menambah measurement ke activity claim yang ada.
   */
  const recordBorrow = useCallback(async (params: {
    bookId: number;
    libraryAddress: string;
    borrowerWallet?: string;
    txHash?: string;
  }) => {
    try {
      // Cari existing claim di Supabase
      const { data: claims, error: claimsError } = await supabase
        .from('hypercert_claims')
        .select('activity_uri, activity_cid, borrow_count')
        .eq('book_id', params.bookId)
        .eq('library_address', params.libraryAddress.toLowerCase())
        .not('activity_uri', 'is', null)
        .order('borrow_count', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!claims?.activity_uri || !claims?.activity_cid) {
        return;
      }

      // Atomic increment di Supabase via RPC
      const { data: newCount, error: rpcError } = await supabase
        .rpc('increment_borrow_count', {
          p_book_id: params.bookId,
          p_library: params.libraryAddress.toLowerCase(),
        });
      if (rpcError) console.error('RPC increment_borrow_count error:', rpcError);

      // Tambah measurement ke ATProto
      await addMeasurement({
        activityUri: claims.activity_uri,
        activityCid: claims.activity_cid,
        newBorrowCount: newCount ?? (claims.borrow_count + 1),
        borrowerWallet: params.borrowerWallet,
        txHash: params.txHash,
      });
    } catch (err) {
      console.warn('Hypercert borrow measurement failed (non-blocking):', err);
    }
  }, []);

  /**
   * Ambil borrow count untuk buku + library tertentu dari Supabase.
   */
  const getBorrowCount = useCallback(async (
    bookId: number,
    libraryAddress: string,
  ): Promise<number> => {
    const { data } = await supabase
      .from('hypercert_claims')
      .select('borrow_count')
      .eq('book_id', bookId)
      .eq('library_address', libraryAddress.toLowerCase())
      .order('borrow_count', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.borrow_count ?? 0;
  }, []);

  /**
   * Ambil impact claim milik donor untuk buku tertentu.
   * Dipakai untuk panel "Your Impact" di BookDetailScreen.
   */
  const getDonorClaim = useCallback(async (
    bookId: number,
    donorWallet: string,
  ): Promise<HypercertClaim | null> => {
    try {
      const { data } = await supabase
        .from('hypercert_claims')
        .select('*')
        .eq('book_id', bookId)
        .eq('donor_wallet', donorWallet.toLowerCase())
        .maybeSingle();

      return data ?? null;
    } catch {
      return null;
    }
  }, []);

  return {
    recordDonation,
    recordBorrow,
    getBorrowCount,
    getDonorClaim,
    isRecording,
    error,
  };
}
