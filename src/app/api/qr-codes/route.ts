import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { generatePharmacyDispatchQR, generatePharmacyDispatchDevolutionQR, generateServiceArrivalQR } from "@/lib/qr-generator";

export async function GET() {
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

    if (!profile || profile.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: "Forbidden - SUPERADMIN access required" }, { status: 403 });
    }

    // Get all active QR codes grouped by type
    const activeQRs = await prisma.qRCode.findMany({
      where: { isActive: true },
      include: {
        service: {
          include: {
            line: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group QRs by type
    const pharmacyDispatchQR = activeQRs.find(qr => qr.type === 'PHARMACY_DISPATCH');
    const pharmacyDispatchDevolutionQR = activeQRs.find(qr => qr.type === 'PHARMACY_DISPATCH_DEVOLUTION');
    const serviceArrivalQRs = activeQRs.filter(qr => qr.type === 'SERVICE_ARRIVAL');

    return NextResponse.json({
      pharmacyDispatchQR,
      pharmacyDispatchDevolutionQR,
      serviceArrivalQRs,
      hasActiveQRs: activeQRs.length > 0
    });

  } catch (error) {
    console.error("Error fetching QR codes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    if (!profile || profile.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: "Forbidden - SUPERADMIN access required" }, { status: 403 });
    }

    const { action, type, serviceId } = await request.json();

    if (action === 'generate') {
      if (type === 'PHARMACY_DISPATCH') {
        // Deactivate existing pharmacy dispatch QR code
        await prisma.qRCode.updateMany({
          where: { 
            isActive: true,
            type: 'PHARMACY_DISPATCH'
          },
          data: { isActive: false }
        });

        // Generate new pharmacy dispatch QR code
        const qrId = `pd_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const qrDataURL = await generatePharmacyDispatchQR(qrId);

        // Save new QR code to database
        const newQR = await prisma.qRCode.create({
          data: {
            qrId,
            type: 'PHARMACY_DISPATCH',
            qrDataURL,
            createdBy: user.id,
            isActive: true
          }
        });

        return NextResponse.json({
          message: "Pharmacy dispatch QR code generated successfully",
          qrCode: newQR
        });

      } else if (type === 'PHARMACY_DISPATCH_DEVOLUTION') {
        // Deactivate existing pharmacy dispatch devolution QR code
        await prisma.qRCode.updateMany({
          where: { 
            isActive: true,
            type: 'PHARMACY_DISPATCH_DEVOLUTION'
          },
          data: { isActive: false }
        });

        // Generate new pharmacy dispatch devolution QR code
        const qrId = `pdd_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const qrDataURL = await generatePharmacyDispatchDevolutionQR(qrId);

        // Save new QR code to database
        const newQR = await prisma.qRCode.create({
          data: {
            qrId,
            type: 'PHARMACY_DISPATCH_DEVOLUTION',
            qrDataURL,
            createdBy: user.id,
            isActive: true
          }
        });

        return NextResponse.json({
          message: "Pharmacy dispatch devolution QR code generated successfully",
          qrCode: newQR
        });

      } else if (type === 'SERVICE_ARRIVAL') {
        if (!serviceId) {
          return NextResponse.json({ error: "Service ID is required for service arrival QR" }, { status: 400 });
        }

        // Get service information
        const service = await prisma.service.findUnique({
          where: { id: serviceId },
          include: {
            line: true
          }
        });

        if (!service) {
          return NextResponse.json({ error: "Service not found" }, { status: 404 });
        }

        // Deactivate existing service arrival QR code for this service
        await prisma.qRCode.updateMany({
          where: { 
            isActive: true,
            type: 'SERVICE_ARRIVAL',
            serviceId: serviceId
          },
          data: { isActive: false }
        });

        // Generate new service arrival QR code
        const qrId = `sa_${service.name}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const qrDataURL = await generateServiceArrivalQR(serviceId, service.name, qrId);

        // Save new QR code to database
        const newQR = await prisma.qRCode.create({
          data: {
            qrId,
            type: 'SERVICE_ARRIVAL',
            qrDataURL,
            serviceId,
            createdBy: user.id,
            isActive: true
          },
          include: {
            service: {
              include: {
                line: true
              }
            }
          }
        });

        return NextResponse.json({
          message: `Service arrival QR code generated successfully for ${service.name}`,
          qrCode: newQR
        });
      }
    } else if (action === 'generate_all_service_arrival') {
      // Get all active services
      const services = await prisma.service.findMany({
        where: { active: true },
        include: {
          line: true
        }
      });

      // Deactivate all existing service arrival QR codes
      await prisma.qRCode.updateMany({
        where: { 
          isActive: true,
          type: 'SERVICE_ARRIVAL'
        },
        data: { isActive: false }
      });

      // Generate QR codes for all services
      const newQRs = [];
      for (const service of services) {
        const qrId = `sa_${service.name}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const qrDataURL = await generateServiceArrivalQR(service.id, service.name, qrId);

        const newQR = await prisma.qRCode.create({
          data: {
            qrId,
            type: 'SERVICE_ARRIVAL',
            qrDataURL,
            serviceId: service.id,
            createdBy: user.id,
            isActive: true
          },
          include: {
            service: {
              include: {
                line: true
              }
            }
          }
        });

        newQRs.push(newQR);
      }

      return NextResponse.json({
        message: `Generated ${newQRs.length} service arrival QR codes`,
        qrCodes: newQRs
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error managing QR codes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}