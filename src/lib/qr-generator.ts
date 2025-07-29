import QRCode from "qrcode";

export enum QRCodeType {
  PHARMACY_DISPATCH = "PHARMACY_DISPATCH",
  FLOOR_ARRIVAL = "FLOOR_ARRIVAL",
}

export interface QRDataPayload {
  type: QRCodeType;
  lineId?: string;
  serviceName?: string;
  timestamp: string;
  processDate: string;
}

export interface PharmacyDispatchQRData extends QRDataPayload {
  type: QRCodeType.PHARMACY_DISPATCH;
  lineId: string;
}

export interface FloorArrivalQRData extends QRDataPayload {
  type: QRCodeType.FLOOR_ARRIVAL;
  serviceName: string;
}

/**
 * Generate QR code for pharmacy dispatch (when regent leaves pharmacy)
 */
export async function generatePharmacyDispatchQR(
  lineId: string,
  processDate: Date = new Date()
): Promise<string> {
  const data: PharmacyDispatchQRData = {
    type: QRCodeType.PHARMACY_DISPATCH,
    lineId,
    timestamp: new Date().toISOString(),
    processDate: processDate.toISOString().split("T")[0], // YYYY-MM-DD format
  };

  const qrString = JSON.stringify(data);

  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: "M",
      type: "image/png",
      quality: 0.92,
      margin: 1,
      width: 256,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating pharmacy dispatch QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate QR code for floor arrival (when regent reaches service/floor)
 */
export async function generateFloorArrivalQR(
  serviceName: string,
  processDate: Date = new Date()
): Promise<string> {
  const data: FloorArrivalQRData = {
    type: QRCodeType.FLOOR_ARRIVAL,
    serviceName,
    timestamp: new Date().toISOString(),
    processDate: processDate.toISOString().split("T")[0], // YYYY-MM-DD format
  };

  const qrString = JSON.stringify(data);

  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: "M",
      type: "image/png",
      quality: 0.92,
      margin: 1,
      width: 256,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating floor arrival QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Parse QR code data from scanned string
 */
export function parseQRData(qrString: string): QRDataPayload | null {
  try {
    // Check if the string looks like JSON (starts with { or [)
    if (!qrString.trim().startsWith("{") && !qrString.trim().startsWith("[")) {
      console.warn("QR code does not appear to be JSON format:", qrString);
      return null;
    }

    const data = JSON.parse(qrString);

    // Validate required fields
    if (!data.type || !data.timestamp || !data.processDate) {
      console.warn("QR code missing required fields:", data);
      return null;
    }

    // Validate type
    if (!Object.values(QRCodeType).includes(data.type)) {
      console.warn("QR code has invalid type:", data.type);
      return null;
    }

    // Type-specific validation
    if (data.type === QRCodeType.PHARMACY_DISPATCH && !data.lineId) {
      console.warn("Pharmacy dispatch QR missing lineId:", data);
      return null;
    }

    if (data.type === QRCodeType.FLOOR_ARRIVAL && !data.serviceName) {
      console.warn("Floor arrival QR missing serviceName:", data);
      return null;
    }

    return data as QRDataPayload;
  } catch (error) {
    console.error("Error parsing QR data:", error);
    console.error("Raw QR string:", qrString);
    return null;
  }
}

/**
 * Generate display text for QR codes
 */
export function getQRDisplayText(data: QRDataPayload): string {
  const date = new Date(data.processDate).toLocaleDateString("es-ES");

  switch (data.type) {
    case QRCodeType.PHARMACY_DISPATCH:
      return `Salida de Farmacia - ${date}`;
    case QRCodeType.FLOOR_ARRIVAL:
      return `Llegada a ${data.serviceName} - ${date}`;
    default:
      return `QR Code - ${date}`;
  }
}
