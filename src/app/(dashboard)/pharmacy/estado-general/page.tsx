import { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import EstadoGeneralByPatients from "@/components/dashboard/estado-general/estado-general-by-patients";

export const metadata: Metadata = {
  title: "Estado General - Pharmacy Validator",
  description:
    "Vista general del estado de todas las líneas - Vista de validador farmacéutico",
};

export default async function PharmacyEstadoGeneralPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto p-6">
      <EstadoGeneralByPatients />
    </div>
  );
}
