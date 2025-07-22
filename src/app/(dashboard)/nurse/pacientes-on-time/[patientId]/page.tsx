import { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import PatientDetailView from "@/components/dashboard/pacientes-on-time/patient-detail-view";

export const metadata: Metadata = {
  title: "Detalles del Paciente - Nurse",
  description:
    "Vista detallada del paciente y gestión de medicación - Vista de enfermería",
};

interface PatientDetailPageProps {
  params: Promise<{
    patientId: string;
  }>;
}

export default async function NursePatientDetailPage({
  params,
}: PatientDetailPageProps) {
  const { patientId } = await params;
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return <PatientDetailView patientId={patientId} />;
}
