import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import AuthLayout from "@/components/auth/auth-layout";
import { MagicLinkForm } from "@/components/auth/magic-link/components/magic-link-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Iniciar Sesión con Enlace Mágico",
  description: "Inicia sesión sin contraseña",
};

export default function MagicLinkPage() {
  return (
    <AuthLayout>
      <Card className="p-6">
        <div className="flex flex-col space-y-2 text-left">
          <h1 className="text-2xl font-semibold tracking-tight">
            Inicio de Sesión Sin Contraseña
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu correo electrónico para recibir un enlace mágico para
            iniciar sesión.{" "}
            <Link
              href="/sign-in"
              className="underline underline-offset-4 hover:text-primary"
            >
              Volver a Iniciar Sesión
            </Link>
          </p>
        </div>
        <MagicLinkForm />
      </Card>
    </AuthLayout>
  );
}
