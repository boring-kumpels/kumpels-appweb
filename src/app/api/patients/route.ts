import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { PatientStatus, LineName } from "@/types/patient";

// GET /api/patients - List patients with optional filters
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lineName = searchParams.get("lineName") as LineName;
    const bedId = searchParams.get("bedId");
    const status = searchParams.get("status") as PatientStatus;
    const search = searchParams.get("search");

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (bedId) where.bedId = bedId;

    if (lineName) {
      where.bed = {
        lineName: lineName,
      };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { externalId: { contains: search, mode: "insensitive" } },
        { bed: { number: { contains: search, mode: "insensitive" } } },
      ];
    }

    const patients = await prisma.patient.findMany({
      where,
      include: {
        bed: true,
        medicationProcesses: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: [{ bed: { lineName: "asc" } }, { bed: { number: "asc" } }],
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/patients - Create a new patient
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Check if patient with external ID already exists
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
          where: { status: PatientStatus.ACTIVE },
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

    // Create patient
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
        status: PatientStatus.ACTIVE,
      },
      include: {
        bed: true,
        medicationProcesses: true,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
