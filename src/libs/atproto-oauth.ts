import { BrowserOAuthClient, buildLoopbackClientId } from '@atproto/oauth-client-browser';

function getClientId(): string {
  const { hostname, port } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocal) {
    return buildLoopbackClientId({
      hostname: '127.0.0.1',
      pathname: '/',
      port,
    });
  }
  return `${window.location.origin}/client-metadata.json`;
}

let _client: BrowserOAuthClient | null = null;

export async function getOAuthClient(): Promise<BrowserOAuthClient> {
  if (_client) return _client;

  _client = await BrowserOAuthClient.load({
    clientId: getClientId(),
    handleResolver: 'https://bsky.social',
    responseMode: 'query',
  });

  return _client;
}

/**
 * Sign in via popup window — user logs in at their PDS, popup closes,
 * returns their DID. No page redirect needed.
 */
export async function signInWithAtproto(handle: string): Promise<{ did: string }> {
  const client = await getOAuthClient();
  const session = await client.signInPopup(handle);
  return { did: session.did };
}

/**
 * Sign out from ATProto — revokes OAuth session and clears IndexedDB.
 */
export async function signOutAtproto(did: string): Promise<void> {
  try {
    const client = await getOAuthClient();
    await client.revoke(did);
  } catch {
    // ignore errors — session may already be expired
  }
}

/**
 * Try to restore existing session from IndexedDB.
 */
export async function restoreOAuthSession(): Promise<{ did: string } | null> {
  try {
    const client = await getOAuthClient();
    const result = await client.initRestore();
    if (result?.session) return { did: result.session.did };
    return null;
  } catch {
    return null;
  }
}
