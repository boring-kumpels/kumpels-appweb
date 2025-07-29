import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CreateServiceData } from "@/types/patient";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineId = searchParams.get("lineId");

    const where = lineId ? { lineId, active: true } : { active: true };

    const services = await prisma.service.findMany({
      where,
      include: {
        line: true,
        _count: {
          select: {
            patients: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { message: "Error fetching services" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateServiceData = await request.json();

    const service = await prisma.service.create({
      data: {
        ...body,
      },
      include: {
        line: true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { message: "Error creating service" },
      { status: 500 }
    );
  }
}
