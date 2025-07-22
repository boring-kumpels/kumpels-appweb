import {
  AlertCircle,
  ClipboardList,
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
  Pill,
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
        {
          title: "Pharmacy Operations",
          items: [
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
            {
              title: "Prescription Validation",
              url: "/pharmacy/validation",
              icon: ShieldCheck,
              badge: "5",
            },
            {
              title: "Drug Database",
              url: "/pharmacy/drugs",
              icon: Pill,
            },
            {
              title: "Inventory Check",
              url: "/pharmacy/inventory",
              icon: Package,
            },
          ],
        },
        {
          title: "Quality Control",
          items: [
            {
              title: "Validation Queue",
              url: "/pharmacy/queue",
              icon: ClipboardList,
            },
            {
              title: "Error Reports",
              url: "/pharmacy/errors",
              icon: AlertCircle,
            },
            {
              title: "Audit Trail",
              url: "/pharmacy/audit",
              icon: FileText,
            },
          ],
        },
      ];
      break;

    case "PHARMACY_REGENT":
      baseSidebar.navGroups = [
        {
          title: "Pharmacy Management",
          items: [
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
            {
              title: "Staff Oversight",
              url: "/regent/staff",
              icon: Users,
            },
            {
              title: "Validation Reports",
              url: "/regent/reports",
              icon: BarChart3,
            },
            {
              title: "Policy Management",
              url: "/regent/policies",
              icon: FileText,
            },
          ],
        },
        {
          title: "Operations",
          items: [
            {
              title: "Inventory Management",
              url: "/regent/inventory",
              icon: Package,
            },
            {
              title: "Quality Metrics",
              url: "/regent/metrics",
              icon: Activity,
            },
            {
              title: "Compliance Check",
              url: "/regent/compliance",
              icon: ShieldCheck,
            },
          ],
        },
        {
          title: "Administration",
          items: [
            {
              title: "System Settings",
              url: "/regent/settings",
              icon: Settings,
            },
            {
              title: "Validator Management",
              url: "/regent/validators",
              icon: UserCheck,
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

  // Add common settings section for all roles EXCEPT NURSE
  if (role !== "NURSE") {
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
