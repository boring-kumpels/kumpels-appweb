import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Check environment variable
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const serviceKeyLength = process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0;

    return NextResponse.json({
      message: "Admin API test successful",
      environment: {
        hasServiceKey,
        serviceKeyLength:
          serviceKeyLength > 0 ? `${serviceKeyLength} characters` : "Not found",
        nodeEnv: process.env.NODE_ENV,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
