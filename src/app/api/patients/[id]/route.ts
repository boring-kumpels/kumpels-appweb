import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";



export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        bed: {
          include: {
            line: true,
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
      { error: "Failed to fetch patient" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // If changing bed, check if new bed is available
    if (bedId && bedId !== existingPatient.bedId) {
      const newBed = await prisma.bed.findUnique({
        where: { id: bedId },
        include: {
          patients: {
            where: { status: "ACTIVE" },
          },
        },
      });

      if (!newBed) {
        return NextResponse.json({ error: "Bed not found" }, { status: 404 });
      }

      if (newBed.patients.length > 0) {
        return NextResponse.json(
          { error: "Bed is already occupied" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (dateOfBirth !== undefined)
      updateData.dateOfBirth = new Date(dateOfBirth);
    if (gender !== undefined) updateData.gender = gender;
    if (admissionDate !== undefined)
      updateData.admissionDate = new Date(admissionDate);
    if (bedId !== undefined) updateData.bedId = bedId;
    if (status !== undefined) updateData.status = status;
    if (medicalRecord !== undefined) updateData.medicalRecord = medicalRecord;
    if (notes !== undefined) updateData.notes = notes;

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData,
      include: {
        bed: {
          include: {
            line: true,
          },
        },
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    await prisma.patient.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { error: "Failed to delete patient" },
      { status: 500 }
    );
  }
}
