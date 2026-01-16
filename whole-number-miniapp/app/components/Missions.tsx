'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../config/api';
import toast from 'react-hot-toast';
import sdk from '@farcaster/miniapp-sdk';

interface Mission {
  id: number;
  mission_key: string;
  mission_type: 'daily' | 'weekly' | 'onetime';
  title: string;
  description: string;
  objective_type: string;
  objective_value: number;
  reward_amount: number; // in cents
  icon: string;
  progress: number;
  is_completed: boolean;
  is_claimed: boolean;
  period_start: string;
  period_end: string;
}

interface MissionsProps {
  walletAddress?: string;
  readOnly?: boolean;
}

function formatReward(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatTimeRemaining(endDate: string): string {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Resetting...';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  return `${hours}h ${minutes}m`;
}

export function Missions({ walletAddress, readOnly = false }: MissionsProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [dailyReset, setDailyReset] = useState<string>('');
  const [weeklyReset, setWeeklyReset] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [completingKey, setCompletingKey] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch(getApiUrl(`api/missions/${walletAddress}`));
      const data = await response.json();

      if (data.success) {
        setMissions(data.missions);
        setDailyReset(data.daily_reset);
        setWeeklyReset(data.weekly_reset);
      }
    } catch (error) {
      console.error('Error fetching missions:', error);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchMissions();

    // Refresh every 30 seconds
    const interval = setInterval(fetchMissions, 30000);
    return () => clearInterval(interval);
  }, [fetchMissions]);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update countdown
      setMissions(m => [...m]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = async (missionId: number) => {
    if (!walletAddress) return;

    setClaimingId(missionId);
    try {
      const response = await fetch(getApiUrl(`api/missions/${missionId}/claim`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`+${formatReward(data.reward * 100)} claimed!`);
        fetchMissions();
      } else {
        toast.error(data.message || 'Failed to claim');
      }
    } catch (error) {
      console.error('Error claiming mission:', error);
      toast.error('Failed to claim reward');
    } finally {
      setClaimingId(null);
    }
  };

  const handleFollowMission = async () => {
    if (!walletAddress) return;

    setCompletingKey('follow_btcbattle');

    try {
      // Check if in Farcaster context
      let isInFarcaster = false;
      try {
        const context = await sdk.context;
        isInFarcaster = !!(context && context.user && context.user.fid);
      } catch {
        isInFarcaster = false;
      }

      // Open @btcbattle profile first
      const followUrl1 = 'https://warpcast.com/btcbattle';
      if (isInFarcaster) {
        await sdk.actions.openUrl(followUrl1);
      } else {
        window.open(followUrl1, '_blank');
      }

      // Open @elalpha.eth profile after a short delay
      setTimeout(async () => {
        const followUrl2 = 'https://warpcast.com/elalpha.eth';
        if (isInFarcaster) {
          await sdk.actions.openUrl(followUrl2);
        } else {
          window.open(followUrl2, '_blank');
        }
      }, 1500);

      // Show toast with instructions
      toast('👆 Follow both accounts, then tap "Verify" to complete!', { duration: 5000 });

    } catch (error) {
      console.error('Error with follow mission:', error);
    } finally {
      setCompletingKey(null);
    }
  };

  // Verify follow and complete mission
  const handleVerifyFollow = async () => {
    if (!walletAddress) return;

    setCompletingKey('follow_btcbattle');

    try {
      // Check if user is in Farcaster context first
      let isInFarcaster = false;
      try {
        const context = await sdk.context;
        isInFarcaster = !!(context && context.user && context.user.fid);
      } catch {
        isInFarcaster = false;
      }

      // If not a Farcaster user, redirect to sign up
      if (!isInFarcaster) {
        const signupUrl = 'https://farcaster.xyz/~/code/C46NY7';
        toast('📱 Join Farcaster to verify follows!', { duration: 4000 });
        window.open(signupUrl, '_blank');
        return;
      }

      // First verify the follow
      const verifyResponse = await fetch(getApiUrl(`api/missions/verify-follow/${walletAddress}`));
      const verifyData = await verifyResponse.json();

      if (!verifyData.verified) {
        if (verifyData.missingAccounts && verifyData.missingAccounts.length > 0) {
          toast.error(`Please follow: ${verifyData.missingAccounts.map((u: string) => '@' + u).join(', ')}`);
        } else {
          toast.error(verifyData.message || 'Please follow both accounts first');
        }
        return;
      }

      // If verified, complete the mission
      const response = await fetch(getApiUrl('api/missions/complete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, missionKey: 'follow_btcbattle' })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('🎉 Follow verified! +$5,000 - Claim your reward!');
        fetchMissions();
      } else {
        toast.error(data.message || 'Failed to complete mission');
      }
    } catch (error) {
      console.error('Error verifying follow:', error);
      toast.error('Failed to verify follow status');
    } finally {
      setCompletingKey(null);
    }
  };

  const onetimeMissions = missions.filter(m => m.mission_type === 'onetime');
  const dailyMissions = missions.filter(m => m.mission_type === 'daily');
  const weeklyMissions = missions.filter(m => m.mission_type === 'weekly');

  if (!walletAddress) {
    return (
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6 text-center">
        <p className="text-gray-400">Connect wallet to view missions</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6 text-center">
        <div className="animate-spin text-4xl mb-2">🎯</div>
        <p className="text-gray-400">Loading missions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* One-Time Bonus - Show only if not all claimed */}
      {onetimeMissions.some(m => !m.is_claimed) && (
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-yellow-500/50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-yellow-400">🎁 Welcome Bonus!</h3>
            <span className="text-sm text-yellow-300 font-bold">ONE-TIME ONLY</span>
          </div>
          <div className="p-4 space-y-3">
            {onetimeMissions.filter(m => !m.is_claimed).map(mission => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onClaim={handleClaim}
                onFollow={mission.mission_key === 'follow_btcbattle' ? handleFollowMission : undefined}
                onVerify={mission.mission_key === 'follow_btcbattle' ? handleVerifyFollow : undefined}
                isClaiming={claimingId === mission.id}
                isCompleting={completingKey === mission.mission_key}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>
      )}

      {/* Daily Missions */}
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-yellow-400">Daily Missions</h3>
          <span className="text-sm text-gray-400">
            Resets in {formatTimeRemaining(dailyReset)}
          </span>
        </div>
        <div className="p-4 space-y-3">
          {dailyMissions.map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onClaim={handleClaim}
              isClaiming={claimingId === mission.id}
              isCompleting={completingKey === mission.mission_key}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>

      {/* Weekly Missions */}
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-purple-400">Weekly Missions</h3>
          <span className="text-sm text-gray-400">
            Resets in {formatTimeRemaining(weeklyReset)}
          </span>
        </div>
        <div className="p-4 space-y-3">
          {weeklyMissions.map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onClaim={handleClaim}
              isClaiming={claimingId === mission.id}
              isCompleting={false}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface MissionCardProps {
  mission: Mission;
  onClaim: (id: number) => void;
  onFollow?: () => void;
  onVerify?: () => void;
  isClaiming: boolean;
  isCompleting: boolean;
  readOnly?: boolean;
}

function MissionCard({ mission, onClaim, onFollow, onVerify, isClaiming, isCompleting, readOnly = false }: MissionCardProps) {
  const progressPercent = Math.min(100, (mission.progress / mission.objective_value) * 100);
  const isFollowMission = mission.mission_key === 'follow_btcbattle';

  // Determine status colors
  let borderColor = 'border-slate-600';
  let statusBg = 'bg-slate-700';

  if (mission.is_claimed) {
    borderColor = 'border-gray-600';
    statusBg = 'bg-gray-700';
  } else if (mission.is_completed) {
    borderColor = 'border-green-500';
    statusBg = 'bg-green-900/30';
  } else if (mission.progress > 0) {
    borderColor = 'border-yellow-500';
    statusBg = 'bg-yellow-900/20';
  }

  return (
    <div className={`border-l-4 ${borderColor} ${statusBg} rounded-r-lg p-4`}>
      <div className="flex items-start justify-between gap-3">
        {/* Icon & Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{mission.icon}</span>
            <h4 className="font-bold text-white">{mission.title}</h4>
          </div>
          <p className="text-sm text-gray-400 mb-2">{mission.description}</p>

          {/* Progress bar */}
          {!mission.is_claimed && (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    mission.is_completed ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {mission.progress}/{mission.objective_value}
              </span>
            </div>
          )}
        </div>

        {/* Reward & Action */}
        <div className="text-right">
          <div className={`text-sm font-bold mb-2 ${mission.is_claimed ? 'text-gray-500' : 'text-green-400'}`}>
            {mission.is_claimed ? 'Claimed' : formatReward(mission.reward_amount)}
          </div>

          {mission.is_claimed ? (
            <span className="text-green-500 text-xl">✓</span>
          ) : readOnly ? (
            // Show status indicator in read-only mode
            mission.is_completed ? (
              <span className="text-xs text-green-400 font-medium">Ready to claim</span>
            ) : (
              <span className="text-xs text-gray-500">In progress</span>
            )
          ) : mission.is_completed ? (
            <button
              onClick={() => onClaim(mission.id)}
              disabled={isClaiming}
              className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm font-bold transition-all disabled:opacity-50"
            >
              {isClaiming ? '...' : 'Claim'}
            </button>
          ) : isFollowMission && onFollow && onVerify ? (
            <div className="flex gap-1">
              <button
                onClick={onFollow}
                disabled={isCompleting}
                className="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded text-xs font-bold transition-all disabled:opacity-50"
              >
                Follow
              </button>
              <button
                onClick={onVerify}
                disabled={isCompleting}
                className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs font-bold transition-all disabled:opacity-50"
              >
                {isCompleting ? '...' : 'Verify'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
