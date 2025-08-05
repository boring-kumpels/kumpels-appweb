"use client";

import Link from "next/link";
import { BadgeCheck, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@prisma/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function ProfileDropdown() {
  const { profile, user, isLoading } = useAuth();
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <Button
        variant="ghost"
        className={cn(
          "relative rounded-full",
          isMobile ? "h-10 w-10" : "h-8 w-8"
        )}
      >
        <div
          className={cn(
            "rounded-full bg-primary/10 animate-pulse",
            isMobile ? "h-10 w-10" : "h-8 w-8"
          )}
        />
      </Button>
    );
  }

  if (!profile || !user) return null;

  const displayName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  // Get initials for avatar fallback
  const getInitials = () => {
    if (profile.firstName || profile.lastName) {
      return [profile.firstName?.[0], profile.lastName?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  // Get role display name
  const getRoleDisplay = (role: UserRole) => {
    return role
      .toString()
      .replace("_", " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "relative rounded-full",
            isMobile ? "h-10 w-10" : "h-8 w-8"
          )}
        >
          <Avatar
            className={cn(
              "ring-2 ring-primary/10",
              isMobile ? "h-10 w-10" : "h-8 w-8"
            )}
          >
            <AvatarImage
              src={profile.avatarUrl || ""}
              alt={displayName || user.email || "User"}
            />
            <AvatarFallback className="bg-primary/10">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn("w-56", isMobile && "w-64")}
        align="end"
        forceMount
        side={isMobile ? "bottom" : "bottom"}
        alignOffset={isMobile ? 8 : 0}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">
                {displayName || user.email?.split("@")[0]}
              </p>
              <Badge variant="outline" className="ml-2 text-xs">
                {getRoleDisplay(profile.role)}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Cuenta
            </Link>
          </DropdownMenuItem>
          {profile.role === UserRole.SUPERADMIN && (
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <BadgeCheck className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await fetch("/api/auth/signout", { method: "POST" });
            window.location.href = "/login";
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
