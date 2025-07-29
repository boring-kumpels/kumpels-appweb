import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineId = searchParams.get("lineId");
    const available = searchParams.get("available");

    const whereClause: Record<string, unknown> = {};

    if (lineId) {
      whereClause.lineId = lineId;
    }

    if (available === "true") {
      whereClause.patients = {
        none: {
          status: "ACTIVE",
        },
      };
    }

    const beds = await prisma.bed.findMany({
      where: whereClause,
      include: {
        line: true,
        patients: {
          where: { status: "ACTIVE" },
        },
      },
      orderBy: [{ line: { displayName: "asc" } }, { number: "asc" }],
    });

    return NextResponse.json(beds);
  } catch (error) {
    console.error("Error fetching beds:", error);
    return NextResponse.json(
      { error: "Failed to fetch beds" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { number, lineId } = body;

    // Validate required fields
    if (!number || !lineId) {
      return NextResponse.json(
        { error: "Bed number and line ID are required" },
        { status: 400 }
      );
    }

    // Check if line exists
    const line = await prisma.line.findUnique({
      where: { id: lineId },
    });

    if (!line) {
      return NextResponse.json({ error: "Line not found" }, { status: 404 });
    }

    // Check if bed number already exists in this line
    const existingBed = await prisma.bed.findUnique({
      where: {
        lineId_number: {
          lineId,
          number,
        },
      },
    });

    if (existingBed) {
      return NextResponse.json(
        { error: "Bed with this number already exists in this line" },
        { status: 409 }
      );
    }

    const bed = await prisma.bed.create({
      data: {
        number,
        lineId,
      },
      include: {
        line: true,
      },
    });

    return NextResponse.json(bed, { status: 201 });
  } catch (error) {
    console.error("Error creating bed:", error);
    return NextResponse.json(
      { error: "Failed to create bed" },
      { status: 500 }
    );
  }
}
