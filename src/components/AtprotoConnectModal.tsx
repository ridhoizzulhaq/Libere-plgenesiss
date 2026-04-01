import { useState } from 'react';
import { MdClose } from 'react-icons/md';
import { signInWithAtproto } from '../libs/atproto-oauth';
import { saveAtprotoDid } from '../libs/identity-link';

interface Props {
  isOpen: boolean;
  walletAddress?: string;
  onClose: () => void;
  onSuccess?: (did: string) => void;
}

const AtprotoConnectModal = ({ isOpen, walletAddress, onClose, onSuccess }: Props) => {
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConnect = async () => {
    const trimmed = handle.trim();
    if (!trimmed) {
      setError('Please enter your ATProto handle');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { did } = await signInWithAtproto(trimmed);
      if (walletAddress) {
        await saveAtprotoDid(walletAddress, did, trimmed);
      }
      onSuccess?.(did);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Connect ATProto Identity</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Be credited as contributor on Hyperscan</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <MdClose className="text-xl text-zinc-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-zinc-600">
            Enter your ATProto handle. A popup will open for you to sign in at your provider — no password entered here.
          </p>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">Handle</label>
            <input
              type="text"
              value={handle}
              onChange={e => { setHandle(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              placeholder="alice.bsky.social or alice.certified.one"
              className="w-full p-3 border-2 border-zinc-200 rounded-lg focus:border-zinc-900 focus:outline-none text-sm"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-50 border-t border-zinc-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 border-2 border-zinc-300 text-zinc-700 font-semibold rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Connecting…</span>
            ) : (
              'Connect →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AtprotoConnectModal;
