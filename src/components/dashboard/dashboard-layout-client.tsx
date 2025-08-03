"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SearchProvider } from "@/context/search-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import SkipToMain from "@/components/skip-to-main";
import { Header } from "@/components/sidebar/header";
import { Search } from "@/components/sidebar/search";
import { ThemeSwitch } from "@/components/sidebar/theme-switch";
import { ProfileDropdown } from "@/components/sidebar/profile-dropdown";
import { QRScanner } from "@/components/dashboard/qr-scanner";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayoutClient({ children }: DashboardLayoutProps) {
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const { profile } = useAuth();

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
            <div className="ml-auto flex items-center space-x-4">
              <Search />
              {profile?.role === "PHARMACY_REGENT" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQrScannerOpen(true)}
                  className="h-8 w-8 p-0"
                  title="Escáner QR"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              )}
              <ThemeSwitch />
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
