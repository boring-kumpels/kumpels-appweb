import { CustomLogo, CollapsedLogo } from "./custom-logo";
import { useSidebar } from "@/components/ui/sidebar";

export function TeamSwitcher() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`flex items-center justify-center rounded-lg transition-all duration-300 ease-in-out ${
          isCollapsed ? "aspect-square size-16" : "aspect-square size-36"
        }`}
      >
        <div className="relative w-full h-full">
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${
              isCollapsed
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            <CollapsedLogo />
          </div>
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${
              isCollapsed
                ? "opacity-0 scale-95 pointer-events-none"
                : "opacity-100 scale-100"
            }`}
          >
            <CustomLogo />
          </div>
        </div>
      </div>
    </div>
  );
}
