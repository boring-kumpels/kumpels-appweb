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

    // Build where clause to include both current daily process and independent devolution records
    const whereClause: {
      patientId: string;
      OR?: Array<{
        dailyProcessId?: string | null;
        AND?: Array<{
          transactionType?: string;
          OR?: Array<{
            dailyProcessId?: string | null | { not: string };
          }>;
        }>;
      }>;
    } = {
      patientId,
    };

    if (dailyProcessId) {
      // Include records from the current daily process AND records from independent devolutions
      whereClause.OR = [
        { dailyProcessId },
        { 
          // Independent devolution records - match by patient and scan pattern
          AND: [
            { transactionType: "DEVOLUCION" },
            {
              OR: [
                { dailyProcessId: null },
                { dailyProcessId: { not: dailyProcessId } } // Include other daily processes for this patient
              ]
            }
          ]
        }
      ];
    } else {
      // If no daily process ID provided, get all records for the patient
      // This handles cases where we're looking at independent devolutions without a current daily process
      whereClause.patientId = patientId;
    }

    // Get QR scan records for this patient
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