import QRCode from "qrcode";

export enum QRCodeType {
  PHARMACY_DISPATCH = "PHARMACY_DISPATCH",
  PHARMACY_DISPATCH_DEVOLUTION = "PHARMACY_DISPATCH_DEVOLUTION",
  SERVICE_ARRIVAL = "SERVICE_ARRIVAL",
  DEVOLUTION_PICKUP = "DEVOLUTION_PICKUP",
  DEVOLUTION_RETURN = "DEVOLUTION_RETURN",
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

export interface PharmacyDispatchDevolutionQRData extends QRDataPayload {
  type: QRCodeType.PHARMACY_DISPATCH_DEVOLUTION;
  id: string;
}

export interface ServiceArrivalQRData extends QRDataPayload {
  type: QRCodeType.SERVICE_ARRIVAL;
  id: string;
  serviceId: string;
  serviceName: string;
}

export interface DevolutionPickupQRData extends QRDataPayload {
  type: QRCodeType.DEVOLUTION_PICKUP;
  id: string;
  serviceId: string;
  serviceName: string;
}

export interface DevolutionReturnQRData extends QRDataPayload {
  type: QRCodeType.DEVOLUTION_RETURN;
  id: string;
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
 * Generate QR code for pharmacy dispatch specific to devolutions
 */
export async function generatePharmacyDispatchDevolutionQR(
  qrId: string = generateQRId()
): Promise<string> {
  const data: PharmacyDispatchDevolutionQRData = {
    type: QRCodeType.PHARMACY_DISPATCH_DEVOLUTION,
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
 * Generate QR code for devolution pickup (nursing initiates return)
 */
export async function generateDevolutionPickupQR(
  serviceId: string,
  serviceName: string,
  qrId: string = generateQRId()
): Promise<string> {
  const data: DevolutionPickupQRData = {
    type: QRCodeType.DEVOLUTION_PICKUP,
    id: qrId,
    serviceId,
    serviceName,
    timestamp: new Date().toISOString(),
    isActive: true,
  };

  return generateQRCode(data);
}

/**
 * Generate QR code for devolution return (pharmacy receives back)
 */
export async function generateDevolutionReturnQR(
  qrId: string = generateQRId()
): Promise<string> {
  const data: DevolutionReturnQRData = {
    type: QRCodeType.DEVOLUTION_RETURN,
    id: qrId,
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

    if (data.type === QRCodeType.PHARMACY_DISPATCH_DEVOLUTION && !data.id) {
      console.warn("Pharmacy dispatch devolution QR missing id:", data);
      return null;
    }

    if (data.type === QRCodeType.SERVICE_ARRIVAL && (!data.id || !data.serviceId || !data.serviceName)) {
      console.warn("Service arrival QR missing required fields:", data);
      return null;
    }

    if (data.type === QRCodeType.DEVOLUTION_PICKUP && (!data.id || !data.serviceId || !data.serviceName)) {
      console.warn("Devolution pickup QR missing required fields:", data);
      return null;
    }

    if (data.type === QRCodeType.DEVOLUTION_RETURN && !data.id) {
      console.warn("Devolution return QR missing id:", data);
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
    case QRCodeType.PHARMACY_DISPATCH_DEVOLUTION:
      return `Salida de Farmacia (Devolución) - ${date}`;
    case QRCodeType.SERVICE_ARRIVAL:
      const serviceData = data as ServiceArrivalQRData;
      return `Llegada a Servicio - ${serviceData.serviceName} - ${date}`;
    case QRCodeType.DEVOLUTION_PICKUP:
      const pickupData = data as DevolutionPickupQRData;
      return `Recogida de Devolución - ${pickupData.serviceName} - ${date}`;
    case QRCodeType.DEVOLUTION_RETURN:
      return `Recepción de Devolución - ${date}`;
    default:
      return `QR Code - ${date}`;
  }
}
