// ATProto proxy client — routes all requests through Supabase Edge Function
// to avoid browser CORS restrictions when calling certified.app directly.

import { supabase } from './supabase';
import config from './config';

interface ProxyResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

async function proxyCall(
  path: string,
  body: unknown,
  accessJwt?: string,
  pdsHost?: string,
  method: 'POST' | 'GET' = 'POST',
): Promise<ProxyResponse> {
  const { data, error } = await supabase.functions.invoke('hypercerts-proxy', {
    body: {
      path,
      method,
      body: method === 'GET' ? undefined : body,
      headers: accessJwt ? { authorization: `Bearer ${accessJwt}` } : undefined,
      ...(pdsHost && { pdsHost }),
    },
  });

  if (error) throw new Error(`Proxy error: ${error.message}`);
  if (data?._status && data._status >= 400) {
    const msg = data.message ?? data.error ?? JSON.stringify(data);
    throw new Error(msg);
  }
  return data;
}

function resolvePdsFromHandle(handle: string): string {
  // alice.bsky.social → https://bsky.social
  // alice.certified.one → https://certified.one
  // alice (no dot) → https://certified.one
  const parts = handle.split('.');
  if (parts.length >= 2) {
    const domain = parts.slice(1).join('.');
    return `https://${domain}`;
  }
  return config.env.hypercerts.pdsHost;
}

/**
 * Sign in ke ATProto PDS manapun menggunakan identifier + password.
 * Returns donor DID. Access token dibuang (tidak disimpan).
 */
export async function createAtprotoSession(
  identifier: string,
  password: string,
): Promise<{ did: string; handle: string }> {
  const pdsHost = resolvePdsFromHandle(identifier);
  const data = await proxyCall(
    '/xrpc/com.atproto.server.createSession',
    { identifier, password },
    undefined,
    pdsHost,
  );
  return { did: data.did, handle: data.handle };
}

/**
 * Create akun baru di certified.one.
 * Handle akan di-suffix dengan .certified.one secara otomatis.
 */
export async function createAtprotoAccount(
  handle: string,
  email: string,
  password: string,
): Promise<{ did: string; handle: string }> {
  const fullHandle = handle.includes('.') ? handle : `${handle}.certified.one`;
  const data = await proxyCall(
    '/xrpc/com.atproto.server.createAccount',
    { handle: fullHandle, email, password },
    undefined,
    config.env.hypercerts.pdsHost,
  );
  return { did: data.did, handle: data.handle };
}

// Session cache
let sessionCache: { did: string; accessJwt: string } | null = null;
let loginInProgress: Promise<{ did: string; accessJwt: string }> | null = null;

export async function getSession(): Promise<{ did: string; accessJwt: string }> {
  if (sessionCache) return sessionCache;
  if (loginInProgress) return loginInProgress;

  loginInProgress = (async () => {
    const data = await proxyCall(
      '/xrpc/com.atproto.server.createSession',
      { identifier: config.env.hypercerts.username, password: config.env.hypercerts.password },
      undefined,
      config.env.hypercerts.pdsHost,
    );
    sessionCache = { did: data.did, accessJwt: data.accessJwt };
    return sessionCache;
  })();

  return loginInProgress;
}

export async function createRecord(params: {
  repo: string;
  collection: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  record: Record<string, any>;
}): Promise<{ uri: string; cid: string }> {
  const { accessJwt } = await getSession();
  const data = await proxyCall(
    '/xrpc/com.atproto.repo.createRecord',
    params,
    accessJwt,
  );
  return { uri: data.uri, cid: data.cid };
}

export async function listRecords(params: {
  repo: string;
  collection: string;
  limit?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Promise<{ records: any[] }> {
  const { accessJwt } = await getSession();
  const qs = new URLSearchParams({
    repo: params.repo,
    collection: params.collection,
    limit: String(params.limit ?? 10),
  });
  const data = await proxyCall(
    `/xrpc/com.atproto.repo.listRecords?${qs}`,
    undefined,
    accessJwt,
    undefined,
    'GET',
  );
  return { records: data.records ?? [] };
}
