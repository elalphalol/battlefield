import * as Sentry from "@sentry/nextjs";
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    throw new Error("Sentry test error from BATTLEFIELD API");
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({
      success: true,
      message: "Test error sent to Sentry",
      timestamp: new Date().toISOString()
    });
  }
}
