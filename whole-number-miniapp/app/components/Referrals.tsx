'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '../lib/api';
import { getReferralLink } from '../lib/farcaster';
import sdk from '@farcaster/miniapp-sdk';
import toast from 'react-hot-toast';

// Farcaster icon component
const FarcasterIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <img src="/farcaster-icon.svg" alt="" className={className} />
);

interface ReferralData {
  referralCode: string;
  referralCount: number;
  confirmedReferralCount: number; // Referrals where BOTH users have confirmed
  referralEarnings: number;
  referrals: Array<{
    referralId: number;
    username: string;
    pfp_url: string;
    status: string;
    created_at: string;
    completed_at: string | null;
    referrer_claimed: boolean;
    referred_claimed: boolean;
  }>;
  referredBy: { username: string; pfpUrl: string } | null;
  myReferral: {
    referralId: number;
    referrerUsername: string;
    referrerPfp: string;
    status: string;
    referrerConfirmed: boolean;
    iConfirmed: boolean;
  } | null;
  canCancelReferral: boolean;
  claimableReferrals: Array<{
    referralId: number;
    type: 'asReferrer' | 'asReferred';
    username: string;
    pfpUrl: string;
    reward: number;
    iConfirmed: boolean;
    theyConfirmed: boolean;
  }>;
  claimable: {
    asReferrer: { count: number; amount: number };
    asReferred: { count: number; amount: number };
    total: number;
  };
  pendingReferral: { amount: number; referrerUsername: string } | null;
}

interface ReferralsProps {
  walletAddress?: string;
}

export function Referrals({ walletAddress }: ReferralsProps) {
  const { address: wagmiAddress } = useAccount();
  const router = useRouter();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [claimingReferral, setClaimingReferral] = useState<number | boolean>(false);
  const [cancellingReferral, setCancellingReferral] = useState(false);
  const [showClaimConfirmModal, setShowClaimConfirmModal] = useState<number | null>(null);
  const [farcasterWallet, setFarcasterWallet] = useState<string | null>(null);

  const address = walletAddress || farcasterWallet || wagmiAddress;

  // Get Farcaster wallet on mount
  useEffect(() => {
    const getFarcasterWallet = async () => {
      try {
        const { farcasterAuth } = await import('../lib/farcaster');
        if (farcasterAuth.isInFarcasterFrame()) {
          const signInResult = await farcasterAuth.signInWithFarcaster();
          if (signInResult?.walletAddress) {
            setFarcasterWallet(signInResult.walletAddress);
          }
        }
      } catch (error) {
        console.error('Error getting Farcaster wallet:', error);
      }
    };
    getFarcasterWallet();
  }, []);

  useEffect(() => {
    if (address) {
      fetchReferralData();
      const interval = setInterval(fetchReferralData, 30000);
      return () => clearInterval(interval);
    }
  }, [address]);

  const fetchReferralData = async () => {
    if (!address) return;

    try {
      const response = await fetch(getApiUrl(`api/referrals/${address}`));
      const data = await response.json();
      if (data.success) {
        setReferralData({
          referralCode: data.referralCode,
          referralCount: data.referralCount,
          confirmedReferralCount: data.confirmedReferralCount || 0,
          referralEarnings: data.referralEarnings,
          referrals: data.referrals,
          referredBy: data.referredBy || null,
          myReferral: data.myReferral || null,
          canCancelReferral: data.canCancelReferral || false,
          claimableReferrals: data.claimableReferrals || [],
          claimable: data.claimable || {
            asReferrer: { count: 0, amount: 0 },
            asReferred: { count: 0, amount: 0 },
            total: 0,
          },
          pendingReferral: data.pendingReferral || null,
        });
      }
    } catch (err) {
      console.error('Error fetching referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyReferral = async () => {
    if (!address || !referralCodeInput.trim()) return;

    setApplyingReferral(true);
    try {
      const response = await fetch(getApiUrl('api/referrals/apply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          referralCode: referralCodeInput.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setReferralCodeInput('');
        fetchReferralData();
      } else {
        toast.error(data.message || 'Failed to apply referral code');
      }
    } catch (err) {
      console.error('Error applying referral code:', err);
      toast.error('Failed to apply referral code');
    } finally {
      setApplyingReferral(false);
    }
  };

  const handleClaimReferral = async (referralId: number) => {
    if (!address) return;

    setClaimingReferral(referralId);
    try {
      const response = await fetch(getApiUrl('api/referrals/claim'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          referralId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchReferralData();
      } else {
        toast.error(data.message || 'Failed to confirm referral');
      }
    } catch (err) {
      console.error('Error confirming referral:', err);
      toast.error('Failed to confirm referral');
    } finally {
      setClaimingReferral(false);
    }
  };

  const handleCancelReferral = async () => {
    if (!address) return;

    setCancellingReferral(true);
    try {
      const response = await fetch(getApiUrl('api/referrals/cancel'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchReferralData();
      } else {
        toast.error(data.message || 'Failed to cancel referral');
      }
    } catch (err) {
      console.error('Error cancelling referral:', err);
      toast.error('Failed to cancel referral');
    } finally {
      setCancellingReferral(false);
    }
  };

  if (!address) {
    return (
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🔗</div>
        <h3 className="text-xl font-bold text-yellow-400 mb-2">Connect Wallet</h3>
        <p className="text-gray-400">Connect your wallet to view and manage referrals</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-8">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔗</div>
          <p className="text-gray-400">Loading referrals...</p>
        </div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Referrals</h3>
        <p className="text-gray-400">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Display */}
      <div className="bg-slate-800 border-2 border-green-500 rounded-lg">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-yellow-400">🔗 Your Referral Code</h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xl md:text-2xl font-mono font-bold text-white bg-slate-800 px-3 py-2 rounded">
                {referralData.referralCode}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralData.referralCode);
                  toast.success('Code copied!');
                }}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
              >
                Copy Code
              </button>
            </div>
          </div>

          {/* Share Link */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">
              Share Link <span className="text-purple-400">(opens in Farcaster)</span>
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                value={getReferralLink(referralData.referralCode)}
                readOnly
                className="flex-1 min-w-0 bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getReferralLink(referralData.referralCode));
                  toast.success('Link copied!');
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
              >
                Copy
              </button>
              <button
                onClick={async () => {
                  try {
                    const referralLink = getReferralLink(referralData.referralCode);
                    await sdk.actions.composeCast({
                      text: `Join me in BATTLEFIELD and we both get $5,000 paper money! 🎁\n\nUse my code: ${referralData.referralCode}`,
                      embeds: [referralLink],
                    });
                  } catch {
                    toast.error('Failed to open cast composer');
                  }
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-1"
              >
                <FarcasterIcon className="w-4 h-4" /> Cast
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Friends who click this link will open BATTLEFIELD in Farcaster
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-900/50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-green-400">{referralData.referralCount}</p>
              <p className="text-gray-400 text-[10px]">Referred</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-purple-400">{referralData.confirmedReferralCount || 0}</p>
              <p className="text-gray-400 text-[10px]">Confirmed</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-yellow-400">
                ${referralData.referralEarnings >= 1000
                  ? `${(referralData.referralEarnings / 1000).toFixed(0)}K`
                  : referralData.referralEarnings.toLocaleString()}
              </p>
              <p className="text-gray-400 text-[10px]">Earned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Claimable Referrals */}
      {referralData.claimableReferrals && referralData.claimableReferrals.length > 0 && (
        <div className="bg-slate-800 border-2 border-yellow-500 rounded-lg">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-bold text-yellow-400">🎁 Referral Confirmations</h2>
            <p className="text-gray-400 text-xs mt-1">
              Both you and your friend must confirm to receive $5,000 each!
            </p>
          </div>
          <div className="p-4 space-y-4">
            {referralData.claimableReferrals.map((ref) => (
              <div
                key={ref.referralId}
                className={`border-2 rounded-lg p-4 ${
                  ref.iConfirmed && ref.theyConfirmed
                    ? 'bg-green-900/30 border-green-500'
                    : ref.iConfirmed
                    ? 'bg-blue-900/30 border-blue-500'
                    : ref.theyConfirmed
                    ? 'bg-yellow-900/30 border-yellow-500 animate-pulse'
                    : 'bg-slate-800/50 border-slate-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={ref.pfpUrl || '/battlefield-logo.jpg'}
                    alt=""
                    className="w-12 h-12 rounded-full border-2 border-slate-600 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white font-bold truncate text-lg">{ref.username}</p>
                        <p className="text-gray-400 text-sm">
                          {ref.type === 'asReferrer' ? 'You referred them' : 'They referred you'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-yellow-400 font-bold text-xl">
                          ${ref.reward.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          ref.iConfirmed ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        You: {ref.iConfirmed ? '✓' : 'Pending'}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          ref.theyConfirmed ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        {ref.username.split(' ')[0]}: {ref.theyConfirmed ? '✓' : 'Pending'}
                      </span>
                    </div>
                    <div className="mt-3">
                      {ref.iConfirmed ? (
                        <span className="text-sm text-blue-400">
                          Waiting for {ref.username} to confirm
                        </span>
                      ) : (
                        <button
                          onClick={() => setShowClaimConfirmModal(ref.referralId)}
                          disabled={claimingReferral === ref.referralId}
                          className={`w-full px-4 py-3 rounded-lg font-bold text-sm transition-all ${
                            ref.theyConfirmed
                              ? 'bg-yellow-500 hover:bg-yellow-400 text-black animate-pulse'
                              : 'bg-green-600 hover:bg-green-500 text-white'
                          }`}
                        >
                          {claimingReferral === ref.referralId
                            ? 'Confirming...'
                            : ref.theyConfirmed
                            ? '💰 Confirm & Claim $5,000!'
                            : 'Confirm Referral'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Referral - Awaiting First Trade */}
      {referralData.pendingReferral && (
        <div className="bg-slate-800 border-2 border-slate-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 font-bold text-lg mb-1">⏳ Pending Reward</p>
              <p className="text-gray-300 text-sm">
                <span className="text-yellow-400 font-bold">
                  ${referralData.pendingReferral.amount.toLocaleString()}
                </span>{' '}
                bonus waiting!
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Open your first trade to unlock (referred by{' '}
                {referralData.pendingReferral.referrerUsername})
              </p>
            </div>
            <button
              disabled={true}
              className="bg-gray-600 text-gray-400 font-bold px-6 py-3 rounded-lg cursor-not-allowed"
            >
              Trade First
            </button>
          </div>
        </div>
      )}

      {/* Referred By Section */}
      {referralData.referredBy && (
        <div className="bg-purple-900/30 border-2 border-purple-500 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-400 font-bold">👥 Referred By</p>
            {referralData.canCancelReferral && (
              <button
                onClick={handleCancelReferral}
                disabled={cancellingReferral}
                className="text-xs text-red-400 hover:text-red-300 disabled:text-gray-500"
              >
                {cancellingReferral ? 'Cancelling...' : 'Cancel'}
              </button>
            )}
          </div>
          <button
            onClick={() => router.push(`/profile/${referralData.referredBy!.username}`)}
            className="flex items-center gap-3 hover:bg-slate-800/50 rounded-lg p-2 -m-2 transition-all group"
          >
            <img
              src={referralData.referredBy.pfpUrl || '/battlefield-logo.jpg'}
              alt=""
              className="w-12 h-12 rounded-full border-2 border-purple-500 group-hover:border-purple-400"
            />
            <span className="text-white font-bold text-lg group-hover:text-purple-400 transition-colors">
              {referralData.referredBy.username}
            </span>
            <span className="text-purple-400 text-sm">→</span>
          </button>
          {referralData.canCancelReferral && (
            <p className="text-gray-500 text-xs mt-2">
              Wrong referral? You can cancel and apply a different code before claiming rewards.
            </p>
          )}
        </div>
      )}

      {/* Enter Friend's Code */}
      {!referralData.referredBy && (
        <div className="bg-blue-900/30 border-2 border-blue-500 rounded-lg p-4">
          <p className="text-blue-400 font-bold mb-2">🎟️ Have a Friend&apos;s Code?</p>
          <p className="text-gray-300 text-sm mb-3">
            Enter their referral code to get $5,000 bonus when you open your first trade!
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralCodeInput}
              onChange={(e) => setReferralCodeInput(e.target.value)}
              placeholder="e.g. elalpha.battle"
              className="flex-1 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-mono border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleApplyReferral}
              disabled={applyingReferral || !referralCodeInput.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
            >
              {applyingReferral ? '...' : 'Apply'}
            </button>
          </div>
        </div>
      )}

      {/* Referral List */}
      {referralData.referrals.length > 0 && (
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-bold text-yellow-400">📋 Your Referrals</h2>
            <p className="text-gray-400 text-xs mt-1">Click on a user to view their profile</p>
          </div>
          <div className="divide-y divide-slate-700">
            {referralData.referrals.map((ref) => {
              // Determine status for simple indicator
              let statusIcon = '⏳';
              let statusText = 'Awaiting trade';
              let statusColor = 'text-gray-400';

              if (ref.status === 'completed' || (ref.referrer_claimed && ref.referred_claimed)) {
                statusIcon = '✅';
                statusText = 'Confirmed';
                statusColor = 'text-green-400';
              } else if (ref.status === 'claimable') {
                if (ref.referrer_claimed && !ref.referred_claimed) {
                  statusIcon = '⏳';
                  statusText = 'Waiting for them';
                  statusColor = 'text-blue-400';
                } else if (!ref.referrer_claimed && ref.referred_claimed) {
                  statusIcon = '💬';
                  statusText = 'Waiting for you';
                  statusColor = 'text-yellow-400';
                } else {
                  statusIcon = '🔔';
                  statusText = 'Ready to confirm';
                  statusColor = 'text-yellow-400';
                }
              }

              return (
                <div
                  key={ref.referralId}
                  className="p-4 flex items-center justify-between hover:bg-slate-700/50 cursor-pointer transition-all group"
                  onClick={() => router.push(`/profile/${ref.username}`)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={ref.pfp_url || '/battlefield-logo.jpg'}
                      alt=""
                      className="w-10 h-10 rounded-full border-2 border-slate-600 group-hover:border-yellow-500 transition-all"
                    />
                    <div>
                      <span className="text-blue-400 font-medium underline decoration-blue-400/50 group-hover:text-yellow-400 group-hover:decoration-yellow-400/50 transition-all">
                        {ref.username}
                      </span>
                      <p className={`text-xs ${statusColor} flex items-center gap-1`}>
                        <span>{statusIcon}</span> {statusText}
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-500 group-hover:text-yellow-400 transition-all">→</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Referral Claim Confirmation Modal */}
      {showClaimConfirmModal &&
        referralData &&
        (() => {
          const selectedReferral = referralData.claimableReferrals.find(
            (r) => r.referralId === showClaimConfirmModal
          );
          if (!selectedReferral) return null;

          return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
              <div className="bg-slate-800 border-2 border-yellow-500 rounded-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                <div className="text-center mb-4">
                  <span className="text-5xl">🤝</span>
                  <h3 className="text-xl font-bold text-yellow-400 mt-2">Confirm Referral</h3>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={selectedReferral.pfpUrl || '/battlefield-logo.jpg'}
                      alt=""
                      className="w-12 h-12 rounded-full border-2 border-yellow-500"
                    />
                    <div>
                      <p className="text-white font-bold">{selectedReferral.username}</p>
                      <p className="text-gray-400 text-xs">
                        {selectedReferral.type === 'asReferrer'
                          ? 'You referred them'
                          : 'They referred you'}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-3">
                    Confirming this referral with{' '}
                    <span className="text-yellow-400 font-bold">{selectedReferral.username}</span>.
                  </p>

                  {selectedReferral.theyConfirmed ? (
                    <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3">
                      <p className="text-green-400 text-sm font-bold mb-1">
                        🎉 Ready to complete!
                      </p>
                      <p className="text-gray-300 text-xs">
                        {selectedReferral.username} has already confirmed. Once you confirm,
                        you&apos;ll both receive{' '}
                        <span className="text-yellow-400 font-bold">
                          ${selectedReferral.reward.toLocaleString()}
                        </span>
                        !
                      </p>
                    </div>
                  ) : (
                    <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
                      <p className="text-blue-400 text-sm font-bold mb-1">⏳ Waiting for friend</p>
                      <p className="text-gray-300 text-xs">
                        After you confirm, {selectedReferral.username} also needs to confirm. Once
                        both confirm, you&apos;ll each get{' '}
                        <span className="text-yellow-400 font-bold">
                          ${selectedReferral.reward.toLocaleString()}
                        </span>
                        !
                      </p>
                    </div>
                  )}

                  <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mt-3">
                    <p className="text-red-400 text-sm font-bold mb-1">🚨 Important:</p>
                    <p className="text-gray-300 text-xs">
                      Once confirmed, this referral becomes{' '}
                      <span className="text-red-400 font-bold">permanent</span>. You cannot change
                      or cancel it after confirming.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClaimConfirmModal(null)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const refId = showClaimConfirmModal;
                      setShowClaimConfirmModal(null);
                      handleClaimReferral(refId);
                    }}
                    disabled={!!claimingReferral}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-bold py-3 rounded-lg transition-all"
                  >
                    {claimingReferral ? 'Confirming...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
