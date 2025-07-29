import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CreateLineData } from "@/types/patient";

export async function GET() {
  try {
    const lines = await prisma.line.findMany({
      where: { active: true },
      include: {
        services: {
          where: { active: true },
          orderBy: { name: "asc" },
        },
        beds: {
          where: { active: true },
          orderBy: { number: "asc" },
        },
      },
      orderBy: { displayName: "asc" },
    });

    return NextResponse.json(lines);
  } catch (error) {
    console.error("Error fetching lines:", error);
    return NextResponse.json(
      { message: "Error fetching lines" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateLineData = await request.json();

    const line = await prisma.line.create({
      data: {
        ...body,
      },
      include: {
        services: true,
        beds: true,
      },
    });

    return NextResponse.json(line, { status: 201 });
  } catch (error) {
    console.error("Error creating line:", error);
    return NextResponse.json(
      { message: "Error creating line" },
      { status: 500 }
    );
  }
}
