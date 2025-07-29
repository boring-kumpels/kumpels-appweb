import { useRef, useEffect, useState, useCallback } from "react";
import { BrowserMultiFormatReader, Result } from "@zxing/library";

interface UseQRScannerOptions {
  onScan?: (result: string) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

export function useQRScanner({
  onScan,
  onError,
  enabled = false,
}: UseQRScannerOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef<boolean>(false);
  const startingRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const startScanning = useCallback(async () => {
    console.log(
      "startScanning called, scanningRef.current:",
      scanningRef.current,
      "startingRef.current:",
      startingRef.current
    );
    if (scanningRef.current || startingRef.current) return;

    // Wait a bit for the video element to be ready
    if (!videoRef.current) {
      console.log("Video element not ready, retrying in 100ms...");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => startScanning(), 100);
      return;
    }

    try {
      console.log("Starting QR scanner...");
      startingRef.current = true;
      setError(null);
      setIsScanning(true);

      // Request camera permission
      console.log("Requesting camera permission...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      console.log("Camera permission granted, stream received:", stream);

      streamRef.current = stream;
      setHasPermission(true);

      // Set up video element
      if (videoRef.current) {
        console.log("Setting up video element...");
        videoRef.current.srcObject = stream;

        // Wait for video to be ready before playing
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error("Video element not available"));
            return;
          }

          const handleCanPlay = () => {
            videoRef.current?.removeEventListener("canplay", handleCanPlay);
            videoRef.current?.removeEventListener("error", handleError);
            resolve();
          };

          const handleError = (e: Event) => {
            videoRef.current?.removeEventListener("canplay", handleCanPlay);
            videoRef.current?.removeEventListener("error", handleError);
            reject(new Error("Video element error"));
          };

          videoRef.current.addEventListener("canplay", handleCanPlay);
          videoRef.current.addEventListener("error", handleError);

          // Start playing
          videoRef.current.play().catch(reject);
        });

        console.log("Video element setup complete");
      }

      // Initialize ZXing reader
      console.log("Initializing ZXing reader...");
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // Start decoding from video stream with a small delay to ensure video is ready
      console.log("Starting video decoding...");
      setTimeout(() => {
        if (videoRef.current && readerRef.current) {
          readerRef.current.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            (result: Result | null, error) => {
              if (result) {
                const qrText = result.getText();
                console.log("QR Code detected:", qrText);
                onScan?.(qrText);
              }

              if (error && error.name !== "NotFoundException") {
                console.warn("QR scanning error:", error);
                // Don't show NotFoundException errors as they're normal when no QR is found
              }
            }
          );
        }
      }, 500);

      scanningRef.current = true;
      startingRef.current = false;
    } catch (err) {
      console.error("Failed to start QR scanner:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Camera access failed";

      if (
        errorMessage.includes("Permission denied") ||
        errorMessage.includes("NotAllowedError")
      ) {
        setError(
          "Acceso a la cámara denegado. Haz clic en el ícono de la cámara en la barra de direcciones para permitir el acceso."
        );
        setHasPermission(false);
      } else if (
        errorMessage.includes("NotFoundError") ||
        errorMessage.includes("DevicesNotFoundError")
      ) {
        setError(
          "No se encontró ninguna cámara disponible en este dispositivo."
        );
      } else {
        setError("Error al acceder a la cámara: " + errorMessage);
      }

      setIsScanning(false);
      scanningRef.current = false;
      startingRef.current = false;
      onError?.(errorMessage);
    }
  }, [onScan, onError]);

  const stopScanning = useCallback(() => {
    console.log(
      "stopScanning called, scanningRef.current:",
      scanningRef.current
    );
    if (!scanningRef.current) return;

    try {
      // Stop ZXing reader
      if (readerRef.current) {
        readerRef.current.reset();
        readerRef.current = null;
      }

      // Stop video stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      }

      setIsScanning(false);
      scanningRef.current = false;
      setError(null);
    } catch (err) {
      console.error("Error stopping QR scanner:", err);
    }
  }, []);

  const resetPermissions = useCallback(async () => {
    try {
      // Try to reset permissions by requesting them again
      console.log("Attempting to reset camera permissions...");
      setError(null);
      setHasPermission(null);

      // Stop any existing scanning
      stopScanning();

      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Try to start scanning again
      startScanning();
    } catch (err) {
      console.error("Error resetting permissions:", err);
    }
  }, [stopScanning, startScanning]);

  // Start/stop scanning based on enabled prop with debouncing
  useEffect(() => {
    console.log("useQRScanner: enabled changed to", enabled);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (enabled) {
      // Debounce the start to prevent rapid on/off cycles
      timeoutRef.current = setTimeout(() => {
        if (enabled) {
          startScanning();
        }
      }, 100);
    } else {
      stopScanning();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      stopScanning();
    };
  }, [enabled, startScanning, stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      stopScanning();
    };
  }, [stopScanning]);

  return {
    videoRef,
    isScanning,
    error,
    hasPermission,
    startScanning,
    stopScanning,
    resetPermissions,
  };
}
