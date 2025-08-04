"use client";

import { useAuth } from "@/providers/auth-provider";
import { QRManagement } from "@/components/dashboard/qr-management/qr-management";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function QRManagementPage() {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sidebar mx-auto mb-2"></div>
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== "SUPERADMIN") {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center text-center">
              <div>
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Acceso Restringido
                </h2>
                <p className="text-muted-foreground">
                  Esta funcionalidad está disponible únicamente para usuarios
                  SUPERADMIN.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <QRManagement />;
}
