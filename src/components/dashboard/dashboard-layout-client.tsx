"use client";

import { cn } from "@/lib/utils";
import { SearchProvider } from "@/context/search-context";
import {
  QRScannerProvider,
  useQRScannerContext,
} from "@/context/qr-scanner-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import SkipToMain from "@/components/skip-to-main";
import { Header } from "@/components/sidebar/header";
import { QRScanner } from "@/components/dashboard/qr-scanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { isQRScannerOpen, closeQRScanner } = useQRScannerContext();

  return (
    <>
      <SkipToMain />
      <AppSidebar className="fixed inset-y-0 left-0 z-20" />
      <div
        id="content"
        className={cn(
          "ml-auto w-full max-w-full",
          "peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]",
          "peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]",
          "transition-[width] duration-200 ease-linear",
          "flex min-h-screen flex-col",
          "group-data-[scroll-locked=1]/body:h-full",
          "group-data-[scroll-locked=1]/body:has-[main.fixed-main]:min-h-screen"
        )}
      >
        <Header />
        {children}
      </div>
      <QRScanner
        open={isQRScannerOpen}
        onOpenChange={closeQRScanner}
        currentTab="entrega"
      />
    </>
  );
}

export function DashboardLayoutClient({ children }: DashboardLayoutProps) {
  return (
    <SearchProvider>
      <QRScannerProvider>
        <SidebarProvider defaultOpen={true}>
          <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </SidebarProvider>
      </QRScannerProvider>
    </SearchProvider>
  );
}
