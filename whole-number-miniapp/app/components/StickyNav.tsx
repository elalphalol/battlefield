'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import MiniKit from '@worldcoin/minikit-js';

export function StickyNav() {
  const router = useRouter();
  const [fid, setFid] = useState<string | null>(null);

  useEffect(() => {
    if (MiniKit.isInstalled()) {
      const userData = MiniKit.user;
      if (userData?.username) {
        setFid(userData.username);
      }
    }
  }, []);

  const goToBattlefield = () => {
    router.push('/battlefield');
  };

  const goToMyProfile = () => {
    if (fid) {
      router.push(`/profile/${fid}`);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
      {/* Profile Button */}
      {fid && (
        <button
          onClick={goToMyProfile}
          className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold rounded-full shadow-2xl transition-all duration-200 hover:scale-110 flex items-center gap-2 text-lg"
          title="My Profile"
        >
          👤 Profile
        </button>
      )}
      
      {/* Battlefield Button */}
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
