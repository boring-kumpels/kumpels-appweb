import { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import UsersManagement from "@/components/admin/users/users-management";

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage application users and their roles",
};

export default async function AdminUsersPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Check if user is SUPERADMIN
  const currentUserProfile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { role: true },
  });

  if (currentUserProfile?.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Create and manage application users and their roles.
          </p>
        </div>
      </div>
      <UsersManagement />
    </div>
  );
}
