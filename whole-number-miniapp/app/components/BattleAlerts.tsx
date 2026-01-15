'use client';

import { useEffect, useState, useRef } from 'react';

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

export function BattleAlerts({ btcPrice = 0, coordinate = 0, beamsBroken }: BattleAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      icon: '🔔',
      message: 'Live BTC price tracking active. Strategy analysis running.',
      type: 'info',
      timestamp: new Date()
    }
  ]);

  // Track which alerts we've already added to prevent duplicates
  const addedAlertsRef = useRef<Set<string>>(new Set(['1']));

  // Safety checks for props
  const safeCoordinate = typeof coordinate === 'number' && !isNaN(coordinate) ? coordinate : 0;
  const safeBeamsBroken = beamsBroken || { beam226: false, beam113: false, beam086: false };

  useEffect(() => {
    // Add alert when entering dip buy zone (888-700)
    if (safeCoordinate >= 700 && safeCoordinate <= 888) {
      const alertId = `dip-${Math.floor(safeCoordinate / 50) * 50}`; // Group by 50s to reduce spam
      if (!addedAlertsRef.current.has(alertId)) {
        addedAlertsRef.current.add(alertId);
        setAlerts(prev => [{
          id: alertId,
          icon: '🟢',
          message: `Entered DIP BUY ZONE (${safeCoordinate})! Watch for long opportunities.`,
          type: 'success',
          timestamp: new Date()
        }, ...prev.slice(0, 3)]);
      }
    }

    // Add alert when beams break
    if (safeBeamsBroken.beam086) {
      const alertId = 'beam-086';
      if (!addedAlertsRef.current.has(alertId)) {
        addedAlertsRef.current.add(alertId);
        setAlerts(prev => [{
          id: alertId,
          icon: '🔨',
          message: '086 BEAM BROKEN! Whole number likely to break. Use Dwarf Tossing technique.',
          type: 'warning',
          timestamp: new Date()
        }, ...prev.slice(0, 3)]);
      }
    }
  }, [safeCoordinate, safeBeamsBroken.beam086]);

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
