import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const army = searchParams.get('army') || 'bulls';
    const pnl = parseFloat(searchParams.get('pnl') || '0');

    // Determine which image to serve based on army and P&L
    const isWin = pnl >= 0;
    let imageName: string;

    if (army === 'bears') {
      imageName = isWin ? 'bears-win.png' : 'bears-loss.png';
    } else {
      imageName = isWin ? 'bulls-win.png' : 'bulls-loss.png';
    }

    // Read the image file from public folder
    const imagePath = path.join(process.cwd(), 'public', imageName);
    const imageBuffer = await readFile(imagePath);

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error serving share card:', error);

    // Fallback to the main logo if something goes wrong
    try {
      const fallbackPath = path.join(process.cwd(), 'public', 'battlefield-logo.jpg');
      const fallbackBuffer = await readFile(fallbackPath);
      return new NextResponse(fallbackBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch {
      return new NextResponse('Image not found', { status: 404 });
    }
  }
}
