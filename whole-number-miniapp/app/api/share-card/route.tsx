import { createCanvas, loadImage } from 'canvas';
import path from 'path';

export const runtime = 'nodejs';

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

    // Determine which template to use
    const templateName = isProfit 
      ? `${army}-win.png` 
      : `${army}-loss.png`;
    
    const templatePath = path.join(process.cwd(), 'public', templateName);

    // Load the template image
    const template = await loadImage(templatePath);

    // Create canvas with template
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');

    // Draw template as background
    ctx.drawImage(template, 0, 0, 1200, 630);

    // Add semi-transparent overlay in center for better text readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(200, 80, 800, 470);

    // Setup text rendering with fallback fonts
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 60px Arial, sans-serif';
    ctx.fillText('BATTLEFIELD', 600, 120);

    // Subtitle
    ctx.fillStyle = '#9ca3af';
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText('Bears vs Bulls', 600, 170);

    // Username & Army
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText(`${username} - ${army.toUpperCase()} ARMY`, 600, 230);

    // Position Type
    ctx.fillStyle = '#9ca3af';
    ctx.font = '28px Arial, sans-serif';
    ctx.fillText(`${positionType.toUpperCase()} ${leverage}x`, 600, 280);

    // P&L Percentage (BIG)
    ctx.fillStyle = isProfit ? '#22c55e' : '#ef4444';
    ctx.font = 'bold 120px Arial, sans-serif';
    const pnlText = `${isProfit ? '+' : ''}${pnlPercent}%`;
    ctx.fillText(pnlText, 600, 390);

    // P&L Dollar Amount
    ctx.font = 'bold 48px Arial, sans-serif';
    const dollarText = `${isProfit ? '+' : ''}$${pnl}`;
    ctx.fillText(dollarText, 600, 470);

    // Footer
    ctx.fillStyle = '#9ca3af';
    ctx.font = '20px Arial, sans-serif';
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
