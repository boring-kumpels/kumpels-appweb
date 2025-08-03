'use client';

import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const { signOut } = useAuth();

  return (
    <Button
      variant="outline"
      onClick={() => signOut()}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  );
} 