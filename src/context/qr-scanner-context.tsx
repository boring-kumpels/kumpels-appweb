"use client";

import React, { createContext, useContext, useState } from "react";

interface QRScannerContextType {
  isQRScannerOpen: boolean;
  openQRScanner: () => void;
  closeQRScanner: () => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

const QRScannerContext = createContext<QRScannerContextType | undefined>(
  undefined
);

export function QRScannerProvider({ children }: { children: React.ReactNode }) {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("entrega");

  const openQRScanner = () => setIsQRScannerOpen(true);
  const closeQRScanner = () => setIsQRScannerOpen(false);

  return (
    <QRScannerContext.Provider
      value={{
        isQRScannerOpen,
        openQRScanner,
        closeQRScanner,
        currentTab,
        setCurrentTab,
      }}
    >
      {children}
    </QRScannerContext.Provider>
  );
}

export function useQRScannerContext() {
  const context = useContext(QRScannerContext);
  if (context === undefined) {
    throw new Error(
      "useQRScannerContext must be used within a QRScannerProvider"
    );
  }
  return context;
}
