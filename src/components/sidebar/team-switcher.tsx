import { CustomLogo } from "./custom-logo";
import { useSidebar } from "@/components/ui/sidebar";

export function TeamSwitcher() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="flex items-center justify-center p-4">
      {!isCollapsed && (
        <div className="flex aspect-square size-36 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <CustomLogo />
        </div>
      )}
    </div>
  );
}
