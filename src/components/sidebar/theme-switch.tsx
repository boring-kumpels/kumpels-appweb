"use client";

import { useEffect } from "react";
import { Sun } from "lucide-react";
import { useTheme } from "@/context/theme-context";
import { Button } from "@/components/ui/button";

export function ThemeSwitch() {
  const { theme } = useTheme();

  /* Update theme-color meta tag
   * when theme is updated */
  useEffect(() => {
    const themeColor = "#fff";
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) metaThemeColor.setAttribute("content", themeColor);
  }, [theme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="scale-95 rounded-full"
      disabled
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      <span className="sr-only">Light mode</span>
    </Button>
  );
}
