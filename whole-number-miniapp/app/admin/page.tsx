'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../config/api';
import toast from 'react-hot-toast';

// Simple password protection - change this to your secret
const ADMIN_PASSWORD = 'battlefield2024admin';

interface User {
  id: number;
  fid: number;
  username: string;
  wallet_address: string;
  army: 'bears' | 'bulls';
  paper_balance: number;
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  times_liquidated: number;
  battle_tokens_earned: number;
  created_at: string;
  last_active: string;
}

interface UserOverview {
  total: number;
  active24h: number;
  active7d: number;
  active30d: number;
  withTrades: number;
  powerTraders: number;
  superTraders: number;
}

interface TradingDay {
  day: string;
  trades_opened: string;
  closed: string;
  liquidated: string;
  unique_traders: string;
  avg_leverage: string;
  total_volume: string;
}

interface LeverageData {
  leverage: number;
  trade_count: string;
  percentage: string;
  unique_users: string;
}

interface ArmyData {
  army: string;
  users: string;
  avg_pnl: string;
  total_pnl: string;
  avg_trades: string;
}

interface PositionTypeData {
  position_type: string;
  count: string;
  percentage: string;
  wins: string;
  losses: string;
  liquidations: string;
  profit: string;
  loss: string;
}

interface TopTrader {
  username: string;
  army: string;
  total_trades: number;
  pnl: string;
  winning_trades: number;
  win_rate: string;
  liquidations: number;
  balance: string;
}

interface HourlyData {
  hour_utc: number;
  trades: string;
  unique_traders: string;
}

interface NewUserDay {
  day: string;
  new_users: string;
}

interface RetentionData {
  metric: string;
  count: number;
}

interface CurrentState {
  users_with_open: string;
  total_open: string;
  collateral_at_risk: string;
}

interface MissionEngagement {
  title: string;
  mission_type: string;
  total_progress: string;
  completed: string;
  claimed: string;
  reward: string;
}

interface ClaimsDay {
  day: string;
  claims: string;
  unique_claimers: string;
  total_claimed: string;
}

interface Activity {
  id: number;
  type: 'trade' | 'signup' | 'claim' | 'mission';
  action: string;
  username: string;
  army?: string;
  amount?: number;
  pnl?: number;
  position_type?: string;
  leverage?: number;
  mission_title?: string;
  mission_icon?: string;
  timestamp: string;
}

interface Analytics {
  totalUsers: number;
  activeUsers24h: number;
  totalTrades: number;
  totalVolume: number;
  bullsCount: number;
  bearsCount: number;
  bullsPnl: number;
  bearsPnl: number;
  totalMissionsClaimed: number;
  totalMissionsRewards: number;
  userOverview: UserOverview;
  tradingByDay: TradingDay[];
  leverageDistribution: LeverageData[];
  armyAnalysis: ArmyData[];
  positionTypeAnalysis: PositionTypeData[];
  topTraders: TopTrader[];
  hourlyActivity: HourlyData[];
  newUsersByDay: NewUserDay[];
  retentionFunnel: RetentionData[];
  currentState: CurrentState;
  missionsEngagement: MissionEngagement[];
  claimsActivity: ClaimsDay[];
}

interface Mission {
  id: number;
  mission_key: string;
  mission_type: string;
  title: string;
  description: string;
  objective_type: string;
  objective_value: number;
  reward_amount: number;
  icon: string;
  is_active: boolean;
  completions_count?: number;
  claims_count?: number;
}

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalRewardsDistributed: number;
}

interface TopReferrer {
  username: string;
  pfp_url: string;
  referral_count: number;
  earnings_dollars: number;
}

interface ReferralActivity {
  referrer_username: string;
  referred_username: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'missions' | 'referrals'>('analytics');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Activity feed state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editBalance, setEditBalance] = useState('');

  // Missions state
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);

  // Referrals state
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [referralActivity, setReferralActivity] = useState<ReferralActivity[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(false);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success('Welcome, Admin!');
    } else {
      toast.error('Invalid password');
    }
  };

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch(getApiUrl('api/admin/analytics'));
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const response = await fetch(getApiUrl('api/admin/activity?limit=50'));
      const data = await response.json();
      if (data.success) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
      fetchActivities();
    }
  }, [isAuthenticated, fetchAnalytics, fetchActivities]);

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;

    const interval = setInterval(() => {
      fetchAnalytics();
      fetchActivities();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh, fetchAnalytics, fetchActivities]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'users') {
      fetchUsers();
    }
  }, [isAuthenticated, activeTab, userPage, userSearch]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'missions') {
      fetchMissions();
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'referrals') {
      fetchReferrals();
    }
  }, [isAuthenticated, activeTab]);

  const fetchReferrals = async () => {
    setReferralsLoading(true);
    try {
      const response = await fetch(getApiUrl('api/admin/referrals'));
      const data = await response.json();
      if (data.success) {
        setReferralStats(data.stats);
        setTopReferrers(data.topReferrers);
        setReferralActivity(data.recentActivity);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Failed to fetch referral data');
    } finally {
      setReferralsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        page: userPage.toString(),
        limit: '20',
        ...(userSearch && { search: userSearch })
      });
      const response = await fetch(getApiUrl(`api/admin/users?${params}`));
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        setTotalUsers(data.total);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchMissions = async () => {
    setMissionsLoading(true);
    try {
      const response = await fetch(getApiUrl('api/admin/missions'));
      const data = await response.json();
      if (data.success) {
        setMissions(data.missions);
      }
    } catch (error) {
      console.error('Error fetching missions:', error);
      toast.error('Failed to fetch missions');
    } finally {
      setMissionsLoading(false);
    }
  };

  const updateUserBalance = async () => {
    if (!selectedUser || !editBalance) return;

    try {
      const response = await fetch(getApiUrl('api/admin/users/balance'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          newBalance: Number(editBalance)
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Balance updated to $${Number(editBalance).toLocaleString()}`);
        setSelectedUser(null);
        setEditBalance('');
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to update balance');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('Failed to update balance');
    }
  };

  const resetUserStats = async (userId: number) => {
    if (!confirm('Are you sure you want to reset this user\'s stats?')) return;

    try {
      const response = await fetch(getApiUrl('api/admin/users/reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('User stats reset');
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to reset stats');
      }
    } catch (error) {
      console.error('Error resetting stats:', error);
      toast.error('Failed to reset stats');
    }
  };

  const updateMission = async (mission: Mission) => {
    try {
      const response = await fetch(getApiUrl('api/admin/missions/update'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mission)
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Mission updated');
        setEditingMission(null);
        fetchMissions();
      } else {
        toast.error(data.message || 'Failed to update mission');
      }
    } catch (error) {
      console.error('Error updating mission:', error);
      toast.error('Failed to update mission');
    }
  };

  const toggleMissionActive = async (missionId: number, isActive: boolean) => {
    try {
      const response = await fetch(getApiUrl('api/admin/missions/toggle'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId, isActive: !isActive })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Mission ${!isActive ? 'activated' : 'deactivated'}`);
        fetchMissions();
      }
    } catch (error) {
      console.error('Error toggling mission:', error);
      toast.error('Failed to toggle mission');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-800 border-2 border-yellow-500 rounded-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Admin Access</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Enter admin password"
            className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 rounded-lg transition-all"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800 border-2 border-yellow-500 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-yellow-400">Admin Dashboard</h1>
              {lastUpdated && (
                <p className="text-gray-400 text-sm mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 accent-yellow-500"
                />
                <span className="text-gray-300 text-sm">Auto-refresh (30s)</span>
              </label>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 rounded-lg font-bold text-lg transition-all ${
              activeTab === 'analytics'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 rounded-lg font-bold text-lg transition-all ${
              activeTab === 'users'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('missions')}
            className={`py-4 rounded-lg font-bold text-lg transition-all ${
              activeTab === 'missions'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Missions
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`py-4 rounded-lg font-bold text-lg transition-all ${
              activeTab === 'referrals'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Referrals
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analyticsLoading && !analytics ? (
              <div className="text-center py-12">
                <div className="animate-spin text-4xl mb-4">Loading...</div>
              </div>
            ) : analytics ? (
              <>
                {/* User Overview Cards */}
                <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-yellow-400 mb-4">User Overview</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <p className="text-gray-400 text-xs">Total Users</p>
                      <p className="text-2xl font-bold text-white">{analytics.userOverview?.total || analytics.totalUsers}</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <p className="text-gray-400 text-xs">Active 24h</p>
                      <p className="text-2xl font-bold text-green-400">{analytics.userOverview?.active24h || analytics.activeUsers24h}</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <p className="text-gray-400 text-xs">Active 7d</p>
                      <p className="text-2xl font-bold text-blue-400">{analytics.userOverview?.active7d || '-'}</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <p className="text-gray-400 text-xs">With Trades</p>
                      <p className="text-2xl font-bold text-purple-400">{analytics.userOverview?.withTrades || '-'}</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <p className="text-gray-400 text-xs">Power (10+)</p>
                      <p className="text-2xl font-bold text-orange-400">{analytics.userOverview?.powerTraders || '-'}</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <p className="text-gray-400 text-xs">Super (20+)</p>
                      <p className="text-2xl font-bold text-pink-400">{analytics.userOverview?.superTraders || '-'}</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <p className="text-gray-400 text-xs">Total Trades</p>
                      <p className="text-2xl font-bold text-cyan-400">{analytics.totalTrades}</p>
                    </div>
                  </div>
                </div>

                {/* Current State - Live Positions */}
                {analytics.currentState && (
                  <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-2 border-purple-500 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-purple-400 mb-4">Live Right Now</h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Users with Open Positions</p>
                        <p className="text-3xl font-bold text-white">{analytics.currentState.users_with_open || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Total Open Positions</p>
                        <p className="text-3xl font-bold text-yellow-400">{analytics.currentState.total_open || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Collateral at Risk</p>
                        <p className="text-3xl font-bold text-red-400">${Number(analytics.currentState.collateral_at_risk || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Activity Feed */}
                <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-yellow-400">Recent Activity (24h)</h2>
                    <button
                      onClick={fetchActivities}
                      disabled={activitiesLoading}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm font-bold transition-all disabled:opacity-50"
                    >
                      {activitiesLoading ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>

                  {activitiesLoading && activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">Loading activity...</div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No recent activity</div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {activities.map((activity, idx) => {
                        const time = new Date(activity.timestamp);
                        const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        const armyIcon = activity.army === 'bulls' ? '🐂' : activity.army === 'bears' ? '🐻' : '';

                        let icon = '';
                        let text = '';
                        let colorClass = 'text-gray-300';

                        switch (activity.type) {
                          case 'trade':
                            if (activity.action === 'open') {
                              icon = activity.position_type === 'long' ? '📈' : '📉';
                              text = `opened ${activity.position_type?.toUpperCase()} ${activity.leverage}x ($${activity.amount?.toLocaleString()})`;
                              colorClass = 'text-blue-400';
                            } else if (activity.action === 'stopped') {
                              icon = '🛡️';
                              const pnlSign = (activity.pnl ?? 0) >= 0 ? '+' : '';
                              text = `STOP LOSS ${pnlSign}$${Math.abs(activity.pnl ?? 0).toLocaleString()}`;
                              colorClass = 'text-yellow-400';
                            } else if (activity.action === 'closed') {
                              icon = (activity.pnl ?? 0) >= 0 ? '💰' : '📉';
                              const pnlSign = (activity.pnl ?? 0) >= 0 ? '+' : '';
                              text = `closed trade ${pnlSign}$${Math.abs(activity.pnl ?? 0).toLocaleString()}`;
                              colorClass = (activity.pnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400';
                            } else if (activity.action === 'liquidated') {
                              icon = '💥';
                              text = `LIQUIDATED -$${Math.abs(activity.pnl ?? activity.amount ?? 0).toLocaleString()}`;
                              colorClass = 'text-orange-400';
                            }
                            break;
                          case 'signup':
                            icon = '👋';
                            text = `joined BATTLEFIELD`;
                            colorClass = 'text-purple-400';
                            break;
                          case 'claim':
                            icon = '💵';
                            text = `claimed $${activity.amount?.toLocaleString()} paper money`;
                            colorClass = 'text-cyan-400';
                            break;
                          case 'mission':
                            icon = activity.mission_icon || '🎯';
                            if (activity.action === 'mission_claimed') {
                              text = `claimed "${activity.mission_title}" +$${activity.amount?.toLocaleString()}`;
                              colorClass = 'text-yellow-400';
                            } else {
                              text = `completed "${activity.mission_title}"`;
                              colorClass = 'text-green-400';
                            }
                            break;
                        }

                        return (
                          <div
                            key={`${activity.type}-${activity.id}-${idx}`}
                            className="flex items-center gap-3 py-2 px-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all"
                          >
                            <span className="text-gray-500 text-xs w-14 shrink-0">{timeStr}</span>
                            <span className="text-lg shrink-0">{icon}</span>
                            <span className="text-white font-bold shrink-0">{armyIcon} {activity.username}</span>
                            <span className={`${colorClass} truncate`}>{text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Trading Activity by Day */}
                {analytics.tradingByDay && analytics.tradingByDay.length > 0 && (
                  <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-yellow-400 mb-4">Trading Activity (Last 14 Days)</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-2 text-gray-400">Date</th>
                            <th className="text-right py-2 text-gray-400">Trades</th>
                            <th className="text-right py-2 text-gray-400">Closed</th>
                            <th className="text-right py-2 text-gray-400">Liquidated</th>
                            <th className="text-right py-2 text-gray-400">Traders</th>
                            <th className="text-right py-2 text-gray-400">Avg Lev</th>
                            <th className="text-right py-2 text-gray-400">Volume</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.tradingByDay.map((day, i) => (
                            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                              <td className="py-2 text-white">{formatDate(day.day)}</td>
                              <td className="py-2 text-right text-blue-400 font-bold">{day.trades_opened}</td>
                              <td className="py-2 text-right text-green-400">{day.closed}</td>
                              <td className="py-2 text-right text-red-400">{day.liquidated}</td>
                              <td className="py-2 text-right text-purple-400">{day.unique_traders}</td>
                              <td className="py-2 text-right text-orange-400">{day.avg_leverage}x</td>
                              <td className="py-2 text-right text-cyan-400">${Number(day.total_volume).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Army Stats & Long vs Short - Side by Side */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Army Stats */}
                  <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-yellow-400 mb-4">Army Analysis</h2>
                    {analytics.armyAnalysis && analytics.armyAnalysis.map((army, i) => (
                      <div
                        key={i}
                        className={`mb-4 p-4 rounded-lg ${
                          army.army === 'bulls'
                            ? 'bg-green-900/30 border border-green-500'
                            : 'bg-red-900/30 border border-red-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{army.army === 'bulls' ? '🐂' : '🐻'}</span>
                          <span className={`font-bold text-lg ${army.army === 'bulls' ? 'text-green-400' : 'text-red-400'}`}>
                            {army.army?.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-gray-400">Users:</span> <span className="text-white font-bold">{army.users}</span></div>
                          <div><span className="text-gray-400">Avg Trades:</span> <span className="text-white font-bold">{army.avg_trades}</span></div>
                          <div><span className="text-gray-400">Avg P&L:</span> <span className={`font-bold ${Number(army.avg_pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>${army.avg_pnl}</span></div>
                          <div><span className="text-gray-400">Total P&L:</span> <span className={`font-bold ${Number(army.total_pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>${Number(army.total_pnl).toLocaleString()}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Long vs Short */}
                  <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-yellow-400 mb-4">Long vs Short</h2>
                    {analytics.positionTypeAnalysis && analytics.positionTypeAnalysis.map((pt, i) => (
                      <div
                        key={i}
                        className={`mb-4 p-4 rounded-lg ${
                          pt.position_type === 'long'
                            ? 'bg-green-900/30 border border-green-500'
                            : 'bg-red-900/30 border border-red-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{pt.position_type === 'long' ? '📈' : '📉'}</span>
                          <span className={`font-bold text-lg ${pt.position_type === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                            {pt.position_type?.toUpperCase()} ({pt.percentage}%)
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-gray-400">Count:</span> <span className="text-white font-bold">{pt.count}</span></div>
                          <div><span className="text-gray-400">Liquidations:</span> <span className="text-red-400 font-bold">{pt.liquidations}</span></div>
                          <div><span className="text-gray-400">Wins:</span> <span className="text-green-400 font-bold">{pt.wins}</span></div>
                          <div><span className="text-gray-400">Losses:</span> <span className="text-red-400 font-bold">{pt.losses}</span></div>
                          <div><span className="text-gray-400">Profit:</span> <span className="text-green-400 font-bold">${Number(pt.profit).toLocaleString()}</span></div>
                          <div><span className="text-gray-400">Loss:</span> <span className="text-red-400 font-bold">${Number(pt.loss).toLocaleString()}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Traders */}
                {analytics.topTraders && analytics.topTraders.length > 0 && (
                  <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-yellow-400 mb-4">Top Traders by Activity</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-2 text-gray-400">User</th>
                            <th className="text-center py-2 text-gray-400">Army</th>
                            <th className="text-right py-2 text-gray-400">Trades</th>
                            <th className="text-right py-2 text-gray-400">P&L</th>
                            <th className="text-right py-2 text-gray-400">Win Rate</th>
                            <th className="text-right py-2 text-gray-400">Liqs</th>
                            <th className="text-right py-2 text-gray-400">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.topTraders.map((trader, i) => (
                            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                              <td className="py-2 text-white font-bold">{trader.username}</td>
                              <td className="py-2 text-center">
                                <span className={trader.army === 'bulls' ? 'text-green-400' : 'text-red-400'}>
                                  {trader.army === 'bulls' ? '🐂' : '🐻'}
                                </span>
                              </td>
                              <td className="py-2 text-right text-blue-400 font-bold">{trader.total_trades}</td>
                              <td className={`py-2 text-right font-bold ${Number(trader.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {Number(trader.pnl) >= 0 ? '+' : ''}${Number(trader.pnl).toLocaleString()}
                              </td>
                              <td className="py-2 text-right text-purple-400">{trader.win_rate}%</td>
                              <td className="py-2 text-right text-red-400">{trader.liquidations}</td>
                              <td className="py-2 text-right text-cyan-400">${Number(trader.balance).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Leverage Distribution & Hourly Activity - Side by Side */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Leverage Distribution */}
                  {analytics.leverageDistribution && analytics.leverageDistribution.length > 0 && (
                    <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
                      <h2 className="text-xl font-bold text-yellow-400 mb-4">Leverage Distribution</h2>
                      <div className="space-y-2">
                        {analytics.leverageDistribution.map((lev, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-orange-400 font-bold w-12">{lev.leverage}x</span>
                            <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-yellow-500 h-full"
                                style={{ width: `${Math.min(parseFloat(lev.percentage), 100)}%` }}
                              />
                            </div>
                            <span className="text-gray-400 text-sm w-20 text-right">{lev.trade_count} ({lev.percentage}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hourly Activity */}
                  {analytics.hourlyActivity && analytics.hourlyActivity.length > 0 && (
                    <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
                      <h2 className="text-xl font-bold text-yellow-400 mb-4">Peak Hours (UTC)</h2>
                      <div className="space-y-2">
                        {analytics.hourlyActivity.map((hour, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-blue-400 font-bold w-16">{hour.hour_utc}:00</span>
                            <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full"
                                style={{ width: `${Math.min((parseInt(hour.trades) / parseInt(analytics.hourlyActivity[0].trades)) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-gray-400 text-sm w-24 text-right">{hour.trades} trades</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Retention Funnel */}
                {analytics.retentionFunnel && analytics.retentionFunnel.length > 0 && (
                  <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-yellow-400 mb-4">Retention Funnel</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {analytics.retentionFunnel.map((item, i) => {
                        const total = analytics.retentionFunnel.find(r => r.metric === 'Registered')?.count || 1;
                        const percentage = Math.round((item.count / total) * 100);
                        return (
                          <div key={i} className="bg-slate-700/50 rounded-lg p-3 text-center">
                            <p className="text-gray-400 text-xs">{item.metric}</p>
                            <p className="text-xl font-bold text-white">{item.count}</p>
                            <p className="text-xs text-purple-400">{percentage}%</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Missions Engagement */}
                {analytics.missionsEngagement && analytics.missionsEngagement.length > 0 && (
                  <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-yellow-400 mb-4">Missions Engagement</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-2 text-gray-400">Mission</th>
                            <th className="text-center py-2 text-gray-400">Type</th>
                            <th className="text-right py-2 text-gray-400">Completed</th>
                            <th className="text-right py-2 text-gray-400">Claimed</th>
                            <th className="text-right py-2 text-gray-400">Reward</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.missionsEngagement.map((mission, i) => (
                            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                              <td className="py-2 text-white">{mission.title}</td>
                              <td className="py-2 text-center">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  mission.mission_type === 'daily' ? 'bg-blue-600' :
                                  mission.mission_type === 'weekly' ? 'bg-purple-600' : 'bg-yellow-600'
                                }`}>
                                  {mission.mission_type}
                                </span>
                              </td>
                              <td className="py-2 text-right text-green-400">{mission.completed}</td>
                              <td className="py-2 text-right text-yellow-400">{mission.claimed}</td>
                              <td className="py-2 text-right text-cyan-400">${mission.reward}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* New Users & Claims Activity */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* New Users by Day */}
                  {analytics.newUsersByDay && analytics.newUsersByDay.length > 0 && (
                    <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
                      <h2 className="text-xl font-bold text-yellow-400 mb-4">New User Signups</h2>
                      <div className="space-y-2">
                        {analytics.newUsersByDay.map((day, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/50">
                            <span className="text-gray-400">{formatDate(day.day)}</span>
                            <span className="text-green-400 font-bold">+{day.new_users} users</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Claims Activity */}
                  {analytics.claimsActivity && analytics.claimsActivity.length > 0 && (
                    <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
                      <h2 className="text-xl font-bold text-yellow-400 mb-4">Claims Activity</h2>
                      <div className="space-y-2">
                        {analytics.claimsActivity.map((day, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/50">
                            <span className="text-gray-400">{formatDate(day.day)}</span>
                            <div className="text-right">
                              <span className="text-cyan-400 font-bold">{day.claims} claims</span>
                              <span className="text-gray-500 mx-2">|</span>
                              <span className="text-green-400">${Number(day.total_claimed).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={fetchAnalytics}
                  disabled={analyticsLoading}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                >
                  {analyticsLoading ? 'Refreshing...' : 'Refresh Analytics'}
                </button>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">Failed to load analytics</div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Search by username, wallet, or FID..."
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none"
              />
            </div>

            {/* Users List */}
            <div className="bg-slate-800 border-2 border-slate-700 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h2 className="text-xl font-bold text-yellow-400">Users ({totalUsers})</h2>
              </div>

              {usersLoading ? (
                <div className="p-8 text-center text-gray-400">Loading users...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-400 text-sm">User</th>
                        <th className="px-4 py-3 text-left text-gray-400 text-sm">Army</th>
                        <th className="px-4 py-3 text-right text-gray-400 text-sm">Balance</th>
                        <th className="px-4 py-3 text-right text-gray-400 text-sm">P&L</th>
                        <th className="px-4 py-3 text-right text-gray-400 text-sm">Trades</th>
                        <th className="px-4 py-3 text-center text-gray-400 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-white font-bold">{user.username || 'Anonymous'}</p>
                              <p className="text-gray-500 text-xs">FID: {user.fid}</p>
                              <p className="text-gray-500 text-xs font-mono">{user.wallet_address.slice(0, 8)}...</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={user.army === 'bulls' ? 'text-green-400' : 'text-red-400'}>
                              {user.army === 'bulls' ? '🐂' : '🐻'} {user.army}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-white font-bold">
                            ${Math.round(user.paper_balance).toLocaleString()}
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${user.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {user.total_pnl >= 0 ? '+' : ''}${Math.round(user.total_pnl).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-400">
                            {user.total_trades} ({user.winning_trades}W)
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setEditBalance(user.paper_balance.toString());
                                }}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => resetUserStats(user.id)}
                                className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm font-bold"
                              >
                                Reset
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              <div className="p-4 flex items-center justify-between">
                <button
                  onClick={() => setUserPage(p => Math.max(1, p - 1))}
                  disabled={userPage === 1}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-bold disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-400">Page {userPage}</span>
                <button
                  onClick={() => setUserPage(p => p + 1)}
                  disabled={users.length < 20}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-bold disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Missions Tab */}
        {activeTab === 'missions' && (
          <div className="space-y-6">
            <div className="bg-slate-800 border-2 border-slate-700 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-yellow-400">Missions</h2>
                <button
                  onClick={fetchMissions}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-bold"
                >
                  Refresh
                </button>
              </div>

              {missionsLoading ? (
                <div className="p-8 text-center text-gray-400">Loading missions...</div>
              ) : (
                <div className="p-4 space-y-4">
                  {missions.map((mission) => (
                    <div
                      key={mission.id}
                      className={`border-2 rounded-lg p-4 ${
                        mission.is_active ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{mission.icon}</span>
                            <h3 className="text-lg font-bold text-white">{mission.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded ${
                              mission.mission_type === 'daily' ? 'bg-blue-600' :
                              mission.mission_type === 'weekly' ? 'bg-purple-600' : 'bg-yellow-600'
                            }`}>
                              {mission.mission_type}
                            </span>
                            {!mission.is_active && (
                              <span className="text-xs px-2 py-1 rounded bg-red-600">INACTIVE</span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mb-2">{mission.description}</p>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Objective:</span>
                              <span className="text-white ml-2">{mission.objective_type} x{mission.objective_value}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Reward:</span>
                              <span className="text-green-400 ml-2">${(mission.reward_amount / 100).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Claims:</span>
                              <span className="text-white ml-2">{mission.claims_count || 0}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingMission(mission)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded font-bold text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleMissionActive(mission.id, mission.is_active)}
                            className={`${
                              mission.is_active
                                ? 'bg-red-600 hover:bg-red-500'
                                : 'bg-green-600 hover:bg-green-500'
                            } text-white px-3 py-2 rounded font-bold text-sm`}
                          >
                            {mission.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-yellow-400">Referral System</h2>
              <button
                onClick={fetchReferrals}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
              >
                Refresh
              </button>
            </div>

            {referralsLoading ? (
              <div className="p-8 text-center text-gray-400">Loading referral data...</div>
            ) : (
              <>
                {/* Stats Cards */}
                {referralStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-white">{referralStats.totalReferrals}</p>
                      <p className="text-gray-400 text-sm">Total Referrals</p>
                    </div>
                    <div className="bg-slate-800 border border-yellow-600 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-yellow-400">{referralStats.pendingReferrals}</p>
                      <p className="text-gray-400 text-sm">Pending</p>
                    </div>
                    <div className="bg-slate-800 border border-green-600 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-green-400">{referralStats.completedReferrals}</p>
                      <p className="text-gray-400 text-sm">Completed</p>
                    </div>
                    <div className="bg-slate-800 border border-purple-600 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-purple-400">${referralStats.totalRewardsDistributed.toLocaleString()}</p>
                      <p className="text-gray-400 text-sm">Rewards Given</p>
                    </div>
                  </div>
                )}

                {/* Top Referrers */}
                <div className="bg-slate-800 border-2 border-slate-700 rounded-lg">
                  <div className="p-4 border-b border-slate-700">
                    <h3 className="text-lg font-bold text-yellow-400">Top Referrers</h3>
                  </div>
                  <div className="p-4">
                    {topReferrers.length > 0 ? (
                      <div className="space-y-3">
                        {topReferrers.map((referrer, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-yellow-400">#{idx + 1}</span>
                              <img src={referrer.pfp_url || '/battlefield-logo.jpg'} alt="" className="w-10 h-10 rounded-full" />
                              <span className="text-white font-medium">{referrer.username}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 font-bold">{referrer.referral_count} referrals</p>
                              <p className="text-gray-400 text-sm">${referrer.earnings_dollars.toLocaleString()} earned</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">No referrers yet</p>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-slate-800 border-2 border-slate-700 rounded-lg">
                  <div className="p-4 border-b border-slate-700">
                    <h3 className="text-lg font-bold text-yellow-400">Recent Activity</h3>
                  </div>
                  <div className="p-4">
                    {referralActivity.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {referralActivity.map((activity, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{activity.referrer_username}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-white font-medium">{activity.referred_username}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-2 py-1 rounded ${
                                activity.status === 'completed' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                              }`}>
                                {activity.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {new Date(activity.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">No referral activity yet</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Edit User Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border-2 border-yellow-500 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Edit User: {selectedUser.username}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Paper Balance ($)</label>
                  <input
                    type="number"
                    value={editBalance}
                    onChange={(e) => setEditBalance(e.target.value)}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-gray-400">
                  <p>Current Balance: ${Math.round(selectedUser.paper_balance).toLocaleString()}</p>
                  <p>Total P&L: ${Math.round(selectedUser.total_pnl).toLocaleString()}</p>
                  <p>Trades: {selectedUser.total_trades} ({selectedUser.winning_trades} wins)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setEditBalance('');
                  }}
                  className="bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={updateUserBalance}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 py-3 rounded-lg font-bold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Mission Modal */}
        {editingMission && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border-2 border-yellow-500 rounded-lg p-6 max-w-lg w-full">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Edit Mission</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Title</label>
                  <input
                    type="text"
                    value={editingMission.title}
                    onChange={(e) => setEditingMission({ ...editingMission, title: e.target.value })}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Description</label>
                  <input
                    type="text"
                    value={editingMission.description}
                    onChange={(e) => setEditingMission({ ...editingMission, description: e.target.value })}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Objective Value</label>
                    <input
                      type="number"
                      value={editingMission.objective_value}
                      onChange={(e) => setEditingMission({ ...editingMission, objective_value: Number(e.target.value) })}
                      className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Reward (cents)</label>
                    <input
                      type="number"
                      value={editingMission.reward_amount}
                      onChange={(e) => setEditingMission({ ...editingMission, reward_amount: Number(e.target.value) })}
                      className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">= ${(editingMission.reward_amount / 100).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Icon (emoji)</label>
                  <input
                    type="text"
                    value={editingMission.icon}
                    onChange={(e) => setEditingMission({ ...editingMission, icon: e.target.value })}
                    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => setEditingMission(null)}
                  className="bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateMission(editingMission)}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 py-3 rounded-lg font-bold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
