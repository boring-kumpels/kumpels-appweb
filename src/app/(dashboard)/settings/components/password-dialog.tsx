"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { PasswordInput } from "@/components/utils/password-input";
import { PasswordStrengthIndicator } from "@/components/utils/password-strength-indicator";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

// Password validation schema
const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "La contraseña actual es requerida"),
    newPassword: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
      .regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
      .regex(/[0-9]/, "La contraseña debe contener al menos un número")
      .regex(
        /[^A-Za-z0-9]/,
        "La contraseña debe contener al menos un carácter especial"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PasswordDialog({ open, onOpenChange }: PasswordDialogProps) {
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    form.setValue("newPassword", e.target.value);
  };

  async function onSubmit(data: PasswordFormValues) {
    try {
      setIsSubmitting(true);

      // Call API to update password with plain passwords
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al cambiar la contraseña");
      }

      toast({
        title: "Contraseña actualizada",
        description: (
          <div className="flex items-center">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            <span>Tu contraseña ha sido actualizada correctamente.</span>
          </div>
        ),
      });

      // Reset form and close dialog
      form.reset();
      setPassword("");
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Error updating password:", error);

      let errorMessage =
        "No se pudo actualizar la contraseña. Por favor, intenta de nuevo.";

      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes("incorrect")) {
          errorMessage = "La contraseña actual es incorrecta.";
        } else if (error.message.includes("weak")) {
          errorMessage = "La nueva contraseña es demasiado débil.";
        }
      }

      toast({
        title: "Error",
        description: (
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-destructive mr-2" />
            <span>{errorMessage}</span>
          </div>
        ),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDialogOpenChange = (value: boolean) => {
    if (!value) {
      // Reset the form when dialog is closed
      form.reset();
      setPassword("");
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Actualiza tu contraseña para mantener tu cuenta segura.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña Actual</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Contraseña</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="••••••••"
                      {...field}
                      onChange={handlePasswordChange}
                    />
                  </FormControl>
                  <PasswordStrengthIndicator password={password} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Contraseña"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
