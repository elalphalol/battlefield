'use client';

import { useRouter } from 'next/navigation';

export function StickyNav() {
  const router = useRouter();

  const goToBattlefield = () => {
    router.push('/battlefield');
  };

  const goToLeaderboard = () => {
    router.push('/?view=leaderboard');
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      <button
        onClick={goToBattlefield}
        className="px-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-full shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
        title="Go to Battlefield"
      >
        ⚔️ Battlefield
      </button>
      <button
        onClick={goToLeaderboard}
        className="px-4 py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-full shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
        title="View Leaderboard"
      >
        🏆 Leaderboard
      </button>
    </div>
  );
}
