// Alert types - Single Source of Truth

// System alert (from strategy analysis)
export interface SystemAlert {
  type: 'success' | 'danger' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

// UI alert (for display with icons)
export interface UIAlert {
  id: string;
  icon: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: Date;
}

// Battle alert for real-time notifications
export interface BattleAlert {
  id: string;
  message: string;
  type: 'trade' | 'liquidation' | 'achievement' | 'system';
  timestamp: number;
  data?: Record<string, unknown>;
}
