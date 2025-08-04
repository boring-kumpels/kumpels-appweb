import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export type PasswordStrength = "weak" | "medium" | "strong" | "very-strong";

interface PasswordRequirement {
  label: string;
  regex: RegExp;
  met: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  strength?: number;
  requirements?: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    special: boolean;
  };
}

export function PasswordStrengthIndicator({
  password,
  strength: externalStrength,
  requirements: externalRequirements,
}: PasswordStrengthIndicatorProps) {
  // Define password requirements (only used if external requirements not provided)
  const defaultRequirements: PasswordRequirement[] = [
    {
      label: "Al menos 8 caracteres",
      regex: /.{8,}/,
      met: /.{8,}/.test(password),
    },
    {
      label: "Al menos una letra mayúscula",
      regex: /[A-Z]/,
      met: /[A-Z]/.test(password),
    },
    {
      label: "Al menos una letra minúscula",
      regex: /[a-z]/,
      met: /[a-z]/.test(password),
    },
    {
      label: "Al menos un número",
      regex: /[0-9]/,
      met: /[0-9]/.test(password),
    },
    {
      label: "Al menos un caracter especial",
      regex: /[^A-Za-z0-9]/,
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  // Merge external requirements with default ones if provided
  const requirements = externalRequirements
    ? [
        { label: "Al menos 8 caracteres", met: externalRequirements.length },
        {
          label: "Al menos una letra mayúscula",
          met: externalRequirements.uppercase,
        },
        {
          label: "Al menos una letra minúscula",
          met: externalRequirements.lowercase,
        },
        { label: "Al menos un número", met: externalRequirements.numbers },
        {
          label: "Al menos un caracter especial",
          met: externalRequirements.special,
        },
      ]
    : defaultRequirements;

  // Use provided strength or calculate it
  const metRequirementsCount =
    externalStrength !== undefined
      ? externalStrength
      : requirements.filter((req) => req.met).length;

  let strength: PasswordStrength = "weak";
  let strengthColor = "bg-red-500";
  let strengthWidth = "20%";

  if (metRequirementsCount === 5) {
    strength = "very-strong";
    strengthColor = "bg-green-500";
    strengthWidth = "100%";
  } else if (metRequirementsCount === 4) {
    strength = "strong";
    strengthColor = "bg-sidebar";
    strengthWidth = "75%";
  } else if (metRequirementsCount === 3) {
    strength = "medium";
    strengthColor = "bg-yellow-500";
    strengthWidth = "50%";
  } else if (metRequirementsCount === 2) {
    strength = "weak";
    strengthColor = "bg-orange-500";
    strengthWidth = "25%";
  }

  const strengthText = {
    weak: "Débil",
    medium: "Media",
    strong: "Fuerte",
    "very-strong": "Muy Fuerte",
  };

  return (
    <div className="space-y-2 mt-2">
      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${strengthColor}`}
          style={{ width: strengthWidth }}
        />
      </div>

      <div className="text-sm font-medium">
        {password
          ? `Fortaleza: ${strengthText[strength]}`
          : "Fortaleza de la contraseña"}
      </div>

      <div className="space-y-1.5">
        {requirements.map((requirement, index) => (
          <div key={index} className="flex items-center text-sm">
            {requirement.met ? (
              <CheckCircle2 className="text-green-500 mr-2 h-4 w-4" />
            ) : (
              <XCircle className="text-gray-300 mr-2 h-4 w-4" />
            )}
            <span
              className={requirement.met ? "text-gray-700" : "text-gray-400"}
            >
              {requirement.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
