import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  // First, test if route is working at all
  const { searchParams } = new URL(request.url);
  const test = searchParams.get('test');
  
  if (test === 'ping') {
    return new Response('Share card route is working!', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  try {
    
    const army = searchParams.get('army') || 'bulls';
    const positionType = searchParams.get('type') || 'long';
    const leverage = searchParams.get('leverage') || '1';
    const pnl = searchParams.get('pnl') || '0';
    const pnlPercent = searchParams.get('pnlPercent') || '0';
    const entryPrice = searchParams.get('entry') || '0';
    const exitPrice = searchParams.get('exit') || '0';
    const size = searchParams.get('size') || '0';
    const username = searchParams.get('username') || 'Trader';

    const isProfit = parseFloat(pnlPercent) >= 0;
    const isBears = army === 'bears';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isBears ? '#7f1d1d' : '#14532d',
            backgroundImage: 'linear-gradient(to bottom right, #000, #1e293b)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: 60,
                fontWeight: 'bold',
                color: '#fbbf24',
                marginBottom: '20px',
              }}
            >
              BATTLEFIELD
            </div>

            {/* Username */}
            <div
              style={{
                fontSize: 36,
                color: '#fff',
                marginBottom: '30px',
              }}
            >
              {username} - {army.toUpperCase()} ARMY
            </div>

            {/* Position Type */}
            <div
              style={{
                fontSize: 32,
                color: '#9ca3af',
                marginBottom: '20px',
              }}
            >
              {positionType.toUpperCase()} {leverage}x
            </div>

            {/* PNL */}
            <div
              style={{
                fontSize: 120,
                fontWeight: 'bold',
                color: isProfit ? '#22c55e' : '#ef4444',
                marginBottom: '10px',
              }}
            >
              {isProfit ? '+' : ''}{pnlPercent}%
            </div>

            <div
              style={{
                fontSize: 48,
                color: isProfit ? '#22c55e' : '#ef4444',
                marginBottom: '40px',
              }}
            >
              {isProfit ? '+' : ''}${pnl}
            </div>

            {/* Trade Details */}
            <div
              style={{
                display: 'flex',
                gap: '40px',
                fontSize: 24,
                color: '#9ca3af',
              }}
            >
              <div>Entry: ${entryPrice}</div>
              <div>Exit: ${exitPrice}</div>
              <div>Size: ${size}</div>
            </div>

            {/* Footer */}
            <div
              style={{
                fontSize: 24,
                color: '#6b7280',
                marginTop: '40px',
              }}
            >
              battlefield-roan.vercel.app
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error('Share card error:', e);
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    });
  }
}
