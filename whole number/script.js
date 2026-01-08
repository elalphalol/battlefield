// ===========================
// WHOLE NUMBER WAR - STRATEGY APP
// ===========================

class WholeNumberStrategy {
    constructor() {
        this.currentPrice = 0;
        this.previousPrice = 0;
        this.price24hAgo = 0;
        this.change24h = 0;
        this.priceHistory = [];
        this.alerts = [];
        this.maxAlerts = 10;
        this.updateInterval = 5000; // Update every 5 seconds
        this.beamsBroken = {
            beam226: false,
            beam113: false,
            beam086: false
        };
        
        // Paper Trading
        this.positions = [];
        this.closedPositions = []; // Track closed positions history
        this.leverage = 10;
        this.positionSize = 1000;
        this.stats = {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalPnl: 0
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.fetchBTCPrice();
        this.updateNYTime();
        
        // Start intervals
        setInterval(() => this.fetchBTCPrice(), this.updateInterval);
        setInterval(() => this.updateNYTime(), 1000);
    }

    setupEventListeners() {
        const toggleBtn = document.getElementById('toggleReference');
        const referenceContent = document.getElementById('referenceContent');
        
        toggleBtn.addEventListener('click', () => {
            referenceContent.classList.toggle('open');
            toggleBtn.textContent = referenceContent.classList.contains('open') 
                ? '📕 CLOSE STRATEGY GUIDE' 
                : '📖 QUICK STRATEGY GUIDE';
        });

        // Paper Trading Controls
        const leverageSlider = document.getElementById('leverageSlider');
        const leverageValue = document.getElementById('leverageValue');
        const positionSizeSlider = document.getElementById('positionSizeSlider');
        const positionSizeValue = document.getElementById('positionSizeValue');

        leverageSlider.addEventListener('input', (e) => {
            this.leverage = parseInt(e.target.value);
            leverageValue.textContent = this.leverage;
        });

        positionSizeSlider.addEventListener('input', (e) => {
            this.positionSize = parseInt(e.target.value);
            positionSizeValue.textContent = this.positionSize;
        });

        // Leverage presets (fixed selector to match HTML class)
        document.querySelectorAll('.preset-btn-sm').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const leverage = parseInt(e.target.dataset.leverage);
                this.leverage = leverage;
                leverageSlider.value = leverage;
                leverageValue.textContent = leverage;
            });
        });

        // Open position buttons
        document.getElementById('openLongBtn').addEventListener('click', () => {
            this.openPosition('long');
        });

        document.getElementById('openShortBtn').addEventListener('click', () => {
            this.openPosition('short');
        });

        // Battlefield Screenshot button (new location)
        document.getElementById('screenshotBattlefieldBtn').addEventListener('click', () => {
            this.screenshotBattlefield();
        });

        // Share button
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareResults();
        });
    }

    // ===========================
    // PRICE FETCHING
    // ===========================
    
    async fetchBTCPrice() {
        // List of API sources to try in order
        const apiSources = [
            {
                name: 'Coinbase',
                fetch: async () => {
                    const response = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
                    const data = await response.json();
                    return parseFloat(data.data.amount);
                }
            },
            {
                name: 'Blockchain.info',
                fetch: async () => {
                    const response = await fetch('https://blockchain.info/ticker');
                    const data = await response.json();
                    return parseFloat(data.USD.last);
                }
            },
            {
                name: 'CoinGecko',
                fetch: async () => {
                    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
                    const data = await response.json();
                    return parseFloat(data.bitcoin.usd);
                }
            },
            {
                name: 'CryptoCompare',
                fetch: async () => {
                    const response = await fetch('https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD');
                    const data = await response.json();
                    return parseFloat(data.USD);
                }
            }
        ];

        // Try each API source until one works
        for (let i = 0; i < apiSources.length; i++) {
            try {
                const source = apiSources[i];
                const price = await source.fetch();
                
                if (!price || isNaN(price) || price <= 0) {
                    console.warn(`${source.name} returned invalid price:`, price);
                    continue;
                }
                
                // Success! Update price
                this.previousPrice = this.currentPrice;
                this.currentPrice = price;
                
                // Clear any previous error alerts on success
                if (this.alerts.length > 0 && this.alerts[0].type === 'danger') {
                    this.alerts.shift();
                    this.updateAlertsUI();
                }
                
                // Add to price history
                this.priceHistory.push({
                    price: this.currentPrice,
                    timestamp: Date.now()
                });
                
                // Keep only last 100 prices
                if (this.priceHistory.length > 100) {
                    this.priceHistory.shift();
                }
                
                this.updateUI();
                this.analyzeStrategy();
                this.updatePositions(); // Update paper trading positions
                
                // Success - exit the loop
                return;
                
            } catch (error) {
                console.warn(`${apiSources[i].name} API failed:`, error.message);
                // Continue to next API source
            }
        }
        
        // All APIs failed
        console.error('All API sources failed to fetch BTC price');
        
        // Only add alert if we don't already have a recent error alert
        const hasRecentError = this.alerts.length > 0 && 
                              this.alerts[0].type === 'danger' &&
                              Date.now() - this.alerts[0].timestamp < 30000; // 30 seconds
        
        if (!hasRecentError) {
            this.addAlert('danger', '⚠️ All price sources failed. Using last known price. Check connection.');
        }
        
        // If we have previous price data, continue using it
        if (this.currentPrice > 0) {
            this.updateUI();
        }
    }

    // ===========================
    // WHOLE NUMBER CALCULATIONS
    // ===========================
    
    getWholeNumber(price) {
        return Math.floor(price / 1000) * 1000;
    }

    getNextWholeNumber(price) {
        return Math.ceil(price / 1000) * 1000;
    }

    getCoordinate(price) {
        const remainder = price % 1000;
        return Math.floor(remainder);
    }

    getZoneInfo(coordinate) {
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
    // STRATEGY ANALYSIS
    // ===========================
    
    analyzeStrategy() {
        const coordinate = this.getCoordinate(this.currentPrice);
        const wholeNumber = this.getWholeNumber(this.currentPrice);
        const nextWholeNumber = this.getNextWholeNumber(this.currentPrice);
        
        // Check beams
        this.checkBeams(coordinate, wholeNumber);
        
        // Determine market direction
        const direction = this.getMarketDirection();
        
        // Calculate entry points
        const longEntry = wholeNumber + 800; // Ideal long entry (800 area)
        const shortEntry = nextWholeNumber + 150; // Ideal short entry (above whole number)
        
        // Get recommended action
        const action = this.getRecommendedAction(coordinate, direction);
        
        // Update strategy UI
        this.updateStrategyUI(direction, action, longEntry, shortEntry);
        
        // Check for alert conditions
        this.checkAlertConditions(coordinate, wholeNumber);
    }

    checkBeams(coordinate, wholeNumber) {
        const beam226 = wholeNumber + 226;
        const beam113 = wholeNumber + 113;
        const beam086 = wholeNumber + 86;
        
        // Check if beams are broken
        const newBeam226Broken = this.currentPrice < beam226;
        const newBeam113Broken = this.currentPrice < beam113;
        const newBeam086Broken = this.currentPrice < beam086;
        
        // Alert on new beam breaks
        if (newBeam226Broken && !this.beamsBroken.beam226) {
            this.addAlert('warning', '⚠️ BEAM 226 BROKEN! First warning signal.');
            this.beamsBroken.beam226 = true;
        }
        
        if (newBeam113Broken && !this.beamsBroken.beam113) {
            this.addAlert('warning', '⚠️ BEAM 113 BROKEN! Second warning signal.');
            this.beamsBroken.beam113 = true;
        }
        
        if (newBeam086Broken && !this.beamsBroken.beam086) {
            this.addAlert('danger', '🔨 BEAM 086 BROKEN! SLEDGEHAMMER ACTIVATED! Whole number will break!');
            this.beamsBroken.beam086 = true;
        }
        
        // Reset beams if price goes back up
        if (this.currentPrice > beam226) {
            this.beamsBroken = { beam226: false, beam113: false, beam086: false };
        }
        
        // Update beams UI
        this.updateBeamsUI(beam226, beam113, beam086);
    }

    getMarketDirection() {
        if (this.priceHistory.length < 5) return 'neutral';
        
        // Use recent 10-20 prices for more responsive detection
        const recentCount = Math.min(15, this.priceHistory.length);
        const recentPrices = this.priceHistory.slice(-recentCount);
        
        // Calculate overall trend
        const firstPrice = recentPrices[0].price;
        const lastPrice = recentPrices[recentPrices.length - 1].price;
        const overallChange = ((lastPrice - firstPrice) / firstPrice) * 100;
        
        // Count momentum
        let upMoves = 0;
        let downMoves = 0;
        
        for (let i = 1; i < recentPrices.length; i++) {
            if (recentPrices[i].price > recentPrices[i-1].price) upMoves++;
            else if (recentPrices[i].price < recentPrices[i-1].price) downMoves++;
        }
        
        const momentum = (upMoves - downMoves) / recentPrices.length;
        
        // More sensitive thresholds - combine overall change and momentum
        if (overallChange > 0.05 || momentum > 0.15) return 'bullish';
        if (overallChange < -0.05 || momentum < -0.15) return 'bearish';
        return 'neutral';
    }

    getRecommendedAction(coordinate, direction) {
        const wholeNumber = this.getWholeNumber(this.currentPrice);
        const distanceFromWhole = this.currentPrice - wholeNumber;
        
        // PRIORITY 1: Be beams broken (highest priority)
        if (this.beamsBroken.beam086 && coordinate > 50) {
            return {
                action: 'caution',
                description: `⚠️ DWARF TOSS SETUP! All beams broken. Wait for break, screenshot the depth, then short the pump back.`,
                confidence: 'high'
            };
        }
        
        // PRIORITY 2: In acceleration zone (900s) - usually bullish signal
        if (coordinate >= 900) {
            return {
                action: direction === 'bearish' ? 'caution' : 'long',
                description: direction === 'bearish' 
                    ? `⚠️ In 900s but bearish! Price may fail to break. Caution advised.`
                    : `🚀 ACCELERATION ZONE! Strong momentum toward $${this.formatNumber(this.getNextWholeNumber(this.currentPrice))}. Watch for breakout!`,
                confidence: direction === 'bearish' ? 'medium' : 'high'
            };
        }
        
        // PRIORITY 3: In dip buy zone (700-888) - good long zone
        if (coordinate >= 700 && coordinate <= 888) {
            return {
                action: direction === 'bearish' ? 'wait' : 'long',
                description: direction === 'bearish'
                    ? `🎯 In DIP BUY ZONE but short-term bearish. Wait for direction confirmation.`
                    : `🟢 LONG OPPORTUNITY! Price in dip buy zone (${coordinate}). Enter long below whole number with $3,000 gap.`,
                confidence: direction === 'bearish' ? 'low' : 'high'
            };
        }
        
        // PRIORITY 4: In beam zones (226-300) - weakness
        if (coordinate >= 226 && coordinate < 300) {
            return {
                action: direction === 'bullish' ? 'wait' : 'caution',
                description: direction === 'bullish'
                    ? `⚠️ In beam zone but bullish. Conflicting signals - wait for clarity.`
                    : `🔴 WEAKNESS DETECTED! Beams breaking. Watch for whole number breakdown.`,
                confidence: 'medium'
            };
        }
        
        // PRIORITY 5: Below whole number after break
        if (distanceFromWhole < 0 && Math.abs(distanceFromWhole) < 200) {
            return {
                action: 'caution',
                description: `📸 MAP THE DEPTH! Whole number just broke. Take screenshot of low (${coordinate}). Wait for pump back to short.`,
                confidence: 'medium'
            };
        }
        
        // PRIORITY 6: Above whole number (just broke up)
        if (distanceFromWhole > 0 && distanceFromWhole < 300) {
            return {
                action: direction === 'bullish' ? 'long' : 'wait',
                description: direction === 'bullish'
                    ? `💚 GREEN VICTORY! Just broke up. Coordinate ${coordinate}. Watch for continuation or enter on pullback.`
                    : `⚠️ Above whole number (${coordinate}) but weak momentum. Wait for direction.`,
                confidence: direction === 'bullish' ? 'medium' : 'low'
            };
        }
        
        // PRIORITY 7: In middle zone (400-600)
        if (coordinate >= 400 && coordinate <= 600) {
            return {
                action: 'wait',
                description: `⚖️ MIDDLE ZONE (${coordinate}) - Neutral territory. Direction: ${direction.toUpperCase()}. Wait for clearer setup.`,
                confidence: 'low'
            };
        }
        
        // PRIORITY 8: In weakness zone (300-400)
        if (coordinate >= 300 && coordinate < 400) {
            return {
                action: direction === 'bullish' ? 'wait' : 'caution',
                description: direction === 'bullish'
                    ? `⚠️ Weakness zone but bullish trend. Mixed signals - be cautious.`
                    : `🔴 WEAKNESS ZONE! Coordinate ${coordinate}. Watch for beam breaks at 226/113/086.`,
                confidence: 'medium'
            };
        }
        
        // Default
        return {
            action: 'wait',
            description: `⏳ Coordinate ${coordinate}. Direction: ${direction.toUpperCase()}. Monitor for entry setup.`,
            confidence: 'low'
        };
    }

    checkAlertConditions(coordinate, wholeNumber) {
        // Alert when entering 900s
        if (coordinate >= 900 && coordinate < 910 && this.getCoordinate(this.previousPrice) < 900) {
            this.addAlert('success', '🚀 Entered 900s! Acceleration zone - heading to next whole number!');
        }
        
        // Alert when entering dip buy zone
        if (coordinate >= 700 && coordinate <= 888) {
            const prevCoord = this.getCoordinate(this.previousPrice);
            if (prevCoord < 700 || prevCoord > 888) {
                this.addAlert('info', '🎯 Entered DIP BUY ZONE (888-700)! Watch for long opportunities.');
            }
        }
        
        // Alert on whole number cross
        const prevWhole = this.getWholeNumber(this.previousPrice);
        if (wholeNumber !== prevWhole) {
            if (wholeNumber > prevWhole) {
                this.addAlert('success', `💚 GREEN ARMY VICTORY! Broke above $${this.formatNumber(wholeNumber)}!`);
            } else {
                this.addAlert('danger', `❤️ RED ARMY VICTORY! Broke below $${this.formatNumber(prevWhole)}!`);
            }
        }
        
        // Time-based alerts
        this.checkTimeCycleAlerts();
    }

    checkTimeCycleAlerts() {
        const nyTime = this.getNYTime();
        const hour = nyTime.getHours();
        const minute = nyTime.getMinutes();
        
        // 6:30 AM alert
        if (hour === 6 && minute === 30) {
            this.addAlert('info', '🌅 6:30 AM NY TIME! Watch for overnight low point - quick scalp opportunity!');
        }
        
        // 9:30 AM alert
        if (hour === 9 && minute === 30) {
            this.addAlert('success', '📈 9:30 AM! Stock market open - expect AM PUMP phenomenon!');
        }
        
        // 8:00 AM alert
        if (hour === 8 && minute === 0) {
            this.addAlert('info', '⏰ 8:00 AM! AM pump building momentum - watch for upward movement.');
        }
    }

    // ===========================
    // UI UPDATES
    // ===========================
    
    updateUI() {
        const coordinate = this.getCoordinate(this.currentPrice);
        const wholeNumber = this.getWholeNumber(this.currentPrice);
        const nextWholeNumber = this.getNextWholeNumber(this.currentPrice);
        const zoneInfo = this.getZoneInfo(coordinate);
        
        // Update price
        document.getElementById('btcPrice').textContent = `$${this.formatNumber(this.currentPrice)}`;
        
        // Update timestamp
        document.getElementById('timestamp').textContent = new Date().toLocaleTimeString();
        
        // Update whole numbers
        document.getElementById('currentWholeNumber').textContent = `$${this.formatNumber(wholeNumber)}`;
        document.getElementById('nextWholeNumber').textContent = `$${this.formatNumber(nextWholeNumber)}`;
        document.getElementById('positionInRange').textContent = coordinate;
        
        // Update coordinate display
        document.getElementById('coordinateNumber').textContent = coordinate.toString().padStart(3, '0');
        
        // Update zone card
        const zoneCard = document.getElementById('zoneCard');
        zoneCard.className = `zone-card ${zoneInfo.type}`;
        zoneCard.querySelector('.zone-name').textContent = zoneInfo.name;
        zoneCard.querySelector('.zone-description').textContent = zoneInfo.description;
        
        // Update battlefield position marker
        this.updateBattlefield(coordinate);
        
        // Update army strength
        this.updateArmyStrength(coordinate, zoneInfo.signal);
    }

    updateBattlefield(coordinate) {
        const marker = document.getElementById('positionMarker');
        // Convert coordinate (0-1000) to position on bar (0-100%)
        // Invert so 1000 is at top and 0 is at bottom
        const position = 100 - (coordinate / 1000 * 100);
        marker.style.top = `calc(${position}% - 20px)`;
    }

    updateArmyStrength(coordinate, signal) {
        const redArmy = document.getElementById('redArmy');
        const greenArmy = document.getElementById('greenArmy');
        const redStrength = document.getElementById('redStrength');
        const greenStrength = document.getElementById('greenStrength');
        
        let redPower, greenPower;
        
        if (coordinate >= 900) {
            // Green army dominant
            greenPower = 90;
            redPower = 10;
            greenArmy.classList.add('dominant');
            redArmy.classList.remove('dominant');
        } else if (coordinate >= 700 && coordinate <= 888) {
            // Green army strong
            greenPower = 70;
            redPower = 30;
            greenArmy.classList.add('dominant');
            redArmy.classList.remove('dominant');
        } else if (coordinate >= 400 && coordinate <= 600) {
            // Balanced
            greenPower = 50;
            redPower = 50;
            greenArmy.classList.remove('dominant');
            redArmy.classList.remove('dominant');
        } else if (coordinate >= 226) {
            // Red army gaining
            greenPower = 30;
            redPower = 70;
            greenArmy.classList.remove('dominant');
            redArmy.classList.add('dominant');
        } else {
            // Red army dominant
            greenPower = 10;
            redPower = 90;
            greenArmy.classList.remove('dominant');
            redArmy.classList.add('dominant');
        }
        
        redStrength.textContent = `${redPower}%`;
        greenStrength.textContent = `${greenPower}%`;
    }

    updateStrategyUI(direction, action, longEntry, shortEntry) {
        // Update direction
        const directionCard = document.getElementById('directionCard');
        const directionIndicator = document.getElementById('directionIndicator');
        
        directionCard.className = 'strategy-card direction-card';
        
        if (direction === 'bullish') {
            directionCard.classList.add('bullish');
            directionIndicator.querySelector('.direction-arrow').textContent = '⬆️';
            directionIndicator.querySelector('.direction-text').textContent = 'BULLISH';
        } else if (direction === 'bearish') {
            directionCard.classList.add('bearish');
            directionIndicator.querySelector('.direction-arrow').textContent = '⬇️';
            directionIndicator.querySelector('.direction-text').textContent = 'BEARISH';
        } else {
            directionIndicator.querySelector('.direction-arrow').textContent = '↔️';
            directionIndicator.querySelector('.direction-text').textContent = 'NEUTRAL';
        }
        
        // Update action
        const actionBadge = document.getElementById('actionBadge');
        const actionDescription = document.getElementById('actionDescription');
        
        actionBadge.className = `action-badge ${action.action}`;
        actionBadge.textContent = action.action.toUpperCase();
        actionDescription.textContent = action.description;
        
        // Update entry points
        document.getElementById('longEntry').textContent = `$${this.formatNumber(longEntry)}`;
        document.getElementById('shortEntry').textContent = `$${this.formatNumber(shortEntry)}`;
    }

    updateBeamsUI(beam226, beam113, beam086) {
        const beam226El = document.getElementById('beam226');
        const beam113El = document.getElementById('beam113');
        const beam086El = document.getElementById('beam086');
        
        // Update values
        beam226El.querySelector('.beam-value').textContent = `$${this.formatNumber(beam226)}`;
        beam113El.querySelector('.beam-value').textContent = `$${this.formatNumber(beam113)}`;
        beam086El.querySelector('.beam-value').textContent = `$${this.formatNumber(beam086)}`;
        
        // Update indicators
        if (this.beamsBroken.beam226) {
            beam226El.classList.add('broken');
            beam226El.querySelector('.beam-indicator').textContent = '🔴';
        } else {
            beam226El.classList.remove('broken');
            beam226El.querySelector('.beam-indicator').textContent = '⚪';
        }
        
        if (this.beamsBroken.beam113) {
            beam113El.classList.add('broken');
            beam113El.querySelector('.beam-indicator').textContent = '🔴';
        } else {
            beam113El.classList.remove('broken');
            beam113El.querySelector('.beam-indicator').textContent = '⚪';
        }
        
        if (this.beamsBroken.beam086) {
            beam086El.classList.add('broken');
            beam086El.querySelector('.beam-indicator').textContent = '🔴';
        } else {
            beam086El.classList.remove('broken');
            beam086El.querySelector('.beam-indicator').textContent = '⚪';
        }
    }

    // ===========================
    // ALERTS
    // ===========================
    
    addAlert(type, message) {
        this.alerts.unshift({ type, message, timestamp: Date.now() });
        
        // Keep only recent alerts
        if (this.alerts.length > this.maxAlerts) {
            this.alerts.pop();
        }
        
        this.updateAlertsUI();
    }

    updateAlertsUI() {
        const container = document.getElementById('alertsContainer');
        container.innerHTML = '';
        
        if (this.alerts.length === 0) {
            container.innerHTML = `
                <div class="alert-item info">
                    <span class="alert-icon">ℹ️</span>
                    <span class="alert-text">No alerts yet. Monitoring the battlefield...</span>
                </div>
            `;
            return;
        }
        
        this.alerts.forEach(alert => {
            const alertEl = document.createElement('div');
            alertEl.className = `alert-item ${alert.type}`;
            
            let icon;
            switch(alert.type) {
                case 'success': icon = '✅'; break;
                case 'danger': icon = '🚨'; break;
                case 'warning': icon = '⚠️'; break;
                default: icon = 'ℹ️';
            }
            
            alertEl.innerHTML = `
                <span class="alert-icon">${icon}</span>
                <span class="alert-text">${alert.message}</span>
            `;
            
            container.appendChild(alertEl);
        });
    }

    // ===========================
    // TIME CYCLE
    // ===========================
    
    getNYTime() {
        const now = new Date();
        const nyTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
        return nyTime;
    }

    updateNYTime() {
        const nyTime = this.getNYTime();
        const timeString = nyTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
        });
        
        document.getElementById('nyTime').textContent = timeString;
        
        // Update cycle phase
        this.updateCyclePhase(nyTime);
    }

    updateCyclePhase(nyTime) {
        const hour = nyTime.getHours();
        const minute = nyTime.getMinutes();
        const cyclePhaseEl = document.getElementById('cyclePhase');
        
        let phase = {
            icon: '🌙',
            name: 'Overnight Period',
            description: 'Typical dump phase. Lower volume. Wait for morning.',
            class: ''
        };
        
        // 6:00 AM - 7:00 AM: Overnight Low
        if (hour >= 6 && hour < 7) {
            phase = {
                icon: '🌅',
                name: '6:30 AM Low Window',
                description: 'Watch for overnight low point! Quick scalp opportunity.',
                class: 'overnight-dump'
            };
        }
        // 8:00 AM - 9:30 AM: Pre-Market Pump
        else if (hour >= 8 && (hour < 9 || (hour === 9 && minute < 30))) {
            phase = {
                icon: '🔥',
                name: 'AM Pump Building',
                description: 'Momentum building toward stock market open!',
                class: 'am-pump'
            };
        }
        // 9:30 AM - 4:00 PM: Market Hours
        else if ((hour === 9 && minute >= 30) || (hour >= 10 && hour < 16)) {
            phase = {
                icon: '📈',
                name: 'Market Hours - AM Pump',
                description: 'Stock market open! Highest pump probability.',
                class: 'am-pump'
            };
        }
        // 4:00 PM - 8:00 PM: Evening
        else if (hour >= 16 && hour < 20) {
            phase = {
                icon: '🌆',
                name: 'Evening Session',
                description: 'Transition period. Watch for direction change.',
                class: ''
            };
        }
        // 8:00 PM - 6:00 AM: Overnight
        else {
            phase = {
                icon: '🌙',
                name: 'Overnight Dump Period',
                description: 'Typical dump phase. Bearish bias. Be cautious.',
                class: 'overnight-dump'
            };
        }
        
        cyclePhaseEl.className = `cycle-phase ${phase.class}`;
        cyclePhaseEl.querySelector('.phase-icon').textContent = phase.icon;
        cyclePhaseEl.querySelector('.phase-name').textContent = phase.name;
        cyclePhaseEl.querySelector('.phase-description').textContent = phase.description;
    }

    // ===========================
    // PAPER TRADING FUNCTIONS
    // ===========================
    
    openPosition(type) {
        if (this.currentPrice === 0) {
            this.addAlert('warning', '⚠️ Waiting for price data. Please wait...');
            return;
        }

        const position = {
            id: Date.now(),
            type: type,
            entryPrice: this.currentPrice,
            entryTime: new Date().toLocaleTimeString(),
            entryCoordinate: this.getCoordinate(this.currentPrice),
            leverage: this.leverage,
            size: this.positionSize,
            currentPnl: 0,
            currentPnlPercent: 0
        };

        this.positions.push(position);
        
        const emoji = type === 'long' ? '🟢' : '🔴';
        const army = type === 'long' ? 'GREEN ARMY' : 'RED ARMY';
        this.addAlert('success', `${emoji} ${army} POSITION OPENED! Entry: $${this.formatNumber(this.currentPrice)} | Leverage: ${this.leverage}x | Size: $${this.positionSize}`);
        
        this.updatePositionsDisplay();
    }

    closePosition(positionId) {
        const position = this.positions.find(p => p.id === positionId);
        if (!position) return;

        // Calculate final PNL
        const priceDiff = position.type === 'long' 
            ? this.currentPrice - position.entryPrice
            : position.entryPrice - this.currentPrice;
        
        const pnlPercent = (priceDiff / position.entryPrice) * 100 * position.leverage;
        const pnlDollar = (position.size * pnlPercent) / 100;

        // Save to closed positions history
        const closedPosition = {
            ...position,
            exitPrice: this.currentPrice,
            exitTime: new Date().toLocaleTimeString(),
            finalPnl: pnlDollar,
            finalPnlPercent: pnlPercent
        };
        this.closedPositions.unshift(closedPosition); // Add to beginning
        
        // Keep only last 20 closed positions
        if (this.closedPositions.length > 20) {
            this.closedPositions.pop();
        }

        // Update stats
        this.stats.totalTrades++;
        if (pnlDollar > 0) {
            this.stats.winningTrades++;
        } else {
            this.stats.losingTrades++;
        }
        this.stats.totalPnl += pnlDollar;

        // Remove position from active
        this.positions = this.positions.filter(p => p.id !== positionId);

        const emoji = pnlDollar > 0 ? '💰' : '📉';
        const result = pnlDollar > 0 ? 'PROFIT' : 'LOSS';
        this.addAlert(
            pnlDollar > 0 ? 'success' : 'warning',
            `${emoji} Position closed! ${result}: $${this.formatNumber(Math.abs(pnlDollar))} (${pnlPercent.toFixed(2)}%)`
        );

        this.updatePositionsDisplay();
        this.updateStatsDisplay();
    }

    updatePositions() {
        // Update PNL for all open positions
        this.positions.forEach(position => {
            const priceDiff = position.type === 'long' 
                ? this.currentPrice - position.entryPrice
                : position.entryPrice - this.currentPrice;
            
            position.currentPnlPercent = (priceDiff / position.entryPrice) * 100 * position.leverage;
            position.currentPnl = (position.size * position.currentPnlPercent) / 100;
        });

        this.updatePositionsDisplay();
    }

    updatePositionsDisplay() {
        const container = document.getElementById('positionsContainer');
        
        if (this.positions.length === 0) {
            container.innerHTML = `
                <div class="no-positions">
                    <span class="no-positions-icon">💤</span>
                    <span class="no-positions-text">No active positions. Open a trade to start!</span>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        
        this.positions.forEach(position => {
            const positionEl = document.createElement('div');
            positionEl.className = `position-item ${position.type}`;
            
            const pnlClass = position.currentPnl >= 0 ? 'profit' : 'loss';
            const pnlSign = position.currentPnl >= 0 ? '+' : '';
            
            positionEl.innerHTML = `
                <div class="position-header">
                    <span class="position-type ${position.type}">
                        ${position.type === 'long' ? '🟢 LONG' : '🔴 SHORT'} 
                        ${position.leverage}x
                    </span>
                    <button class="position-close-btn" data-id="${position.id}">CLOSE</button>
                </div>
                <div class="position-details">
                    <div class="position-detail">
                        <span class="detail-label">Entry Price</span>
                        <span class="detail-value">$${this.formatNumber(position.entryPrice)}</span>
                    </div>
                    <div class="position-detail">
                        <span class="detail-label">Entry Coordinate</span>
                        <span class="detail-value">${position.entryCoordinate}</span>
                    </div>
                    <div class="position-detail">
                        <span class="detail-label">Position Size</span>
                        <span class="detail-value">$${this.formatNumber(position.size)}</span>
                    </div>
                    <div class="position-detail">
                        <span class="detail-label">Entry Time</span>
                        <span class="detail-value">${position.entryTime}</span>
                    </div>
                </div>
                <div class="position-pnl">
                    <span class="pnl-label">Current P&L:</span>
                    <span class="pnl-value ${pnlClass}">
                        ${pnlSign}$${this.formatNumber(Math.abs(position.currentPnl))} 
                        (${pnlSign}${position.currentPnlPercent.toFixed(2)}%)
                    </span>
                </div>
            `;
            
            container.appendChild(positionEl);
            
            // Add close button listener
            positionEl.querySelector('.position-close-btn').addEventListener('click', () => {
                this.closePosition(position.id);
            });
        });
    }

    updateStatsDisplay() {
        // Update all stat elements (handles both compact and full views)
        const totalTradesElements = document.querySelectorAll('#totalTrades');
        const winRateElements = document.querySelectorAll('#winRate');
        const totalPnlElements = document.querySelectorAll('#totalPnl');
        
        // Also get old elements if they exist
        const winningTradesEl = document.getElementById('winningTrades');
        const losingTradesEl = document.getElementById('losingTrades');
        
        const winRate = this.stats.totalTrades > 0 
            ? ((this.stats.winningTrades / this.stats.totalTrades) * 100).toFixed(1)
            : 0;
        
        const pnlSign = this.stats.totalPnl >= 0 ? '+' : '';
        const pnlText = `${pnlSign}$${this.formatNumber(Math.abs(this.stats.totalPnl))}`;
        
        // Update all instances
        totalTradesElements.forEach(el => el.textContent = this.stats.totalTrades);
        winRateElements.forEach(el => el.textContent = `${winRate}%`);
        totalPnlElements.forEach(el => {
            el.textContent = pnlText;
            // Update class for color
            if (el.classList.contains('stat-value')) {
                el.className = 'stat-value ' + (this.stats.totalPnl >= 0 ? 'winning' : 'losing');
            } else if (el.classList.contains('stat-compact-value')) {
                el.style.color = this.stats.totalPnl >= 0 ? '#16a34a' : '#dc2626';
            }
        });
        
        // Update winning/losing if elements exist
        if (winningTradesEl) winningTradesEl.textContent = this.stats.winningTrades;
        if (losingTradesEl) losingTradesEl.textContent = this.stats.losingTrades;
    }

    screenshotBattlefield() {
        // Create a canvas for the battlefield screenshot
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');

        // Background
        const gradient = ctx.createLinearGradient(0, 0, 0, 800);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#1e293b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1000, 800);

        // Title
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚔️ WHOLE NUMBER WAR - BATTLEFIELD SNAPSHOT ⚔️', 500, 50);

        // BTC Price Box
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(50, 80, 900, 100);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 80, 900, 100);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 48px Arial';
        ctx.fillText(`$${this.formatNumber(this.currentPrice)}`, 500, 135);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px Arial';
        ctx.fillText(`Coordinate: ${this.getCoordinate(this.currentPrice)} | ${new Date().toLocaleString()}`, 500, 165);

        // Whole Numbers Info
        const wholeNumber = this.getWholeNumber(this.currentPrice);
        const nextWhole = this.getNextWholeNumber(this.currentPrice);
        
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Current Whole: $${this.formatNumber(wholeNumber)}`, 70, 220);
        ctx.fillText(`Next Whole: $${this.formatNumber(nextWhole)}`, 550, 220);

        // BEAMS Status
        const beam226 = wholeNumber + 226;
        const beam113 = wholeNumber + 113;
        const beam086 = wholeNumber + 86;

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('🔨 THE BEAMS', 70, 270);

        let beamY = 305;
        const drawBeam = (label, value, broken) => {
            ctx.fillStyle = broken ? '#dc2626' : '#16a34a';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(`${broken ? '🔴' : '🟢'} ${label}:`, 70, beamY);
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(`$${this.formatNumber(value)}`, 250, beamY);
            ctx.fillStyle = broken ? '#dc2626' : '#94a3b8';
            ctx.fillText(broken ? 'BROKEN' : 'INTACT', 400, beamY);
            beamY += 35;
        };

        drawBeam('226 BEAM', beam226, this.beamsBroken.beam226);
        drawBeam('113 BEAM', beam113, this.beamsBroken.beam113);
        drawBeam('086 BEAM', beam086, this.beamsBroken.beam086);

        // Market Direction (add before battlefield)
        const direction = this.getMarketDirection();
        
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('🧭 MARKET DIRECTION', 550, 270);

        // Direction indicator box
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(550, 285, 380, 120);
        ctx.strokeStyle = direction === 'bullish' ? '#16a34a' : direction === 'bearish' ? '#dc2626' : '#94a3b8';
        ctx.lineWidth = 3;
        ctx.strokeRect(550, 285, 380, 120);

        // Direction arrow and text
        let directionEmoji, directionText, directionColor;
        if (direction === 'bullish') {
            directionEmoji = '⬆️';
            directionText = 'BULLISH';
            directionColor = '#16a34a';
        } else if (direction === 'bearish') {
            directionEmoji = '⬇️';
            directionText = 'BEARISH';
            directionColor = '#dc2626';
        } else {
            directionEmoji = '↔️';
            directionText = 'NEUTRAL';
            directionColor = '#94a3b8';
        }

        ctx.fillStyle = directionColor;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(directionEmoji, 740, 335);

        ctx.fillStyle = directionColor;
        ctx.font = 'bold 28px Arial';
        ctx.fillText(directionText, 740, 380);

        // Battlefield Visualization
        const coordinate = this.getCoordinate(this.currentPrice);
        const zoneInfo = this.getZoneInfo(coordinate);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('🎯 BATTLEFIELD POSITION', 70, 450);

        // Draw simplified battlefield bar - move it right to avoid cutoff
        const barX = 180;  // Increased from 70 to give more space for labels
        const barY = 480;
        const barWidth = 750;  // Adjusted width to maintain overall appearance
        const barHeight = 200;

        // Background gradient (green to red)
        const barGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
        barGradient.addColorStop(0, '#16a34a');
        barGradient.addColorStop(0.5, '#334155');
        barGradient.addColorStop(1, '#dc2626');
        ctx.fillStyle = barGradient;
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Border
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Position marker
        const markerY = barY + (barHeight * (1 - coordinate / 1000));
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(barX - 10, markerY - 15, barWidth + 20, 30);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX - 10, markerY - 15, barWidth + 20, 30);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`⚡ ${coordinate}`, barX + barWidth / 2, markerY + 6);

        // Zone labels - now with proper spacing
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('1000 (NEXT WHOLE)', barX - 15, barY + 10);
        ctx.fillText('900s (ACCELERATION)', barX - 15, barY + 40);
        ctx.fillText('500s (MIDDLE)', barX - 15, barY + barHeight / 2);
        ctx.fillText('226 (BEAMS)', barX - 15, barY + barHeight - 60);
        ctx.fillText('0 (CURRENT WHOLE)', barX - 15, barY + barHeight);

        // Zone Info Box
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(50, 710, 900, 70);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 710, 900, 70);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(zoneInfo.name, 500, 738);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px Arial';
        ctx.fillText(zoneInfo.description, 500, 765);

        // Convert to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `battlefield-${this.getCoordinate(this.currentPrice)}-${Date.now()}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            
            this.addAlert('success', `📸 Battlefield screenshot saved! Coordinate: ${coordinate} | Check downloads to share!`);
        });
    }

    takeScreenshot() {
        // Create summary data
        const summary = {
            timestamp: new Date().toLocaleString(),
            price: this.currentPrice,
            coordinate: this.getCoordinate(this.currentPrice),
            wholeNumber: this.getWholeNumber(this.currentPrice),
            activePositions: this.positions.length,
            stats: {...this.stats}
        };

        // Save to localStorage for reference
        localStorage.setItem('lastScreenshot', JSON.stringify(summary));
        
        this.addAlert('success', `📸 Screenshot saved! Price: $${this.formatNumber(this.currentPrice)} | Coordinate: ${summary.coordinate} | ${this.positions.length} active positions`);
    }

    shareResults() {
        this.generateShareImage();
    }

    generateShareImage() {
        const winRate = this.stats.totalTrades > 0 
            ? ((this.stats.winningTrades / this.stats.totalTrades) * 100).toFixed(1)
            : 0;

        // Calculate dynamic height based on positions
        const totalPositions = this.positions.length + Math.min(this.closedPositions.length, 10);
        const baseHeight = 300;
        const positionHeight = totalPositions * 28 + 150; // Each position ~28px
        const canvasHeight = Math.max(600, baseHeight + positionHeight);

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');

        // Background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#1e293b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, canvasHeight);

        // Title
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚔️ WHOLE NUMBER WAR ⚔️', 400, 45);

        // Compact Stats Section
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(50, 70, 700, 80);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 70, 700, 80);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Trades: ${this.stats.totalTrades} | Win Rate: ${winRate}%`, 70, 100);

        // Total P&L (emphasized)
        const pnlSign = this.stats.totalPnl >= 0 ? '+' : '';
        ctx.fillStyle = this.stats.totalPnl >= 0 ? '#16a34a' : '#dc2626';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Total P&L: ${pnlSign}$${this.formatNumber(Math.abs(this.stats.totalPnl))}`, 400, 135);

        let currentY = 180;

        // Active Positions Section
        if (this.positions.length > 0) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`🟢 OPEN POSITIONS (${this.positions.length})`, 70, currentY);
            currentY += 10;

            this.positions.forEach((pos, index) => {
                currentY += 28;
                
                const pnlSign = pos.currentPnl >= 0 ? '+' : '';
                const pnlColor = pos.currentPnl >= 0 ? '#16a34a' : '#dc2626';
                
                // Type indicator
                ctx.fillStyle = pos.type === 'long' ? '#16a34a' : '#dc2626';
                ctx.font = 'bold 16px Arial';
                ctx.fillText(`${pos.type === 'long' ? '🟢' : '🔴'} ${pos.type.toUpperCase()}`, 70, currentY);
                
                // P&L
                ctx.fillStyle = pnlColor;
                ctx.font = 'bold 16px Arial';
                ctx.fillText(`${pnlSign}$${this.formatNumber(Math.abs(pos.currentPnl))}`, 180, currentY);
                
                // Entry info
                ctx.fillStyle = '#94a3b8';
                ctx.font = '14px Arial';
                ctx.fillText(`${pos.leverage}x @ $${this.formatNumber(pos.entryPrice)}`, 350, currentY);
                
                // Time
                ctx.fillText(`${pos.entryTime}`, 580, currentY);
            });

            currentY += 35;
        }

        // Closed Positions Section
        if (this.closedPositions.length > 0) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`📊 CLOSED POSITIONS (${Math.min(this.closedPositions.length, 10)})`, 70, currentY);
            currentY += 10;

            const showCount = Math.min(this.closedPositions.length, 10);
            for (let i = 0; i < showCount; i++) {
                const pos = this.closedPositions[i];
                currentY += 28;
                
                const pnlSign = pos.finalPnl >= 0 ? '+' : '';
                const pnlColor = pos.finalPnl >= 0 ? '#16a34a' : '#dc2626';
                
                // Type indicator
                ctx.fillStyle = pos.type === 'long' ? '#16a34a' : '#dc2626';
                ctx.font = 'bold 16px Arial';
                ctx.fillText(`${pos.type === 'long' ? '🟢' : '🔴'} ${pos.type.toUpperCase()}`, 70, currentY);
                
                // Final P&L
                ctx.fillStyle = pnlColor;
                ctx.font = 'bold 16px Arial';
                ctx.fillText(`${pnlSign}$${this.formatNumber(Math.abs(pos.finalPnl))}`, 180, currentY);
                
                // Entry/Exit info
                ctx.fillStyle = '#94a3b8';
                ctx.font = '14px Arial';
                ctx.fillText(`${pos.leverage}x @ $${this.formatNumber(pos.entryPrice)}`, 350, currentY);
                
                // Exit time
                ctx.fillText(`${pos.exitTime}`, 580, currentY);
            }

            currentY += 20;
        }

        // Footer
        currentY += 25;
        ctx.fillStyle = '#fbbf24';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`#WholeNumberWar #BTC | ${new Date().toLocaleDateString()}`, 400, currentY);

        // Convert to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `wh ole-number-war-positions-${Date.now()}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            
            this.addAlert('success', '📤 Position screenshot saved! Check downloads to share!');
        });
    }

    // ===========================
    // UTILITY FUNCTIONS
    // ===========================
    
    formatNumber(num) {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }
}

// ===========================
// INITIALIZE APP
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    const app = new WholeNumberStrategy();
    
    // Welcome alert
    setTimeout(() => {
        app.addAlert('success', '⚔️ WHOLE NUMBER WAR initialized! Connecting to battlefield...');
    }, 1000);
    
    setTimeout(() => {
        app.addAlert('info', '📡 Live BTC price tracking active. Strategy analysis running.');
    }, 2000);
});
