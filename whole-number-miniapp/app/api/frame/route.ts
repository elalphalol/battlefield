import { NextRequest, NextResponse } from 'next/server';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET() {
  return NextResponse.json({
    name: 'BATTLEFIELD',
    description: '⚔️ Bears 🐻 vs Bulls 🐂 Bitcoin Trading Battle',
    image: `${appUrl}/opengraph-image.jpg`,
    buttons: [
      {
        label: 'Enter The Battlefield',
        action: 'link',
        target: appUrl
      }
    ]
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle frame button actions
    // For now, just return the frame metadata
    return NextResponse.json({
      image: `${appUrl}/opengraph-image.jpg`,
      buttons: [
        {
          label: 'Enter The Battlefield',
          action: 'link',
          target: appUrl
        }
      ]
    });
  } catch (error) {
    console.error('Frame API error:', error);
    return NextResponse.json(
      { error: 'Invalid frame request' },
      { status: 400 }
    );
  }
}
