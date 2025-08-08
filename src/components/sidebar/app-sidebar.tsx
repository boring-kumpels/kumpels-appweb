import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavGroup } from "./nav-group";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import { sidebarData } from "./data/sidebar-data";
import { getRoleBasedSidebar } from "./data/role-based-sidebar";
import { useAuth } from "@/providers/auth-provider";
import type { NavGroupProps } from "./types";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile, isLoading } = useAuth();

  // Get role-based sidebar data, fallback to default if no profile or loading
  const currentSidebarData = profile?.role
    ? getRoleBasedSidebar(
        profile.role as
          | "SUPERADMIN"
          | "NURSE"
          | "PHARMACY_VALIDATOR"
          | "PHARMACY_REGENT"
      )
    : sidebarData;

  // Show loading state or empty sidebar while fetching user data
  if (isLoading) {
    return (
      <Sidebar collapsible="icon" variant="floating" {...props}>
        <SidebarHeader>
          <TeamSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {currentSidebarData.navGroups.map((props: NavGroupProps) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
