import { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import PacientesOnTimeManagement from "@/components/dashboard/pacientes-on-time/pacientes-on-time-management";

export const metadata: Metadata = {
  title: "Pacientes - Nurse",
  description:
    "Gestión de pacientes en tiempo para medicación - Vista de enfermería",
};

export default async function NursePacientesOnTimePage() {
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
          <h2 className="text-3xl font-bold tracking-tight">Pacientes</h2>
        </div>
      </div>
      <PacientesOnTimeManagement />
    </div>
  );
}
