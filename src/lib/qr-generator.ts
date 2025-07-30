import QRCode from "qrcode";

export enum QRCodeType {
  PHARMACY_DISPATCH = "PHARMACY_DISPATCH",
  SERVICE_ARRIVAL = "SERVICE_ARRIVAL",
}

export interface QRDataPayload {
  type: QRCodeType;
  id: string;
  timestamp: string;
  isActive: boolean;
}

export interface PharmacyDispatchQRData extends QRDataPayload {
  type: QRCodeType.PHARMACY_DISPATCH;
  id: string;
}

export interface ServiceArrivalQRData extends QRDataPayload {
  type: QRCodeType.SERVICE_ARRIVAL;
  id: string;
  serviceId: string;
  serviceName: string;
}

/**
 * Generate QR code for general pharmacy dispatch
 */
export async function generatePharmacyDispatchQR(
  qrId: string = generateQRId()
): Promise<string> {
  const data: PharmacyDispatchQRData = {
    type: QRCodeType.PHARMACY_DISPATCH,
    id: qrId,
    timestamp: new Date().toISOString(),
    isActive: true,
  };

  return generateQRCode(data);
}

/**
 * Generate QR code for service arrival (per service)
 */
export async function generateServiceArrivalQR(
  serviceId: string,
  serviceName: string,
  qrId: string = generateQRId()
): Promise<string> {
  const data: ServiceArrivalQRData = {
    type: QRCodeType.SERVICE_ARRIVAL,
    id: qrId,
    serviceId,
    serviceName,
    timestamp: new Date().toISOString(),
    isActive: true,
  };

  return generateQRCode(data);
}

/**
 * Generic QR code generation function
 */
async function generateQRCode(data: QRDataPayload): Promise<string> {
  const qrString = JSON.stringify(data);

  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: "M",
      type: "image/png",
      margin: 1,
      width: 256,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate unique QR ID
 */
function generateQRId(): string {
  return `qr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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
    if (!data.type || !data.timestamp || !data.id || typeof data.isActive !== 'boolean') {
      console.warn("QR code missing required fields:", data);
      return null;
    }

    // Validate type
    if (!Object.values(QRCodeType).includes(data.type)) {
      console.warn("QR code has invalid type:", data.type);
      return null;
    }

    // Type-specific validation
    if (data.type === QRCodeType.PHARMACY_DISPATCH && !data.id) {
      console.warn("Pharmacy dispatch QR missing id:", data);
      return null;
    }

    if (data.type === QRCodeType.SERVICE_ARRIVAL && (!data.id || !data.serviceId || !data.serviceName)) {
      console.warn("Service arrival QR missing required fields:", data);
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
  const date = new Date(data.timestamp).toLocaleDateString("es-ES");

  switch (data.type) {
    case QRCodeType.PHARMACY_DISPATCH:
      return `Salida de Farmacia - ${date}`;
    case QRCodeType.SERVICE_ARRIVAL:
      const serviceData = data as ServiceArrivalQRData;
      return `Llegada a Servicio - ${serviceData.serviceName} - ${date}`;
    default:
      return `QR Code - ${date}`;
  }
}
