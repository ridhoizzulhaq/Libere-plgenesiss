/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAddress } from 'viem';
import config from './config';
import { supabase } from './supabase';
import { getSession, createRecord } from './atproto-proxy';

/**
 * Simpan ATProto DID untuk wallet address ke Supabase.
 * Update semua existing hypercert_claims milik wallet ini.
 */
export async function saveAtprotoDid(
  walletAddress: string,
  did: string,
  handle?: string,
): Promise<void> {
  await supabase.from('user_atproto_profiles').upsert({
    wallet_address: walletAddress.toLowerCase(),
    atproto_did: did,
    atproto_handle: handle ?? null,
    updated_at: new Date().toISOString(),
  });
  // Update semua existing claims wallet ini secara retroaktif
  await supabase
    .from('hypercert_claims')
    .update({ donor_did: did })
    .eq('donor_wallet', walletAddress.toLowerCase());
}

/**
 * Link wallet Ethereum ke ATProto DID via EIP-712 signature.
 * Cek Supabase dulu — jika sudah ada DID untuk wallet ini, skip re-linking.
 */
export async function linkWalletToDid(params: {
  walletAddress: string;
  walletClient: any;
}): Promise<string> {
  const checksummedAddress = getAddress(params.walletAddress);

  // Cek cache di Supabase dulu
  const { data: existing } = await supabase
    .from('hypercert_claims')
    .select('donor_did')
    .eq('donor_wallet', checksummedAddress.toLowerCase())
    .not('donor_did', 'is', null)
    .limit(1)
    .maybeSingle();

  if (existing?.donor_did) {
    return existing.donor_did;
  }

  // Login via proxy untuk dapatkan DID
  const { did: agentDid } = await getSession();

  // Build EIP-712 message
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = crypto.randomUUID();
  const chainId = parseInt(config.env.hypercerts.chainId);

  const domain = {
    name: 'Libere Hypercerts',
    version: '1',
    chainId,
  } as const;

  const types = {
    IdentityLink: [
      { name: 'did', type: 'string' },
      { name: 'evmAddress', type: 'address' },
      { name: 'chainId', type: 'string' },
      { name: 'timestamp', type: 'string' },
      { name: 'nonce', type: 'string' },
    ],
  } as const;

  const message = {
    did: agentDid,
    evmAddress: checksummedAddress as `0x${string}`,
    chainId: String(chainId),
    timestamp,
    nonce,
  };

  // Sign dengan wallet (viem interface)
  let signature: string;
  try {
    signature = await params.walletClient.signTypedData({
      domain,
      types,
      primaryType: 'IdentityLink',
      message,
    });
  } catch (err) {
    console.warn('signTypedData failed on smart wallet, identity link skipped:', err);
    return agentDid;
  }

  // Post app.certified.link.evm record ke ATProto via proxy
  try {
    await createRecord({
      repo: agentDid,
      collection: 'app.certified.link.evm',
      record: {
        $type: 'app.certified.link.evm',
        address: checksummedAddress,
        proof: {
          $type: 'app.certified.link.evm#eip712Proof',
          signature,
          message: {
            $type: 'app.certified.link.evm#eip712Message',
            did: agentDid,
            evmAddress: checksummedAddress,
            chainId: String(chainId),
            timestamp,
            nonce,
          },
        },
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.warn('app.certified.link.evm record creation failed (may already exist):', err);
  }

  return agentDid;
}
