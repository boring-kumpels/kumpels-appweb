"use client";

import { useAuth } from "@/providers/auth-provider";
import DashboardButton from "@/components/dashboard/dashboard-button";
import Link from "next/link";

export function AuthHeader() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-9 w-[100px] animate-pulse rounded-md bg-muted" />;
  }

  if (user) {
    return <DashboardButton />;
  }

  return (
    <div className="flex items-center space-x-4">
      <Link
        href="/sign-in"
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
      >
        Sign In
      </Link>
    </div>
  );
}
