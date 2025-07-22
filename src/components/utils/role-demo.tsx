"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/components/ui/use-toast";

type UserRole =
  | "SUPERADMIN"
  | "NURSE"
  | "PHARMACY_VALIDATOR"
  | "PHARMACY_REGENT";

export function RoleDemo() {
  const { profile, refetch } = useCurrentUser();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateRole = async (newRole: UserRole) => {
    if (!profile?.userId) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/profile/${profile.userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update role");
      }

      await refetch?.();
      toast({
        title: "Role Updated",
        description: `Role changed to ${newRole.replace("_", " ")}`,
      });

      // Reload the page to see sidebar changes
      window.location.reload();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const roles: { role: UserRole; label: string; description: string }[] = [
    {
      role: "SUPERADMIN",
      label: "Super Admin",
      description: "Full system access with all administrative features",
    },
    {
      role: "NURSE",
      label: "Nurse",
      description: "Patient care, scheduling, and communication features",
    },
    {
      role: "PHARMACY_VALIDATOR",
      label: "Pharmacy Validator",
      description: "Prescription validation and quality control",
    },
    {
      role: "PHARMACY_REGENT",
      label: "Pharmacy Regent",
      description: "Pharmacy management and staff oversight",
    },
  ];

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Demo</CardTitle>
          <CardDescription>Loading user profile...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role-Based Access Demo</CardTitle>
        <CardDescription>
          Test different user roles to see how the sidebar navigation changes.
          Current role:{" "}
          <Badge variant="secondary">{profile.role?.replace("_", " ")}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {roles.map(({ role, label, description }) => (
            <div
              key={role}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{label}</span>
                  {profile.role === role && (
                    <Badge variant="default" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              </div>
              <Button
                variant={profile.role === role ? "secondary" : "outline"}
                size="sm"
                onClick={() => updateRole(role)}
                disabled={isUpdating || profile.role === role}
              >
                {profile.role === role ? "Active" : "Switch"}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> After switching roles, the page will reload
            to show the new sidebar navigation. Check the sidebar to see
            role-specific sections and navigation items.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
