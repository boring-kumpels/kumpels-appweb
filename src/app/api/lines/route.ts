import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAllLines } from "@/lib/lines";

export async function GET() {
  try {
    const lines = getAllLines();
    
    // Get bed counts for each line
    const linesWithBeds = await Promise.all(
      lines.map(async (line) => {
        const beds = await prisma.bed.findMany({
          where: { lineName: line.name },
          include: {
            patients: {
              where: { status: 'ACTIVE' },
            },
          },
        });
        
        return {
          ...line,
          beds,
        };
      })
    );

    return NextResponse.json(linesWithBeds);
  } catch (error) {
    console.error("Error fetching lines:", error);
    return NextResponse.json(
      { error: "Failed to fetch lines" },
      { status: 500 }
    );
  }
}
