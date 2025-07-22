import {
  AlertCircle,
  Calendar,
  ClipboardList,
  Command,
  FileText,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  Heart,
  Phone,
  Activity,
  Package,
  ShieldCheck,
  UserCheck,
  Database,
  BarChart3,
  Shield,
  Pill,
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
        name: "Healthcare System",
        logo: Command,
        plan: "Medical Platform",
      },
    ],
    navGroups: [],
  };

  switch (role) {
    case "SUPERADMIN":
      baseSidebar.navGroups = [
        {
          title: "Administration",
          items: [
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
            {
              title: "User Management",
              url: "/admin/users",
              icon: Users,
            },
            {
              title: "System Settings",
              url: "/admin/settings",
              icon: Settings,
            },
            {
              title: "Security & Permissions",
              url: "/admin/security",
              icon: Shield,
            },
            {
              title: "Analytics & Reports",
              url: "/admin/reports",
              icon: BarChart3,
            },
          ],
        },
        {
          title: "Medical Operations",
          items: [
            {
              title: "All Patients",
              url: "/admin/patients",
              icon: Heart,
            },
            {
              title: "Staff Management",
              url: "/admin/staff",
              icon: UserCheck,
            },
            {
              title: "Pharmacy Oversight",
              url: "/admin/pharmacy",
              icon: Package,
            },
          ],
        },
        {
          title: "System",
          items: [
            {
              title: "Database Management",
              url: "/admin/database",
              icon: Database,
            },
            {
              title: "Audit Logs",
              url: "/admin/logs",
              icon: FileText,
            },
          ],
        },
      ];
      break;

    case "NURSE":
      baseSidebar.navGroups = [
        {
          title: "Patient Care",
          items: [
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
            {
              title: "My Patients",
              url: "/nurse/patients",
              icon: Heart,
            },
            {
              title: "Patient Records",
              url: "/nurse/records",
              icon: FileText,
            },
            {
              title: "Vital Signs",
              url: "/nurse/vitals",
              icon: Activity,
            },
          ],
        },
        {
          title: "Scheduling",
          items: [
            {
              title: "My Schedule",
              url: "/nurse/schedule",
              icon: Calendar,
            },
            {
              title: "Shift Management",
              url: "/nurse/shifts",
              icon: ClipboardList,
            },
          ],
        },
        {
          title: "Communication",
          items: [
            {
              title: "Messages",
              url: "/nurse/messages",
              icon: MessageSquare,
              badge: "3",
            },
            {
              title: "Emergency Contacts",
              url: "/nurse/emergency",
              icon: Phone,
            },
          ],
        },
      ];
      break;

    case "PHARMACY_VALIDATOR":
      baseSidebar.navGroups = [
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

  // Add common settings section for all roles
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

  return baseSidebar;
};
