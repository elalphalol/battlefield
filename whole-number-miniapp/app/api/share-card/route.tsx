import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';

export const runtime = 'nodejs';

// Register bundled Roboto fonts
try {
  const fontDir = path.join(process.cwd(), 'public', 'fonts');
  registerFont(path.join(fontDir, 'Roboto-Bold.ttf'), {
    family: 'Roboto',
    weight: 'bold'
  });
  registerFont(path.join(fontDir, 'Roboto-Regular.ttf'), {
    family: 'Roboto',
    weight: 'normal'
  });
} catch (e) {
  console.error('Failed to register fonts:', e);
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
    const referralCode = searchParams.get('ref') || '';
    const rank = searchParams.get('rank') || '';

    const isProfit = parseFloat(pnlPercent) >= 0;
    const rankNum = parseInt(rank) || 0;

    // Create canvas
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');

    // Draw pure black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1200, 630);

    // Add subtle diagonal stripes pattern
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    for (let i = -200; i < 1400; i += 25) {
      ctx.beginPath();
      ctx.moveTo(i, 630);
      ctx.lineTo(i + 400, 230);
      ctx.stroke();
    }
    ctx.restore();

    // Add subtle purple glow in bottom right corner
    const glowGradient = ctx.createRadialGradient(1100, 530, 0, 1100, 530, 350);
    glowGradient.addColorStop(0, 'rgba(139, 92, 246, 0.12)');
    glowGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Load and draw BATTLEFIELD logo in top left
    try {
      const logoPath = path.join(process.cwd(), 'public', 'battlefield-icon-200.png');
      const logo = await loadImage(logoPath);
      ctx.drawImage(logo, 40, 30, 80, 80);
    } catch (e) {
      // Skip logo if not found
    }

    // Draw BATTLEFIELD logo on the right side
    try {
      const logoPath = path.join(process.cwd(), 'public', 'battlefield-icon-512.png');
      const logo = await loadImage(logoPath);
      ctx.globalAlpha = 0.95;
      ctx.drawImage(logo, 700, 100, 450, 450);
      ctx.globalAlpha = 1;
    } catch (e) {
      // Skip if not found
    }

    // Load Farcaster logo
    let farcasterLogo: any = null;
    try {
      const fcLogoPath = path.join(process.cwd(), 'public', 'farcaster-logo.png');
      farcasterLogo = await loadImage(fcLogoPath);
    } catch (e) {
      // Skip if not found
    }

    // Setup text rendering
    ctx.textBaseline = 'middle';

    // BATTLEFIELD title next to logo
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 42px Roboto, sans-serif';
    ctx.fillText('BATTLEFIELD', 135, 55);

    // Subtitle
    ctx.fillStyle = '#9ca3af';
    ctx.font = '18px Roboto, sans-serif';
    ctx.fillText('Bears vs Bulls', 135, 90);

    // Main PnL percentage (HUGE) - left aligned
    ctx.textAlign = 'left';
    ctx.fillStyle = isProfit ? '#22c55e' : '#ef4444';
    ctx.font = 'bold 160px Roboto, sans-serif';
    const pnlText = `${isProfit ? '+' : ''}${pnlPercent}%`;
    ctx.fillText(pnlText, 40, 230);

    // Position info label
    ctx.fillStyle = '#9ca3af';
    ctx.font = '24px Roboto, sans-serif';
    ctx.fillText('Position', 40, 330);

    // Position value
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Roboto, sans-serif';
    ctx.fillText(`${positionType.toUpperCase()} ${leverage}x`, 40, 375);

    // PnL label
    ctx.fillStyle = '#9ca3af';
    ctx.font = '24px Roboto, sans-serif';
    ctx.fillText('P&L', 280, 330);

    // PnL dollar value
    ctx.fillStyle = isProfit ? '#22c55e' : '#ef4444';
    ctx.font = 'bold 36px Roboto, sans-serif';
    const pnlFormatted = Math.abs(parseInt(pnl)).toLocaleString('en-US');
    const dollarText = `${isProfit ? '+' : '-'}$${pnlFormatted}`;
    ctx.fillText(dollarText, 280, 375);

    // Rank section (if provided) - between P&L and username
    if (rankNum > 0) {
      const rankX = 480;

      // Rank label
      ctx.fillStyle = '#9ca3af';
      ctx.font = '24px Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Rank', rankX, 330);

      // Special styling for top 3
      if (rankNum === 1) {
        // Gold crown/medal for #1
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 42px Roboto, sans-serif';
        ctx.fillText('#1', rankX, 375);

        // Gold glow effect
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;
        ctx.fillText('#1', rankX, 375);
        ctx.shadowBlur = 0;

        // Crown emoji
        ctx.font = '32px Roboto, sans-serif';
        ctx.fillText(' ', rankX + 60, 375);
      } else if (rankNum === 2) {
        // Silver for #2
        ctx.fillStyle = '#c0c0c0';
        ctx.font = 'bold 42px Roboto, sans-serif';
        ctx.fillText('#2', rankX, 375);

        ctx.shadowColor = '#c0c0c0';
        ctx.shadowBlur = 10;
        ctx.fillText('#2', rankX, 375);
        ctx.shadowBlur = 0;
      } else if (rankNum === 3) {
        // Bronze for #3
        ctx.fillStyle = '#cd7f32';
        ctx.font = 'bold 42px Roboto, sans-serif';
        ctx.fillText('#3', rankX, 375);

        ctx.shadowColor = '#cd7f32';
        ctx.shadowBlur = 10;
        ctx.fillText('#3', rankX, 375);
        ctx.shadowBlur = 0;
      } else {
        // Normal rank display
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Roboto, sans-serif';
        ctx.fillText(`#${rankNum}`, rankX, 375);
      }
    }

    // Username with Farcaster icon
    if (farcasterLogo) {
      ctx.drawImage(farcasterLogo, 40, 430, 40, 40);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Roboto, sans-serif';
    ctx.textAlign = 'left';
    const usernameX = farcasterLogo ? 90 : 40;
    ctx.fillText(username, usernameX, 450);

    // Measure username width with the correct font
    const usernameWidth = ctx.measureText(username).width;

    // Army badge - positioned after username with proper spacing
    ctx.font = 'bold 16px Roboto, sans-serif';
    const armyText = `${army.toUpperCase()} ARMY`;
    const badgeTextWidth = ctx.measureText(armyText).width;

    // Draw army badge with proper padding
    const badgeX = usernameX + usernameWidth + 15;
    const badgePadding = 12;
    const badgeHeight = 26;
    const badgeWidth = badgeTextWidth + (badgePadding * 2);

    ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.beginPath();
    ctx.roundRect(badgeX, 450 - badgeHeight/2, badgeWidth, badgeHeight, 4);
    ctx.fill();

    // Badge text (gold color)
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'left';
    ctx.fillText(armyText, badgeX + badgePadding, 450);

    // Bottom section
    // Draw separator line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 510);
    ctx.lineTo(600, 510);
    ctx.stroke();

    // Farcaster logo in bottom left
    if (farcasterLogo) {
      ctx.drawImage(farcasterLogo, 40, 540, 45, 45);
    }

    // Farcaster handle next to logo
    ctx.fillStyle = '#8b5cf6';
    ctx.font = 'bold 24px Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('btcbattle', 95, 563);

    // Referral code section (if provided)
    if (referralCode) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '18px Roboto, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Join with code', 580, 540);

      // Referral code box - properly sized
      ctx.font = 'bold 24px Roboto, sans-serif';
      const refCodeWidth = ctx.measureText(referralCode.toUpperCase()).width;
      const refBoxPadding = 20;
      const refBoxWidth = refCodeWidth + (refBoxPadding * 2);
      const refBoxX = 580 - refBoxWidth;

      ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
      ctx.beginPath();
      ctx.roundRect(refBoxX, 555, refBoxWidth, 38, 6);
      ctx.fill();

      // Referral code text
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText(referralCode.toUpperCase(), refBoxX + refBoxWidth/2, 574);
    }

    // Return as PNG
    const buffer = canvas.toBuffer('image/png');
    return new Response(buffer as any, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
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
