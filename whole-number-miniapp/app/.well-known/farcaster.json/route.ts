import { NextRequest, NextResponse } from 'next/server';

// accountAssociation for battlefield-roan.vercel.app (original app)
const VERCEL_MANIFEST = {
  accountAssociation: {
    header: "eyJmaWQiOjE0NTIzNTEsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg0QzVCMjQzNTk4NzAyMzI4OTk3MjE3QUI2MkU2QTBCOGVEMzU5MTA3In0",
    payload: "eyJkb21haW4iOiJiYXR0bGVmaWVsZC1yb2FuLnZlcmNlbC5hcHAifQ",
    signature: "WYmH1zm5702hdPV9zGep9RHq7RW6E+txmYKWsrbeITtjTP6WCQFC0snOKBbfD3DCO4IaYDHHMioqRo3mwWFE1hw="
  },
  frame: {
    version: "next",
    name: "Battlefield",
    canonicalDomain: "btcbattlefield.com",
    iconUrl: "https://btcbattlefield.com/battlefield-logo.jpg",
    imageUrl: "https://btcbattlefield.com/opengraph-image.jpg",
    splashImageUrl: "https://btcbattlefield.com/opengraph-image.jpg",
    splashBackgroundColor: "#0a0a0a",
    homeUrl: "https://btcbattlefield.com",
    webhookUrl: "https://btcbattlefield.com/api/farcaster/webhook"
  }
};

// accountAssociation for btcbattlefield.com (production)
const PRODUCTION_MANIFEST = {
  accountAssociation: {
    header: "eyJmaWQiOjE0NTIzNTEsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg0QzVCMjQzNTk4NzAyMzI4OTk3MjE3QUI2MkU2QTBCOGVEMzU5MTA3In0",
    payload: "eyJkb21haW4iOiJidGNiYXR0bGVmaWVsZC5jb20ifQ",
    signature: "LYewtLzHikt9CHtMGPf6Fn7Oo1fLljax98s/jb0G75taCW+F6KR5i4UYC9Qw9HGgFfdvhRXdlbiWLGf4IV1ujBs="
  },
  frame: {
    version: "next",
    name: "Battlefield",
    canonicalDomain: "btcbattlefield.com",
    iconUrl: "https://btcbattlefield.com/battlefield-logo.jpg",
    imageUrl: "https://btcbattlefield.com/opengraph-image.jpg",
    splashImageUrl: "https://btcbattlefield.com/opengraph-image.jpg",
    splashBackgroundColor: "#0a0a0a",
    homeUrl: "https://btcbattlefield.com",
    webhookUrl: "https://btcbattlefield.com/api/farcaster/webhook"
  }
};

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // Serve different manifests based on domain
  const manifest = host.includes('vercel.app') ? VERCEL_MANIFEST : PRODUCTION_MANIFEST;

  return NextResponse.json(manifest);
}
