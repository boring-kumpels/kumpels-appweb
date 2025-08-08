import { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import PacientesOnTimeManagement from "@/components/dashboard/pacientes-on-time/pacientes-on-time-management";

export const metadata: Metadata = {
  title: "Pacientes",
  description: "Gestión de pacientes en tiempo para medicación",
};

export default async function PacientesOnTimePage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Pacientes
          </h2>
        </div>
      </div>
      <PacientesOnTimeManagement />
    </div>
  );
}
