import { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import EstadoGeneralManagement from "@/components/dashboard/estado-general/estado-general-management";

export const metadata: Metadata = {
  title: "Estado General",
  description: "Vista general del estado del sistema médico",
};

export default async function EstadoGeneralPage() {
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
          <h2 className="text-3xl font-bold tracking-tight">Estado General</h2>
          <p className="text-muted-foreground">
            Vista general del estado del sistema y procesos médicos.
          </p>
        </div>
      </div>
      <EstadoGeneralManagement />
    </div>
  );
}
