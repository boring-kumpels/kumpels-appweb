import {
  HelpCircle,
  LayoutDashboard,
  Settings,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  QrCode,
  Building2,
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
      name: "Usuario",
      email: "user@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    teams: [
      {
        name: "Plataforma Médica",
        logo: Building2,
        plan: "Sistema Hospitalario",
      },
    ],
    navGroups: [],
  };

  switch (role) {
    case "SUPERADMIN":
      baseSidebar.navGroups = [
        {
          title: "Operaciones Médicas",
          items: [
            {
              title: "pacientes On-Time",
              url: "/dashboard/pacientes-on-time",
              icon: Clock,
            },
            {
              title: "Estado General",
              url: "/dashboard/estado-general",
              icon: CheckCircle2,
            },
            {
              title: "Estadísticas",
              url: "/dashboard/estadisticas",
              icon: TrendingUp,
            },
            {
              title: "Gestión de Usuarios",
              url: "/admin/users",
              icon: Users,
            },
          ],
        },
        {
          title: "Gestión QR",
          items: [
            {
              title: "Códigos QR",
              url: "/dashboard/qr-management",
              icon: QrCode,
            },
          ],
        },
      ];
      break;

    case "NURSE":
      baseSidebar.navGroups = [
        {
          title: "Operaciones Médicas",
          items: [
            {
              title: "pacientes On-Time",
              url: "/nurse/pacientes-on-time",
              icon: Clock,
            },
            {
              title: "Estado General",
              url: "/nurse/estado-general",
              icon: CheckCircle2,
            },
            {
              title: "Estadísticas",
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
          title: "Operaciones Médicas",
          items: [
            {
              title: "pacientes On-Time",
              url: "/pharmacy/pacientes-on-time",
              icon: Clock,
            },
            {
              title: "Estado General",
              url: "/pharmacy/estado-general",
              icon: CheckCircle2,
            },
            {
              title: "Estadísticas",
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
          title: "Operaciones Médicas",
          items: [
            {
              title: "pacientes On-Time",
              url: "/regent/pacientes-on-time",
              icon: Clock,
            },
            {
              title: "Estado General",
              url: "/regent/estado-general",
              icon: CheckCircle2,
            },
            {
              title: "Estadísticas",
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
              title: "Panel Principal",
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
      title: "Cuenta",
      items: [
        {
          title: "Configuración",
          icon: Settings,
          url: "/settings",
        },
        {
          title: "Centro de Ayuda",
          url: "/help-center",
          icon: HelpCircle,
        },
      ],
    });
  }

  return baseSidebar;
};
