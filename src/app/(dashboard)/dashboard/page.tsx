import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Get user's role and redirect to appropriate pacientes-on-time page
  const currentUserProfile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { role: true },
  });

  const role = currentUserProfile?.role;

  // Redirect to role-specific pacientes-on-time page
  switch (role) {
    case "SUPERADMIN":
      redirect("/dashboard/pacientes-on-time");
    case "NURSE":
      redirect("/nurse/pacientes-on-time");
    case "PHARMACY_VALIDATOR":
      redirect("/pharmacy/pacientes-on-time");
    case "PHARMACY_REGENT":
      redirect("/regent/pacientes-on-time");
    default:
      // Fallback to main dashboard pacientes-on-time
      redirect("/dashboard/pacientes-on-time");
  }
}
