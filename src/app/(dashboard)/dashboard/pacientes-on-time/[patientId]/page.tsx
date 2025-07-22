import { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import PatientDetailView from "@/components/dashboard/pacientes-on-time/patient-detail-view";

export const metadata: Metadata = {
  title: "Detalles del Paciente",
  description: "Vista detallada del paciente y procesos médicos",
};

interface Props {
  params: {
    patientId: string;
  };
}

export default async function PatientDetailPage({ params }: Props) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      <PatientDetailView patientId={params.patientId} />
    </div>
  );
}
