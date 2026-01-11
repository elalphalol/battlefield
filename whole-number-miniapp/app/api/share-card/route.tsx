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
    const pnlPercent = searchParams.get('pnlPercent') || '0';
    const pnl = searchParams.get('pnl') || '0';
    const username = searchParams.get('username') || 'Trader';

    const isProfit = parseFloat(pnlPercent) >= 0;
    const bgColor = army === 'bears' ? '#7f1d1d' : '#14532d';
    const textColor = isProfit ? '#22c55e' : '#ef4444';

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            backgroundColor: bgColor,
            fontSize: 32,
            fontWeight: 600,
          }}
        >
          <div style={{ color: '#fbbf24', fontSize: 60, fontWeight: 700 }}>
            BATTLEFIELD
          </div>
          <div style={{ color: '#fff', marginTop: 20 }}>
            {username} - {army.toUpperCase()}
          </div>
          <div style={{ color: textColor, fontSize: 100, fontWeight: 700, marginTop: 20 }}>
            {isProfit ? '+' : ''}{pnlPercent}%
          </div>
          <div style={{ color: textColor, fontSize: 40, marginTop: 10 }}>
            {isProfit ? '+' : ''}${pnl}
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
