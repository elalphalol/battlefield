// ===========================
// WHOLE NUMBER WAR - STRATEGY LOGIC
// ===========================

export interface Position {
  id: number;
  type: 'long' | 'short';
  entryPrice: number;
  entryTime: string;
  entryCoordinate: number;
  leverage: number;
  size: number;
  currentPnl: number;
  currentPnlPercent: number;
}

export interface ClosedPosition extends Position {
  exitPrice: number;
  exitTime: string;
  finalPnl: number;
  finalPnlPercent: number;
}

export interface Stats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnl: number;
}

export interface Alert {
  type: 'success' | 'danger' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

export interface ZoneInfo {
  name: string;
  description: string;
  type: string;
  signal: 'bullish' | 'bearish' | 'neutral' | 'opportunity';
}

export interface ActionRecommendation {
  action: 'long' | 'short' | 'wait' | 'caution';
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

export class WholeNumberStrategy {
  currentPrice: number = 0;
  previousPrice: number = 0;
  priceHistory: Array<{ price: number; timestamp: number }> = [];
  
  beamsBroken = {
    beam226: false,
    beam113: false,
    beam086: false,
  };

  // ===========================
  // WHOLE NUMBER CALCULATIONS
  // ===========================
  
  getWholeNumber(price: number): number {
    return Math.floor(price / 1000) * 1000;
  }

  getNextWholeNumber(price: number): number {
    return Math.ceil(price / 1000) * 1000;
  }

  getCoordinate(price: number): number {
    const remainder = price % 1000;
    return Math.floor(remainder);
  }

  getZoneInfo(coordinate: number): ZoneInfo {
    if (coordinate >= 900) {
      return {
        name: '🚀 ACCELERATION ZONE (900s)',
        description: 'Price is heading to next whole number! Green army gaining strength.',
        type: 'acceleration-zone',
        signal: 'bullish'
      };
    } else if (coordinate >= 700 && coordinate <= 888) {
      return {
        name: '🎯 DIP BUY ZONE (888-700)',
        description: 'Psychological buying zone. Watch for long entries if bullish.',
        type: 'dip-zone',
        signal: 'opportunity'
      };
    } else if (coordinate >= 600 || (coordinate >= 400 && coordinate <= 600)) {
      return {
        name: '⚖️ MIDDLE ZONE (500s/400s/600s)',
        description: 'Neutral territory. Wait for clear direction before entering.',
        type: 'middle-zone',
        signal: 'neutral'
      };
    } else if (coordinate >= 300) {
      return {
        name: '⚠️ WEAKNESS ZONE (300s)',
        description: 'Breaking down. Red army pressure increasing.',
        type: 'weakness-zone',
        signal: 'bearish'
      };
    } else if (coordinate >= 226) {
      return {
        name: '🔨 BEAM ZONE (226 Active)',
        description: 'First beam! Whole number under pressure.',
        type: 'beams-zone',
        signal: 'bearish'
      };
    } else if (coordinate >= 113) {
      return {
        name: '🔨 BEAM ZONE (113 Active)',
        description: 'Second beam broken! Prepare for breakdown.',
        type: 'beams-zone',
        signal: 'bearish'
      };
    } else if (coordinate >= 86) {
      return {
        name: '🔨 BEAM ZONE (086 Active)',
        description: 'SLEDGEHAMMER ZONE! Whole number will break!',
        type: 'beams-zone',
        signal: 'bearish'
      };
    } else {
      return {
        name: '💥 BREAKDOWN ZONE',
        description: 'All beams broken! Whole number breaking down!',
        type: 'beams-zone',
        signal: 'bearish'
      };
    }
  }

  // ===========================
  // MARKET DIRECTION
  // ===========================
  
  getMarketDirection(): 'bullish' | 'bearish' | 'neutral' {
    if (this.priceHistory.length < 3) return 'neutral';
    
    const recentCount = Math.min(10, this.priceHistory.length);
    const recentPrices = this.priceHistory.slice(-recentCount);
    
    const firstPrice = recentPrices[0].price;
    const lastPrice = recentPrices[recentPrices.length - 1].price;
    const overallChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    let upMoves = 0;
    let downMoves = 0;
    
    for (let i = 1; i < recentPrices.length; i++) {
      if (recentPrices[i].price > recentPrices[i-1].price) upMoves++;
      else if (recentPrices[i].price < recentPrices[i-1].price) downMoves++;
    }
    
    const momentum = (upMoves - downMoves) / (recentPrices.length - 1);
    
    // More sensitive thresholds for Bitcoin price movements
    if (overallChange > 0.01 || momentum > 0.3) return 'bullish';
    if (overallChange < -0.01 || momentum < -0.3) return 'bearish';
    return 'neutral';
  }

  // ===========================
  // ACTION RECOMMENDATION
  // ===========================
  
  getRecommendedAction(coordinate: number, direction: 'bullish' | 'bearish' | 'neutral'): ActionRecommendation {
    const wholeNumber = this.getWholeNumber(this.currentPrice);
    const distanceFromWhole = this.currentPrice - wholeNumber;
    
    // PRIORITY 1: Beams broken
    if (this.beamsBroken.beam086 && coordinate > 50) {
      return {
        action: 'caution',
        description: `⚠️ DWARF TOSS SETUP! All beams broken. Wait for break, screenshot the depth, then short the pump back.`,
        confidence: 'high'
      };
    }
    
    // PRIORITY 2: In acceleration zone (900s)
    if (coordinate >= 900) {
      return {
        action: direction === 'bearish' ? 'caution' : 'long',
        description: direction === 'bearish' 
          ? `⚠️ In 900s but bearish! Price may fail to break. Caution advised.`
          : `🚀 ACCELERATION ZONE! Strong momentum toward $${this.formatNumber(this.getNextWholeNumber(this.currentPrice))}. Watch for breakout!`,
        confidence: direction === 'bearish' ? 'medium' : 'high'
      };
    }
    
    // PRIORITY 3: In dip buy zone (700-888)
    if (coordinate >= 700 && coordinate <= 888) {
      return {
        action: direction === 'bearish' ? 'wait' : 'long',
        description: direction === 'bearish'
          ? `🎯 In DIP BUY ZONE but short-term bearish. Wait for direction confirmation.`
          : `🟢 LONG OPPORTUNITY! Price in dip buy zone (${coordinate}). Enter long below whole number with $3,000 gap.`,
        confidence: direction === 'bearish' ? 'low' : 'high'
      };
    }
    
    // Default
    return {
      action: 'wait',
      description: `⏳ Coordinate ${coordinate}. Direction: ${direction.toUpperCase()}. Monitor for entry setup.`,
      confidence: 'low'
    };
  }

  // ===========================
  // BEAMS
  // ===========================
  
  checkBeams(coordinate: number, wholeNumber: number): { beam226: boolean; beam113: boolean; beam086: boolean } {
    const beam226 = wholeNumber + 226;
    const beam113 = wholeNumber + 113;
    const beam086 = wholeNumber + 86;
    
    const newBeam226Broken = this.currentPrice < beam226;
    const newBeam113Broken = this.currentPrice < beam113;
    const newBeam086Broken = this.currentPrice < beam086;
    
    this.beamsBroken = {
      beam226: newBeam226Broken,
      beam113: newBeam113Broken,
      beam086: newBeam086Broken,
    };
    
    // Reset beams if price goes back up
    if (this.currentPrice > beam226) {
      this.beamsBroken = { beam226: false, beam113: false, beam086: false };
    }
    
    return this.beamsBroken;
  }

  // ===========================
  // UTILITY FUNCTIONS
  // ===========================
  
  formatNumber(num: number): string {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  updatePrice(newPrice: number): void {
    this.previousPrice = this.currentPrice;
    this.currentPrice = newPrice;
    
    this.priceHistory.push({
      price: this.currentPrice,
      timestamp: Date.now()
    });
    
    // Keep only last 100 prices
    if (this.priceHistory.length > 100) {
      this.priceHistory.shift();
    }
  }
}
