'use client';

interface UserData {
  paper_balance: number;
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  current_streak: number;
  best_streak: number;
  times_liquidated: number;
  battle_tokens_earned: number;
}

interface UserStatsProps {
  userData: UserData | null;
}

export function UserStats({ userData }: UserStatsProps) {
  if (!userData) {
    return null;
  }

  const winRate = userData.total_trades > 0 
    ? ((userData.winning_trades / userData.total_trades) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4 min-w-[180px]">
      <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
        📊 Your Stats
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {/* Total P&L */}
        <div className="bg-slate-700/50 rounded-lg p-2">
          <div className="text-[10px] text-gray-400 mb-1">Total P&L</div>
          <div className={`text-lg font-bold break-all ${Number(userData.total_pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {Number(userData.total_pnl) >= 0 ? '+' : ''}${Number(userData.total_pnl).toFixed(1)}
          </div>
        </div>

        {/* Total Trades */}
        <div className="bg-slate-700/50 rounded-lg p-2">
          <div className="text-[10px] text-gray-400 mb-1">Total Trades</div>
          <div className="text-lg font-bold text-blue-400">
            {userData.total_trades}
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-700/50 rounded-lg p-2">
          <div className="text-[10px] text-gray-400 mb-1">Win Rate</div>
          <div className="text-lg font-bold text-purple-400">
            {winRate}% 🔥
          </div>
          <div className="text-[9px] text-gray-500 mt-1">
            {userData.winning_trades}W / {userData.total_trades - userData.winning_trades}L
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-slate-700/50 rounded-lg p-2">
          <div className="text-[10px] text-gray-400 mb-1">Current Streak</div>
          <div className="text-lg font-bold text-orange-400">
            🔥 {userData.current_streak}
          </div>
          <div className="text-[9px] text-gray-500 mt-1">
            Best: {userData.best_streak}
          </div>
        </div>

        {/* Times Liquidated */}
        <div className="bg-slate-700/50 rounded-lg p-2">
          <div className="text-[10px] text-gray-400 mb-1">Liquidations</div>
          <div className="text-lg font-bold text-red-400">
            💥 {userData.times_liquidated}
          </div>
        </div>

        {/* Battle Tokens */}
        <div className="bg-slate-700/50 rounded-lg p-2">
          <div className="text-[10px] text-gray-400 mb-1">$BATTLE Earned</div>
          <div className="text-lg font-bold text-yellow-400">
            {(userData.battle_tokens_earned / 1000000).toFixed(1)}M
          </div>
        </div>
      </div>
    </div>
  );
}
