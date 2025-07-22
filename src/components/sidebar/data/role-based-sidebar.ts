import {
  Command,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Settings,
  Users,
  Activity,
  Package,
  ShieldCheck,
  UserCheck,
  BarChart3,
  Clock,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import type { SidebarData } from "../types";

type UserRole =
  | "SUPERADMIN"
  | "NURSE"
  | "PHARMACY_VALIDATOR"
  | "PHARMACY_REGENT";

export const getRoleBasedSidebar = (role: UserRole): SidebarData => {
  const baseSidebar: SidebarData = {
    user: {
      name: "User",
      email: "user@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    teams: [
      {
        name: "Medical Platform",
        logo: Command,
        plan: "Hospital System",
      },
    ],
    navGroups: [],
  };

  switch (role) {
    case "SUPERADMIN":
      baseSidebar.navGroups = [
        {
          title: "Medical Operations",
          items: [
            {
              title: "On-Time Patients",
              url: "/dashboard/pacientes-on-time",
              icon: Clock,
            },
            {
              title: "General Status",
              url: "/dashboard/estado-general",
              icon: CheckCircle2,
            },
            {
              title: "Statistics",
              url: "/dashboard/estadisticas",
              icon: TrendingUp,
            },
            {
              title: "User Management",
              url: "/admin/users",
              icon: Users,
            },
          ],
        },
      ];
      break;

    case "NURSE":
      baseSidebar.navGroups = [
        {
          title: "Medical Operations",
          items: [
            {
              title: "On-Time Patients",
              url: "/nurse/pacientes-on-time",
              icon: Clock,
            },
            {
              title: "Statistics",
              url: "/nurse/estadisticas",
              icon: TrendingUp,
            },
          ],
        },
      ];
      break;

    case "PHARMACY_VALIDATOR":
      baseSidebar.navGroups = [
        {
          title: "Medical Operations",
          items: [
            {
              title: "On-Time Patients",
              url: "/pharmacy/pacientes-on-time",
              icon: Clock,
            },
            {
              title: "General Status",
              url: "/pharmacy/estado-general",
              icon: CheckCircle2,
            },
            {
              title: "Statistics",
              url: "/pharmacy/estadisticas",
              icon: TrendingUp,
            },
          ],
        },
      ];
      break;

    case "PHARMACY_REGENT":
      baseSidebar.navGroups = [
        {
          title: "Medical Operations",
          items: [
            {
              title: "On-Time Patients",
              url: "/regent/pacientes-on-time",
              icon: Clock,
            },
            {
              title: "General Status",
              url: "/regent/estado-general",
              icon: CheckCircle2,
            },
            {
              title: "Statistics",
              url: "/regent/estadisticas",
              icon: TrendingUp,
            },
          ],
        },
      ];
      break;

    default:
      // Fallback to basic navigation
      baseSidebar.navGroups = [
        {
          title: "General",
          items: [
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
          ],
        },
      ];
  }

  // Add common settings section for all roles EXCEPT NURSE, PHARMACY_VALIDATOR, and PHARMACY_REGENT
  if (
    role !== "NURSE" &&
    role !== "PHARMACY_VALIDATOR" &&
    role !== "PHARMACY_REGENT"
  ) {
    baseSidebar.navGroups.push({
      title: "Account",
      items: [
        {
          title: "Settings",
          icon: Settings,
          url: "/settings",
        },
        {
          title: "Help Center",
          url: "/help-center",
          icon: HelpCircle,
        },
      ],
    });
  }

  return baseSidebar;
};
