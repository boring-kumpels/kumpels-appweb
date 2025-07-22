import { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import EstadisticasManagement from "@/components/dashboard/estadisticas/estadisticas-management";

export const metadata: Metadata = {
  title: "Estadísticas",
  description: "Estadísticas y métricas del sistema médico",
};

export default async function EstadisticasPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estadísticas</h2>
          <p className="text-muted-foreground">
            Métricas y análisis del rendimiento del sistema médico.
          </p>
        </div>
      </div>
      <EstadisticasManagement />
    </div>
  );
}
