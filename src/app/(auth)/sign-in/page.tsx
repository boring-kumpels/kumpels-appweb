import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import AuthLayout from "@/components/auth/auth-layout";
import { UserAuthForm } from "@/components/auth/sign-in/components/user-auth-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description: "Inicia sesión en tu cuenta",
};

export default function SignInPage() {
  return (
    <AuthLayout>
      <Card className="p-8 bg-white/5 backdrop-blur-md border-white/10 shadow-2xl shadow-blue-900/20">
        <div className="flex flex-col space-y-3 text-left">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Iniciar Sesión
          </h1>
          <p className="text-sm text-blue-100/80">
            Ingresa tu correo electrónico y contraseña para acceder a tu cuenta.
          </p>
        </div>
        <div className="[&_input]:text-white [&_input]:border-white/20 [&_input]:bg-white/10 [&_input]:placeholder:text-white/50 [&_input]:focus:border-white/40 [&_input]:focus:bg-white/15 [&_label]:text-white [&_button]:text-white/70 [&_button]:hover:text-white [&_a]:text-blue-100/80 [&_a]:hover:text-blue-200">
          <UserAuthForm />
        </div>
        <p className="mt-6 px-8 text-center text-sm text-blue-100/70">
          Al hacer clic en iniciar sesión, aceptas nuestros{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-blue-200 text-blue-100/80 transition-colors"
          >
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-blue-200 text-blue-100/80 transition-colors"
          >
            Política de Privacidad
          </Link>
          .
        </p>
      </Card>
    </AuthLayout>
  );
}
