import type { HTMLAttributes } from "react";
import type { z } from "zod";
import { string, object } from "zod";

export type UserAuthFormProps = HTMLAttributes<HTMLDivElement>;

export const signInFormSchema = object({
  email: string()
    .min(1, { message: "Por favor ingresa tu correo electrónico" })
    .email({ message: "Dirección de correo electrónico inválida" }),
  password: string()
    .min(1, { message: "Por favor ingresa tu contraseña" })
    .min(7, { message: "La contraseña debe tener al menos 7 caracteres" }),
});

export type SignInFormData = z.infer<typeof signInFormSchema>;
