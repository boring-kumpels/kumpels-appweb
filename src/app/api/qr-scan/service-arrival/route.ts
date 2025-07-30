import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error } = await supabase.auth.getSession();
    const user = session?.user;

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check role
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile || profile.role !== 'PHARMACY_REGENT') {
      return NextResponse.json({ 
        error: "Forbidden - Only PHARMACY_REGENT can scan service arrival QRs" 
      }, { status: 403 });
    }

    const { qrId } = await request.json();

    if (!qrId) {
      return NextResponse.json({ error: "QR ID is required" }, { status: 400 });
    }

    // Find the QR code
    const qrCode = await prisma.qRCode.findUnique({
      where: { 
        qrId: qrId,
        isActive: true,
        type: 'SERVICE_ARRIVAL'
      },
      include: {
        service: {
          include: {
            line: true
          }
        }
      }
    });

    if (!qrCode || !qrCode.serviceId) {
      return NextResponse.json({ 
        error: "Código QR no válido, no activo, o no asociado a un servicio" 
      }, { status: 404 });
    }

    // Get current active daily process
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyProcess = await prisma.dailyProcess.findFirst({
      where: {
        date: today,
        status: 'ACTIVE'
      }
    });

    if (!dailyProcess) {
      return NextResponse.json({
        error: "No hay proceso diario activo para hoy"
      }, { status: 400 });
    }

    // Find patients ready for service arrival (ENTREGA completed and pharmacy dispatch scanned)
    const readyPatients = await prisma.patient.findMany({
      where: {
        serviceId: qrCode.serviceId,
        status: 'ACTIVE',
        medicationProcesses: {
          some: {
            step: 'ENTREGA',
            status: 'COMPLETED',
            dailyProcessId: dailyProcess.id
          }
        },
        qrScanRecords: {
          some: {
            dailyProcessId: dailyProcess.id,
            qrCode: {
              type: 'PHARMACY_DISPATCH'
            }
          }
        }
      },
      include: {
        bed: true,
        service: true,
        qrScanRecords: {
          where: {
            dailyProcessId: dailyProcess.id
          },
          include: {
            qrCode: true
          }
        }
      }
    });

    // Filter patients who haven't been scanned for this service yet
    const patientsToScan = readyPatients.filter(patient => {
      const hasServiceArrivalScan = patient.qrScanRecords.some(record => 
        record.qrCode.type === 'SERVICE_ARRIVAL' && 
        record.qrCode.serviceId === qrCode.serviceId
      );
      return !hasServiceArrivalScan;
    });

    if (patientsToScan.length === 0) {
      return NextResponse.json({
        error: "No hay pacientes listos para llegada a este servicio o ya fueron registrados"
      }, { status: 400 });
    }

    // Create scan records for all eligible patients
    await Promise.all(
      patientsToScan.map(patient =>
        prisma.qRScanRecord.create({
          data: {
            patientId: patient.id,
            qrCodeId: qrCode.id,
            scannedBy: user.id,
            dailyProcessId: dailyProcess.id
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Llegada a servicio registrada para ${patientsToScan.length} paciente(s)`,
      patientsCount: patientsToScan.length,
      serviceName: qrCode.service?.name,
      scannedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error processing service arrival QR scan:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}