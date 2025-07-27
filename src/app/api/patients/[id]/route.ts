import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { PatientStatus } from "@/types/patient";

// GET /api/patients/[id] - Get a specific patient
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        bed: true,
        medicationProcesses: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/patients/[id] - Update a patient
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      firstName,
      lastName,
      dateOfBirth,
      gender,
      admissionDate,
      bedId,
      status,
      medicalRecord,
      notes,
    } = body;

    const { id } = await params;

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (dateOfBirth !== undefined)
      updateData.dateOfBirth = new Date(dateOfBirth);
    if (gender !== undefined) updateData.gender = gender;
    if (admissionDate !== undefined)
      updateData.admissionDate = new Date(admissionDate);
    if (status !== undefined) updateData.status = status;
    if (medicalRecord !== undefined) updateData.medicalRecord = medicalRecord;
    if (notes !== undefined) updateData.notes = notes;

    // Handle bed change
    if (bedId !== undefined && bedId !== existingPatient.bedId) {
      // Check if new bed exists and is available
      const newBed = await prisma.bed.findUnique({
        where: { id: bedId },
        include: {
          patients: {
            where: {
              status: PatientStatus.ACTIVE,
              id: { not: id }, // Exclude current patient
            },
          },
        },
      });

      if (!newBed) {
        return NextResponse.json(
          { error: "New bed not found" },
          { status: 404 }
        );
      }

      if (newBed.patients.length > 0) {
        return NextResponse.json(
          { error: "New bed is already occupied" },
          { status: 409 }
        );
      }

      updateData.bedId = bedId;
    }

    // Update patient
    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: updateData,
      include: {
        bed: true,
        medicationProcesses: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/[id] - Delete a patient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Delete patient (this will cascade to medication processes)
    await prisma.patient.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
