import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RoleDemo } from "@/components/utils/role-demo";

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          This is your protected dashboard page. You can start adding your
          content here.
        </p>
      </div>

      <RoleDemo />

      {/* Add more dashboard sections here */}
    </div>
  );
}
