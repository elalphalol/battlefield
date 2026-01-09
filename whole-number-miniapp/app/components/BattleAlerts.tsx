'use client';

import { useEffect, useState } from 'react';

interface Alert {
  id: string;
  icon: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: Date;
}

interface BattleAlertsProps {
  btcPrice: number;
  coordinate: number;
  beamsBroken: {
    beam226: boolean;
    beam113: boolean;
    beam086: boolean;
  };
}

export function BattleAlerts({ btcPrice, coordinate, beamsBroken }: BattleAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      icon: '🔔',
      message: 'Live BTC price tracking active. Strategy analysis running.',
      type: 'info',
      timestamp: new Date()
    }
  ]);

  useEffect(() => {
    // Add alert when entering dip buy zone (888-700)
    if (coordinate >= 700 && coordinate <= 888) {
      const alertId = `dip-${coordinate}`;
      if (!alerts.some(a => a.id === alertId)) {
        setAlerts(prev => [{
          id: alertId,
          icon: '🟢',
          message: `Entered DIP BUY ZONE (${coordinate})! Watch for long opportunities.`,
          type: 'success',
          timestamp: new Date()
        }, ...prev.slice(0, 3)]);
      }
    }

    // Add alert when beams break
    if (beamsBroken.beam086) {
      const alertId = 'beam-086';
      if (!alerts.some(a => a.id === alertId)) {
        setAlerts(prev => [{
          id: alertId,
          icon: '🔨',
          message: '086 BEAM BROKEN! Whole number likely to break. Use Dwarf Tossing technique.',
          type: 'warning',
          timestamp: new Date()
        }, ...prev.slice(0, 3)]);
      }
    }
  }, [coordinate, beamsBroken, alerts]);

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center flex items-center justify-center gap-2">
        <span>🚨</span> BATTLE ALERTS
      </h2>
      
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-3 p-3 rounded border-l-4 ${
              alert.type === 'success'
                ? 'bg-green-900/20 border-green-500'
                : alert.type === 'warning'
                ? 'bg-yellow-900/20 border-yellow-500'
                : 'bg-blue-900/20 border-blue-500'
            }`}
          >
            <div className="text-2xl flex-shrink-0">{alert.icon}</div>
            <div className="flex-1">
              <p className="text-sm text-gray-200">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
