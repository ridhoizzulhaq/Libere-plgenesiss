import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { restoreOAuthSession } from '../libs/atproto-oauth';
import { saveAtprotoDid } from '../libs/identity-link';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';

/**
 * ATProto OAuth callback page — /oauth/callback
 * Exchanges OAuth code for session, saves DID, redirects back.
 */
export default function OAuthCallbackScreen() {
  const navigate = useNavigate();
  const { client } = useSmartWallets();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await restoreOAuthSession();
        if (cancelled) return;

        if (!result) {
          // No OAuth params — redirect home
          navigate('/', { replace: true });
          return;
        }

        const walletAddress = client?.account?.address;
        if (walletAddress) {
          await saveAtprotoDid(walletAddress, result.did);
        }

        // Redirect to impact page (or returnTo if we stored it)
        const returnTo = sessionStorage.getItem('atproto_return_to') ?? '/impact';
        sessionStorage.removeItem('atproto_return_to');
        navigate(returnTo, { replace: true });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'OAuth callback failed');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [client, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow p-6 text-center">
          <p className="text-sm font-semibold text-zinc-900 mb-1">Connection failed</p>
          <p className="text-xs text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/impact', { replace: true })}
            className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg"
          >
            Back to Impact
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-zinc-500">Connecting ATProto identity…</p>
      </div>
    </div>
  );
}
