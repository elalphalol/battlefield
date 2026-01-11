'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useEffect, useRef } from 'react';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        showModal &&
        modalRef.current &&
        buttonRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showModal]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showModal]);

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setShowModal(!showModal)}
          className="bg-slate-800 border-2 border-blue-500 rounded-lg px-3 sm:px-4 py-2 text-white hover:bg-slate-700 text-sm sm:text-base transition-all active:scale-95"
        >
          {address.slice(0, 6)}...{address.slice(-4)}
        </button>
        
        {showModal && (
          <>
            {/* Backdrop for mobile */}
            <div 
              className="fixed inset-0 bg-black/50 z-[100] md:hidden"
              onClick={() => setShowModal(false)}
            />
            
            {/* Modal */}
            <div 
              ref={modalRef}
              className="fixed md:absolute left-1/2 top-1/2 md:left-auto md:top-auto -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 md:right-0 md:mt-2 w-[90vw] max-w-[280px] md:w-64 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-xl z-[101] md:z-50"
            >
              <div className="p-4">
                <div className="text-sm text-gray-400 mb-2">Connected</div>
                <div className="text-white font-mono text-xs sm:text-sm mb-4 break-all">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </div>
                <button
                  onClick={() => {
                    disconnect();
                    setShowModal(false);
                  }}
                  className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white py-2 rounded-lg font-bold transition-all active:scale-95"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowModal(!showModal)}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-bold shadow-lg transition-all duration-200 hover:shadow-xl text-sm sm:text-base active:scale-95"
      >
        🔗 Connect Wallet
      </button>
      
      {showModal && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black/50 z-[100] md:hidden"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal */}
          <div 
            ref={modalRef}
            className="fixed md:absolute left-1/2 top-1/2 md:left-auto md:top-auto -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 md:right-0 md:mt-2 w-[90vw] max-w-[320px] md:w-80 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-xl z-[101] md:z-50"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-white font-bold">Select Wallet</div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white text-xl leading-none p-1"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => {
                      connect({ connector });
                      setShowModal(false);
                    }}
                    className="w-full bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white py-3 rounded-lg font-bold text-left px-4 flex items-center justify-between transition-all active:scale-98 text-sm sm:text-base"
                  >
                    <span>
                      {connector.id === 'injected' ? '🦊 Browser Wallet' : 
                       connector.id === 'walletConnect' ? '📱 Mobile Wallets' : 
                       connector.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
