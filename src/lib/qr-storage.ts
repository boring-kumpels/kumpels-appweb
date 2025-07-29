import { QRCodeType } from './qr-generator';

export interface StoredQRCode {
  id: string;
  type: QRCodeType;
  name: string;
  description: string;
  qrDataURL: string;
  lineId?: string;
  serviceName?: string;
  processDate: string;
  generatedDate: string;
}

const QR_STORAGE_KEY = 'qr_codes_storage';
const QR_STORAGE_VERSION = '1.0';

interface QRStorage {
  version: string;
  qrCodes: StoredQRCode[];
  lastUpdated: string;
}

/**
 * Save QR codes to localStorage
 */
export function saveQRCodes(qrCodes: StoredQRCode[]): void {
  try {
    const storage: QRStorage = {
      version: QR_STORAGE_VERSION,
      qrCodes,
      lastUpdated: new Date().toISOString(),
    };
    
    localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.warn('Failed to save QR codes to localStorage:', error);
  }
}

/**
 * Load QR codes from localStorage
 */
export function loadQRCodes(): StoredQRCode[] {
  try {
    const stored = localStorage.getItem(QR_STORAGE_KEY);
    if (!stored) return [];
    
    const storage: QRStorage = JSON.parse(stored);
    
    // Check version compatibility
    if (storage.version !== QR_STORAGE_VERSION) {
      console.warn('QR storage version mismatch, clearing storage');
      clearQRCodes();
      return [];
    }
    
    return storage.qrCodes || [];
  } catch (error) {
    console.warn('Failed to load QR codes from localStorage:', error);
    return [];
  }
}

/**
 * Get QR codes for a specific date
 */
export function getQRCodesForDate(date: string): StoredQRCode[] {
  const allQRs = loadQRCodes();
  return allQRs.filter(qr => qr.processDate === date);
}

/**
 * Check if QR codes exist for a specific date
 */
export function hasQRCodesForDate(date: string): boolean {
  const qrCodes = getQRCodesForDate(date);
  return qrCodes.length > 0;
}

/**
 * Clear all stored QR codes
 */
export function clearQRCodes(): void {
  try {
    localStorage.removeItem(QR_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear QR codes from localStorage:', error);
  }
}

/**
 * Get storage info
 */
export function getStorageInfo(): { count: number; lastUpdated: string | null; size: string } {
  try {
    const stored = localStorage.getItem(QR_STORAGE_KEY);
    if (!stored) {
      return { count: 0, lastUpdated: null, size: '0 KB' };
    }
    
    const storage: QRStorage = JSON.parse(stored);
    const sizeInBytes = new Blob([stored]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    
    return {
      count: storage.qrCodes?.length || 0,
      lastUpdated: storage.lastUpdated,
      size: `${sizeInKB} KB`,
    };
  } catch (error) {
    console.warn('Failed to get storage info:', error);
    return { count: 0, lastUpdated: null, size: '0 KB' };
  }
}

/**
 * Clean up old QR codes (older than specified days)
 */
export function cleanupOldQRCodes(daysToKeep: number = 30): number {
  try {
    const allQRs = loadQRCodes();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const filteredQRs = allQRs.filter(qr => {
      const qrDate = new Date(qr.processDate);
      return qrDate >= cutoffDate;
    });
    
    const removedCount = allQRs.length - filteredQRs.length;
    
    if (removedCount > 0) {
      saveQRCodes(filteredQRs);
    }
    
    return removedCount;
  } catch (error) {
    console.warn('Failed to cleanup old QR codes:', error);
    return 0;
  }
}