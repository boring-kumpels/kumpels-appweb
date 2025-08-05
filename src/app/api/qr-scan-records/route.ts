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

    // Build where clause - if no dailyProcessId provided, get all records
    // If dailyProcessId provided, include both that daily process AND independent devolutions
    const whereClause: {
      OR?: Array<{
        dailyProcessId?: string | null;
        AND?: Array<{
          transactionType?: string;
          OR?: Array<{
            dailyProcessId?: string | null | { not: string };
          }>;
        }>;
      }>;
    } = {};

    if (dailyProcessId) {
      // Include records from the specified daily process AND independent devolution records
      whereClause.OR = [
        { dailyProcessId },
        { 
          // Independent devolution records - match by transaction type and scan pattern
          AND: [
            { transactionType: "DEVOLUCION" },
            {
              OR: [
                { dailyProcessId: null },
                { dailyProcessId: { not: dailyProcessId } } // Include other daily processes for devolutions
              ]
            }
          ]
        }
      ];
    }
    // If no dailyProcessId provided, whereClause remains empty and gets all records

    const qrScanRecords = await prisma.qRScanRecord.findMany({
      where: whereClause,
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
