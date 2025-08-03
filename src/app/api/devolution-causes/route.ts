import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const devolutionCauses = await prisma.devolutionCause.findMany({
      where: {
        active: true,
      },
      orderBy: {
        causeId: "asc",
      },
    });

    return NextResponse.json(devolutionCauses);
  } catch (error) {
    console.error("Error fetching devolution causes:", error);
    return NextResponse.json(
      { error: "Failed to fetch devolution causes" },
      { status: 500 }
    );
  }
}
