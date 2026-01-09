'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState } from 'react';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowModal(!showModal)}
          className="bg-slate-800 border-2 border-blue-500 rounded-lg px-4 py-2 text-white hover:bg-slate-700"
        >
          {address.slice(0, 6)}...{address.slice(-4)}
        </button>
        
        {showModal && (
          <div className="absolute right-0 mt-2 w-64 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-xl z-50">
            <div className="p-4">
              <div className="text-sm text-gray-400 mb-2">Connected</div>
              <div className="text-white font-mono text-sm mb-4">
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
              <button
                onClick={() => {
                  disconnect();
                  setShowModal(false);
                }}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-bold"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowModal(!showModal)}
        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold"
      >
        Connect Wallet
      </button>
      
      {showModal && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-xl z-50">
          <div className="p-4">
            <div className="text-white font-bold mb-3">Select Wallet</div>
            <div className="space-y-2">
              {connectors
                .filter((connector) => connector.id === 'injected')
                .map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => {
                      connect({ connector });
                      setShowModal(false);
                    }}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold text-left px-4"
                  >
                    MetaMask / Browser Wallet
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
