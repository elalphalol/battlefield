'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';

export function StickyNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { address } = useAccount();

  // Only show on profile pages, not on battlefield
  const isProfilePage = pathname?.startsWith('/profile');
  
  if (!isProfilePage) {
    return null;
  }

  const goToBattlefield = () => {
    router.push('/battlefield');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={goToBattlefield}
        className="px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-slate-900 font-bold rounded-full shadow-2xl transition-all duration-200 hover:scale-110 flex items-center gap-2 text-lg"
        title="Go to Battlefield"
      >
        ⚔️ Battlefield
      </button>
    </div>
  );
}
