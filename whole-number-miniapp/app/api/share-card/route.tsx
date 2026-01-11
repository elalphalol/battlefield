import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const army = searchParams.get('army') || 'bulls';
    const positionType = searchParams.get('type') || 'long';
    const leverage = searchParams.get('leverage') || '1';
    const pnl = searchParams.get('pnl') || '0';
    const pnlPercent = searchParams.get('pnlPercent') || '0';
    const entryPrice = searchParams.get('entry') || '0';
    const exitPrice = searchParams.get('exit') || '0';
    const size = searchParams.get('size') || '0';
    const username = searchParams.get('username') || 'Trader';

    const isProfit = parseFloat(pnl) >= 0;
    const isBears = army === 'bears';

    // Enhanced Colors
    const bgGradientStart = isBears ? '#450a0a' : '#052e16';
    const bgGradientEnd = '#0f172a';
    const accentColor = isBears ? '#ef4444' : '#22c55e';
    const textColor = isProfit ? '#22c55e' : '#ef4444';
    const glowColor = isProfit ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: bgGradientEnd,
            backgroundImage: `linear-gradient(135deg, ${bgGradientStart} 0%, ${bgGradientEnd} 100%)`,
            padding: '60px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '48px', marginRight: '20px' }}>⚔️</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#fbbf24' }}>
                BATTLEFIELD
              </div>
              <div style={{ fontSize: '24px', color: '#9ca3af' }}>
                Bears 🐻 vs Bulls 🐂
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ display: 'flex', flex: 1, gap: '60px' }}>
            {/* Left Side - Trade Details */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Username & Army */}
              <div style={{ 
                fontSize: '32px', 
                color: '#fff', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <span>{isBears ? '🐻' : '🐂'}</span>
                <span>{username}</span>
              </div>
              <div style={{ 
                fontSize: '24px', 
                color: accentColor, 
                marginBottom: '40px',
                fontWeight: 'bold'
              }}>
                {army.toUpperCase()} ARMY
              </div>

              {/* Position Type */}
              <div style={{ 
                fontSize: '28px', 
                color: '#9ca3af', 
                marginBottom: '15px' 
              }}>
                {positionType === 'long' ? '📈' : '📉'} {positionType.toUpperCase()} {leverage}x
              </div>

              {/* PNL - Big */}
              <div style={{ 
                fontSize: '96px', 
                fontWeight: 'bold',
                color: textColor,
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center'
              }}>
                {isProfit ? '✅' : '❌'} {isProfit ? '+' : ''}{pnlPercent}%
              </div>
              
              <div style={{ 
                fontSize: '48px', 
                color: textColor,
                marginBottom: '40px'
              }}>
                {isProfit ? '+' : ''}${pnl}
              </div>

              {/* Trade Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ fontSize: '24px', color: '#9ca3af' }}>
                  <span style={{ color: '#6b7280' }}>Entry:</span> ${entryPrice}
                </div>
                <div style={{ fontSize: '24px', color: '#9ca3af' }}>
                  <span style={{ color: '#6b7280' }}>Exit:</span> ${exitPrice}
                </div>
                <div style={{ fontSize: '24px', color: '#9ca3af' }}>
                  <span style={{ color: '#6b7280' }}>Size:</span> ${size}
                </div>
              </div>
            </div>

            {/* Right Side - Character Illustration */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '280px',
              filter: 'drop-shadow(0 25px 25px rgba(0,0,0,0.5))'
            }}>
              {isBears ? '🐻' : '🐂'}
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            fontSize: '28px', 
            color: '#6b7280',
            marginTop: '40px'
          }}>
            battlefield-mini.vercel.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
