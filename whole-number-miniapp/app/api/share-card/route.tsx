import { createCanvas, registerFont } from 'canvas';

export const runtime = 'nodejs';

// Try to register DejaVu Sans font (common on Linux servers)
try {
  registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', { 
    family: 'DejaVu Sans', 
    weight: 'bold' 
  });
  registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', { 
    family: 'DejaVu Sans', 
    weight: 'normal' 
  });
} catch (e) {
  console.log('DejaVu Sans font not found, using fallback');
}

export async function GET(request: Request) {
  // Test endpoint
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
    const positionType = searchParams.get('type') || 'long';
    const leverage = searchParams.get('leverage') || '1';

    const isProfit = parseFloat(pnlPercent) >= 0;
    const isBears = army === 'bears';

    // Create canvas
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, isBears ? '#7f1d1d' : '#14532d');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Use DejaVu Sans (registered at module load)
    const fontFamily = 'DejaVu Sans, sans-serif';
    
    // Title
    ctx.fillStyle = '#fbbf24';
    ctx.font = `bold 60px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('BATTLEFIELD', 600, 100);

    // Subtitle
    ctx.fillStyle = '#9ca3af';
    ctx.font = `24px ${fontFamily}`;
    ctx.fillText('Bears vs Bulls', 600, 140);

    // Username & Army
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 36px ${fontFamily}`;
    ctx.fillText(`${username} - ${army.toUpperCase()} ARMY`, 600, 200);

    // Position Type
    ctx.fillStyle = '#9ca3af';
    ctx.font = `28px ${fontFamily}`;
    ctx.fillText(`${positionType.toUpperCase()} ${leverage}x`, 600, 250);

    // P&L Percentage (BIG)
    ctx.fillStyle = isProfit ? '#22c55e' : '#ef4444';
    ctx.font = `bold 120px ${fontFamily}`;
    const pnlText = `${isProfit ? '+' : ''}${pnlPercent}%`;
    ctx.fillText(pnlText, 600, 380);

    // P&L Dollar Amount
    ctx.font = `bold 48px ${fontFamily}`;
    const dollarText = `${isProfit ? '+' : ''}$${pnl}`;
    ctx.fillText(dollarText, 600, 450);

    // Footer
    ctx.fillStyle = '#6b7280';
    ctx.font = `24px ${fontFamily}`;
    ctx.fillText('battlefield-roan.vercel.app', 600, 580);

    // Return as PNG
    const buffer = canvas.toBuffer('image/png');
    return new Response(buffer as any, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e: any) {
    console.error('Share card error:', e);
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
