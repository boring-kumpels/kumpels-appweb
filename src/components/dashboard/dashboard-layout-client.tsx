"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SearchProvider } from "@/context/search-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import SkipToMain from "@/components/skip-to-main";
import { Header } from "@/components/sidebar/header";
import { Search } from "@/components/sidebar/search";
import { ProfileDropdown } from "@/components/sidebar/profile-dropdown";
import { QRScanner } from "@/components/dashboard/qr-scanner";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayoutClient({ children }: DashboardLayoutProps) {
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={true}>
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
          <Header>
            <div className="ml-auto flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Search />
              {(profile?.role === "PHARMACY_REGENT" ||
                profile?.role === "SUPERADMIN") && (
                <Button
                  variant="outline"
                  size={isMobile ? "default" : "sm"}
                  onClick={() => setQrScannerOpen(true)}
                  className={cn(
                    "flex items-center gap-2",
                    isMobile
                      ? "h-10 px-4 py-2 w-full sm:w-auto"
                      : "h-8 px-3 py-1"
                  )}
                  title="Escáner QR"
                >
                  <span className={cn("text-sm", isMobile && "text-base")}>
                    {isMobile ? "Escanear QR" : "Escanear"}
                  </span>
                  <QrCode className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                </Button>
              )}
              <ProfileDropdown />
            </div>
          </Header>
          {children}
        </div>
        <QRScanner
          open={qrScannerOpen}
          onOpenChange={setQrScannerOpen}
          currentTab="entrega"
        />
      </SidebarProvider>
    </SearchProvider>
  );
}
