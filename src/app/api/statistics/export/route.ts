import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
// Note: prisma import removed as not directly used in export route

export interface ExportFilters {
  lineId?: string;
  serviceId?: string;
  personalRole?: string;
  dateFrom?: string;
  dateTo?: string;
  dailyProcessId?: string;
  format: "pdf" | "csv" | "excel";
  type: "general" | "comparative";
}

// Helper function to generate CSV content
function generateCSV(
  data: Record<string, unknown>,
  type: "general" | "comparative"
): string {
  if (type === "general") {
    const headers = ["Métrica", "Valor (%)"];
    const rows = [
      ["Cumplimiento horario entrega", data.onTimeDelivery],
      ["Cumplimiento horario devoluciones", data.onTimeReturns],
      [
        "Adherencia verificación carro medicamentos",
        data.medicationCartAdherence,
      ],
      [
        "Pacientes con errores en entrega de medicamentos",
        data.patientsWithErrors,
      ],
    ];

    let csvContent = headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.join(",") + "\n";
    });

    return csvContent;
  } else {
    // Comparative data CSV
    let csvContent = "Reporte Comparativo de Estadísticas\n\n";

    // Average time per stage
    csvContent += "Tiempo Promedio por Etapa por Línea\n";
    csvContent +=
      "Línea,Predespacho (hrs),Alistamiento (hrs),Verificación (hrs),Entrega (hrs),Total (hrs)\n";
    const averageTimePerStage = data.averageTimePerStage as Record<
      string,
      unknown
    >;
    const lines = averageTimePerStage?.lines as Array<Record<string, unknown>>;
    lines?.forEach((line: Record<string, unknown>) => {
      csvContent += `${line.name},${line.predespacho},${line.alistamiento},${line.verificacion},${line.entrega},${line.total}\n`;
    });

    csvContent += "\nDevoluciones Manuales por Razón\n";
    csvContent += "Razón,Cantidad,Porcentaje (%)\n";
    const manualReturns = data.manualReturns as Record<string, unknown>;
    const byReason = manualReturns?.byReason as Array<Record<string, unknown>>;
    byReason?.forEach((reason: Record<string, unknown>) => {
      csvContent += `${reason.reason},${reason.count},${reason.percentage}\n`;
    });

    csvContent += "\nCompliance de Temperatura\n";
    const temperatureCompliance = data.temperatureCompliance as Record<
      string,
      unknown
    >;
    csvContent += `Temperatura Promedio,${temperatureCompliance.averageTemperature || "N/A"}\n`;
    csvContent += `Lecturas Fuera de Rango,${temperatureCompliance.outOfRangeCount}\n`;
    csvContent += `Total de Lecturas,${temperatureCompliance.totalReadings}\n`;
    csvContent += `Porcentaje de Compliance,${temperatureCompliance.compliancePercentage}\n`;

    return csvContent;
  }
}

// Helper function to generate simple HTML for PDF conversion
function generateHTML(
  data: Record<string, unknown>,
  type: "general" | "comparative",
  filters: ExportFilters
): string {
  const currentDate = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reporte de Estadísticas - ${type === "general" ? "General" : "Comparativo"}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; }
        .header h1 { color: #3B82F6; margin-bottom: 10px; }
        .header p { color: #666; margin: 5px 0; }
        .filters { background: #F8FAFC; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .filters h3 { color: #374151; margin-bottom: 15px; }
        .filters p { margin: 5px 0; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 10px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
        .metric-card { background: #F9FAFB; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #3B82F6; }
        .metric-label { color: #6B7280; margin-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; }
        th { background: #F3F4F6; font-weight: 600; color: #374151; }
        .footer { margin-top: 40px; text-align: center; color: #6B7280; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Reporte de Estadísticas ${type === "general" ? "General" : "Comparativo"}</h1>
        <p>Generado el ${currentDate}</p>
        <p>Sistema de Gestión de Medicamentos</p>
      </div>

      <div class="filters">
        <h3>Filtros Aplicados</h3>
        ${filters.lineId ? `<p><strong>Línea:</strong> ${filters.lineId}</p>` : ""}
        ${filters.serviceId ? `<p><strong>Servicio:</strong> ${filters.serviceId}</p>` : ""}
        ${filters.personalRole ? `<p><strong>Personal:</strong> ${filters.personalRole}</p>` : ""}
        ${filters.dateFrom ? `<p><strong>Desde:</strong> ${filters.dateFrom}</p>` : ""}
        ${filters.dateTo ? `<p><strong>Hasta:</strong> ${filters.dateTo}</p>` : ""}
      </div>
  `;

  if (type === "general") {
    html += `
      <div class="section">
        <h2>Métricas Generales de Compliance</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${data.onTimeDelivery}%</div>
            <div class="metric-label">Cumplimiento horario entrega</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${data.onTimeReturns}%</div>
            <div class="metric-label">Cumplimiento horario devoluciones</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${data.medicationCartAdherence}%</div>
            <div class="metric-label">Adherencia verificación carro medicamentos</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${data.patientsWithErrors}%</div>
            <div class="metric-label">Pacientes con errores en entrega de medicamentos</div>
          </div>
        </div>
      </div>
    `;
  } else {
    html += `
      <div class="section">
        <h2>Tiempo Promedio por Etapa por Línea</h2>
        <table>
          <thead>
            <tr>
              <th>Línea</th>
              <th>Predespacho (hrs)</th>
              <th>Alistamiento (hrs)</th>
              <th>Verificación (hrs)</th>
              <th>Entrega (hrs)</th>
              <th>Total (hrs)</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              const averageTimePerStage = data.averageTimePerStage as Record<
                string,
                unknown
              >;
              const lines = averageTimePerStage?.lines as Array<
                Record<string, unknown>
              >;
              return (
                lines
                  ?.map(
                    (line: Record<string, unknown>) => `
                <tr>
                  <td>${line.name}</td>
                  <td>${line.predespacho}</td>
                  <td>${line.alistamiento}</td>
                  <td>${line.verificacion}</td>
                  <td>${line.entrega}</td>
                  <td><strong>${line.total}</strong></td>
                </tr>
              `
                  )
                  .join("") || ""
              );
            })()}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Devoluciones Manuales</h2>
        <p><strong>Total:</strong> ${(() => {
          const manualReturns = data.manualReturns as Record<string, unknown>;
          return `${manualReturns.total || 0} devoluciones (${manualReturns.percentage || 0}%)`;
        })()}</p>
        <table>
          <thead>
            <tr>
              <th>Razón</th>
              <th>Cantidad</th>
              <th>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              const manualReturns = data.manualReturns as Record<
                string,
                unknown
              >;
              const byReason = manualReturns?.byReason as Array<
                Record<string, unknown>
              >;
              return (
                byReason
                  ?.map(
                    (reason: Record<string, unknown>) => `
                <tr>
                  <td>${reason.reason}</td>
                  <td>${reason.count}</td>
                  <td>${reason.percentage}%</td>
                </tr>
              `
                  )
                  .join("") || ""
              );
            })()}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Compliance de Temperatura</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${(() => {
              const temperatureCompliance =
                data.temperatureCompliance as Record<string, unknown>;
              return temperatureCompliance.averageTemperature || "N/A";
            })()}</div>
            <div class="metric-label">Temperatura Promedio (°C)</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${(() => {
              const temperatureCompliance =
                data.temperatureCompliance as Record<string, unknown>;
              return `${temperatureCompliance.compliancePercentage || 0}%`;
            })()}</div>
            <div class="metric-label">Compliance de Temperatura</div>
          </div>
        </div>
        <p><strong>Lecturas fuera de rango:</strong> ${(() => {
          const temperatureCompliance = data.temperatureCompliance as Record<
            string,
            unknown
          >;
          return `${temperatureCompliance.outOfRangeCount || 0} de ${temperatureCompliance.totalReadings || 0} lecturas`;
        })()}</p>
      </div>
    `;
  }

  html += `
      <div class="footer">
        <p>Este reporte fue generado automáticamente por el Sistema de Gestión de Medicamentos</p>
        <p>Para consultas técnicas, contacte al administrador del sistema</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

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
    const format = searchParams.get("format") as "pdf" | "csv" | "excel";
    const type = searchParams.get("type") as "general" | "comparative";

    if (!format || !type) {
      return NextResponse.json(
        { error: "Missing format or type parameter" },
        { status: 400 }
      );
    }

    const filters: ExportFilters = {
      lineId: searchParams.get("lineId") || undefined,
      serviceId: searchParams.get("serviceId") || undefined,
      personalRole: searchParams.get("personalRole") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      dailyProcessId: searchParams.get("dailyProcessId") || undefined,
      format,
      type,
    };

    // Fetch the statistics data (reusing the logic from the main statistics endpoint)
    const statsParams = new URLSearchParams();
    statsParams.set("type", type);
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== "format") {
        statsParams.set(key, value);
      }
    });

    const statsResponse = await fetch(
      `${request.nextUrl.origin}/api/statistics?${statsParams.toString()}`,
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
      }
    );

    if (!statsResponse.ok) {
      throw new Error("Failed to fetch statistics for export");
    }

    const statsResult = await statsResponse.json();
    const data = statsResult.data;

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `estadisticas_${type}_${timestamp}`;

    if (format === "csv") {
      const csvContent = generateCSV(data, type);

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    } else if (format === "pdf") {
      // For PDF, we'll return HTML that can be converted to PDF on the client side
      // In a real implementation, you might use puppeteer or a similar library
      const htmlContent = generateHTML(data, type, filters);

      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="${filename}.html"`,
        },
      });
    } else if (format === "excel") {
      // For Excel, we'll create a simple XML format that Excel can open
      // In a real implementation, you might use exceljs or similar library
      let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Estadísticas">
  <Table>`;

      if (type === "general") {
        xmlContent += `
   <Row>
    <Cell><Data ss:Type="String">Métrica</Data></Cell>
    <Cell><Data ss:Type="String">Valor (%)</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Cumplimiento horario entrega</Data></Cell>
    <Cell><Data ss:Type="Number">${data.onTimeDelivery}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Cumplimiento horario devoluciones</Data></Cell>
    <Cell><Data ss:Type="Number">${data.onTimeReturns}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Adherencia verificación carro medicamentos</Data></Cell>
    <Cell><Data ss:Type="Number">${data.medicationCartAdherence}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Pacientes con errores en entrega de medicamentos</Data></Cell>
    <Cell><Data ss:Type="Number">${data.patientsWithErrors}</Data></Cell>
   </Row>`;
      }

      xmlContent += `
  </Table>
 </Worksheet>
</Workbook>`;

      return new NextResponse(xmlContent, {
        headers: {
          "Content-Type": "application/vnd.ms-excel",
          "Content-Disposition": `attachment; filename="${filename}.xls"`,
        },
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  } catch (error) {
    console.error("Error exporting statistics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
