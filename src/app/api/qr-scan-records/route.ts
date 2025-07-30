import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dailyProcessId = searchParams.get("dailyProcessId");

    if (!dailyProcessId) {
      return NextResponse.json(
        { error: "dailyProcessId is required" },
        { status: 400 }
      );
    }

    const qrScanRecords = await prisma.qRScanRecord.findMany({
      where: {
        dailyProcessId: dailyProcessId,
      },
      include: {
        qrCode: {
          include: {
            service: {
              include: {
                line: true,
              },
            },
          },
        },
      },
      orderBy: {
        scannedAt: "desc",
      },
    });

    return NextResponse.json(qrScanRecords);
  } catch (error) {
    console.error("Error fetching QR scan records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
