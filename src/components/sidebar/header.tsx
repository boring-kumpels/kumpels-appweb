"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean;
  ref?: React.Ref<HTMLElement>;
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = React.useState(0);
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Convert pathname to breadcrumb-like display
  const formattedPath = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" / ");

  React.useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop);
    };

    // Add scroll listener to the body
    document.addEventListener("scroll", onScroll, { passive: true });

    // Clean up the event listener on unmount
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "flex h-16 items-center gap-3 bg-background p-4 sm:gap-4",
        fixed && "header-fixed peer/header fixed z-50 w-[inherit] rounded-md",
        offset > 10 && fixed ? "shadow" : "shadow-none",
        className
      )}
      {...props}
    >
      <SidebarTrigger
        variant="outline"
        className={cn("scale-125 sm:scale-100", isMobile && "h-10 w-10")}
      />
      <Separator orientation="vertical" className="h-6" />
      <span
        className={cn(
          "text-sm font-medium text-muted-foreground",
          isMobile && "text-xs truncate flex-1"
        )}
      >
        {formattedPath || "Dashboard"}
      </span>

      {children}
    </header>
  );
}

Header.displayName = "Header";
