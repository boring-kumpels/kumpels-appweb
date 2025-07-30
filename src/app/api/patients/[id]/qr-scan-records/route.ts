import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

interface Params {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: patientId } = await params;
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error } = await supabase.auth.getSession();
    const user = session?.user;

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dailyProcessId = searchParams.get("dailyProcessId");

    if (!dailyProcessId) {
      return NextResponse.json({ error: "Daily process ID required" }, { status: 400 });
    }

    // Get QR scan records for this patient in the daily process
    const qrScanRecords = await prisma.qRScanRecord.findMany({
      where: {
        patientId,
        dailyProcessId,
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
        scannedAt: 'asc',
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