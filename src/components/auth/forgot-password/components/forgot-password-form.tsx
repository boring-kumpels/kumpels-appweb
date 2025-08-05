"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Por favor ingresa tu correo electrónico" })
    .email({ message: "Dirección de correo electrónico inválida" }),
});

type FormValues = z.infer<typeof formSchema>;

type ForgotPasswordFormProps = React.HTMLAttributes<HTMLDivElement>;

export function ForgotPasswordForm({
  className,
  ...props
}: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Lazy-load Supabase client to prevent build-time initialization
  const supabase = useMemo(() => {
    if (typeof window !== "undefined") {
      return createClientComponentClient();
    }
    return null;
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      setIsLoading(true);

      // Get the site URL from the environment or current location
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      // Call Supabase's resetPasswordForEmail method
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${siteUrl}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setEmailSent(true);
      toast({
        title: "Revisa tu correo",
        description:
          "Te hemos enviado un enlace para restablecer tu contraseña.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Error",
        description: "Algo salió mal. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      {emailSent ? (
        <div className="text-center">
          <h3 className="mb-1 text-lg font-medium">Revisa tu correo</h3>
          <p className="text-sm text-muted-foreground">
            Te hemos enviado un enlace para restablecer tu contraseña. Por favor
            revisa tu bandeja de entrada y sigue las instrucciones.
          </p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="nombre@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar enlace de restablecimiento"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
