import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import AuthLayout from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password/components/reset-password-form";

export const metadata: Metadata = {
  title: "Restablecer Contraseña",
  description: "Ingresa tu nueva contraseña",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Card className="p-8 bg-white/5 backdrop-blur-md border-white/10 shadow-2xl shadow-blue-900/20">
        <div className="flex flex-col space-y-3 text-left">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Restablecer Contraseña
          </h1>
          <p className="text-sm text-blue-100/80">
            Ingresa tu nueva contraseña a continuación.
          </p>
        </div>
        <div className="[&_input]:text-white [&_input]:border-white/20 [&_input]:bg-white/10 [&_input]:placeholder:text-white/50 [&_input]:focus:border-white/40 [&_input]:focus:bg-white/15 [&_label]:text-white [&_button]:text-white/70 [&_button]:hover:text-white [&_a]:text-blue-100/80 [&_a]:hover:text-blue-200">
          <ResetPasswordForm />
        </div>
      </Card>
    </AuthLayout>
  );
}
