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

  // Get user's role and redirect to appropriate dashboard
  const currentUserProfile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { role: true },
  });

  if (currentUserProfile?.role === "SUPERADMIN") {
    redirect("/dashboard/pacientes-on-time");
  }

  // For other roles, show a basic dashboard for now
  return (
    <div className="space-y-8">
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your medical system dashboard.
        </p>
      </div>
    </div>
  );
}
