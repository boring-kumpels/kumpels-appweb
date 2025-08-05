"use client";

import { Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearch } from "@/context/search-context";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  className?: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
}

export function Search({ className = "", placeholder = "Search" }: Props) {
  const { setOpen } = useSearch();
  const isMobile = useIsMobile();

  return (
    <Button
      variant="outline"
      className={cn(
        "relative justify-start rounded-md bg-muted/25 text-sm font-normal text-muted-foreground shadow-none hover:bg-muted/50",
        isMobile
          ? "h-10 w-full flex-1 pr-3"
          : "h-8 w-full flex-1 sm:pr-12 md:w-40 md:flex-none lg:w-56 xl:w-64",
        className
      )}
      onClick={() => setOpen(true)}
    >
      <SearchIcon
        aria-hidden="true"
        className={cn(
          "absolute left-1.5 top-1/2 -translate-y-1/2 h-4 w-4",
          isMobile && "left-3"
        )}
      />
      <span className={cn("ml-3", isMobile && "ml-6")}>{placeholder}</span>
      <kbd
        className={cn(
          "pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100",
          isMobile ? "hidden" : "sm:flex"
        )}
      >
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}
