import {
  AlertCircle,
  AppWindow,
  AudioWaveform,
  Ban,
  Bug,
  CheckSquare,
  Command,
  GalleryVerticalEnd,
  HelpCircle,
  LayoutDashboard,
  Lock,
  LockKeyhole,
  MessageSquare,
  Settings,
  ServerCrash,
  UserX,
  Users,
} from "lucide-react";
import type { SidebarData } from "../types";

export const sidebarData: SidebarData = {
  user: {
    name: "satnaing",
    email: "satnaingdev@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Plataforma Médica",
      plan: "Sistema Hospitalario",
    },
  ],
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Panel Principal",
          url: "/",
          icon: LayoutDashboard,
        },
        {
          title: "Tareas",
          url: "/tasks",
          icon: CheckSquare,
        },
        {
          title: "Aplicaciones",
          url: "/apps",
          icon: AppWindow,
        },
        {
          title: "Chats",
          url: "/chats",
          badge: "3",
          icon: MessageSquare,
        },
        {
          title: "Usuarios",
          url: "/users",
          icon: Users,
        },
      ],
    },
    {
      title: "Páginas",
      items: [
        {
          title: "Autenticación",
          icon: Lock,
          items: [
            {
              title: "Iniciar Sesión",
              url: "/sign-in",
            },
            {
              title: "Iniciar Sesión (2 Col)",
              url: "/sign-in-2",
            },
            {
              title: "Registrarse",
              url: "/sign-up",
            },
            {
              title: "Olvidé Contraseña",
              url: "/forgot-password",
            },
            {
              title: "OTP",
              url: "/otp",
            },
          ],
        },
        {
          title: "Errores",
          icon: Bug,
          items: [
            {
              title: "No Autorizado",
              url: "/401",
              icon: LockKeyhole,
            },
            {
              title: "Prohibido",
              url: "/403",
              icon: UserX,
            },
            {
              title: "No Encontrado",
              url: "/404",
              icon: AlertCircle,
            },
            {
              title: "Error del Servidor",
              url: "/500",
              icon: ServerCrash,
            },
            {
              title: "Error de Mantenimiento",
              url: "/503",
              icon: Ban,
            },
          ],
        },
      ],
    },
    {
      title: "Otros",
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
    },
  ],
};
