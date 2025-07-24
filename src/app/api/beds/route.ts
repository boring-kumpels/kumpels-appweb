import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineName = searchParams.get("lineName");
    const available = searchParams.get("available");

    const whereClause: Record<string, unknown> = {};

    if (lineName) {
      whereClause.lineName = lineName;
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
        patients: {
          where: { status: "ACTIVE" },
        },
      },
      orderBy: [{ lineName: "asc" }, { number: "asc" }],
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

    const { number, lineName } = body;

    // Validate required fields
    if (!number || !lineName) {
      return NextResponse.json(
        { error: "Bed number and line name are required" },
        { status: 400 }
      );
    }

    // Check if bed number already exists in this line
    const existingBed = await prisma.bed.findUnique({
      where: {
        lineName_number: {
          lineName,
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
        lineName,
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
