import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PatientFilters, LineName, PatientStatus } from "@/types/patient";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineName = searchParams.get("lineName");
    const bedId = searchParams.get("bedId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const filters: PatientFilters = {};

    if (lineName) filters.lineName = lineName as LineName;
    if (bedId) filters.bedId = bedId;
    if (status) filters.status = status as PatientStatus;
    if (search) filters.search = search;

    const whereClause: Record<string, unknown> = {};

    if (filters.lineName) {
      whereClause.bed = {
        lineName: filters.lineName,
      };
    }

    if (filters.bedId) {
      whereClause.bedId = filters.bedId;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.search) {
      whereClause.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { externalId: { contains: filters.search, mode: "insensitive" } },
        { medicalRecord: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      include: {
        bed: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      externalId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      admissionDate,
      bedId,
      medicalRecord,
      notes,
    } = body;

    // Validate required fields
    if (
      !externalId ||
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !gender ||
      !admissionDate ||
      !bedId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if external ID already exists
    const existingPatient = await prisma.patient.findUnique({
      where: { externalId },
    });

    if (existingPatient) {
      return NextResponse.json(
        { error: "Patient with this external ID already exists" },
        { status: 409 }
      );
    }

    // Check if bed exists and is available
    const bed = await prisma.bed.findUnique({
      where: { id: bedId },
      include: {
        patients: {
          where: { status: "ACTIVE" },
        },
      },
    });

    if (!bed) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    if (bed.patients.length > 0) {
      return NextResponse.json(
        { error: "Bed is already occupied" },
        { status: 409 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        externalId,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        admissionDate: new Date(admissionDate),
        bedId,
        medicalRecord,
        notes,
      },
      include: {
        bed: {
          include: {
            line: true,
          },
        },
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    );
  }
}
