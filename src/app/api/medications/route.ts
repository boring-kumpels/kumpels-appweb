import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import prisma from "@/lib/prisma";

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
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build search conditions
    const where: {
      active: boolean;
      OR?: Array<{
        [key: string]: {
          contains: string;
          mode: string;
        };
      }>;
    } = {
      active: true,
    };

    if (query) {
      where.OR = [
        {
          codigoServinte: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          codigoNuevoEstandar: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          cumSinCeros: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          cumConCeros: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          nombrePreciso: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          principioActivo: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          marcaComercial: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          nuevaEstructuraEstandarSemantico: {
            contains: query,
            mode: "insensitive",
          },
        },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.medication.count({ where });

    // Get medications with pagination
    const medications = await prisma.medication.findMany({
      where,
      select: {
        id: true,
        codigoServinte: true,
        codigoNuevoEstandar: true,
        cumSinCeros: true,
        cumConCeros: true,
        nombrePreciso: true,
        principioActivo: true,
        concentracionEstandarizada: true,
        formaFarmaceutica: true,
        marcaComercial: true,
        nuevaEstructuraEstandarSemantico: true,
        clasificacionArticulo: true,
        viaAdministracion: true,
        descripcionCum: true,
        active: true,
      },
      orderBy: [
        {
          nombrePreciso: "asc",
        },
        {
          codigoServinte: "asc",
        },
      ],
      skip,
      take: limit,
    });

    return NextResponse.json({
      medications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching medications:", error);
    return NextResponse.json(
      { error: "Failed to fetch medications" },
      { status: 500 }
    );
  }
}
