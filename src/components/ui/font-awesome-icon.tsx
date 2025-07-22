import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { cn } from "@/lib/utils";

interface FontAwesomeIconProps {
  icon: IconProp;
  className?: string;
  size?:
    | "xs"
    | "sm"
    | "lg"
    | "1x"
    | "2x"
    | "3x"
    | "4x"
    | "5x"
    | "6x"
    | "7x"
    | "8x"
    | "9x"
    | "10x";
  color?: string;
  onClick?: () => void;
  title?: string;
}

export function FontAwesomeIconComponent({
  icon,
  className,
  size = "1x",
  color,
  onClick,
  title,
}: FontAwesomeIconProps) {
  return (
    <FontAwesomeIcon
      icon={icon}
      className={cn(className)}
      size={size}
      style={color ? { color } : undefined}
      onClick={onClick}
      title={title}
    />
  );
}

// Convenience exports for common icons
export { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
export type { IconProp } from "@fortawesome/fontawesome-svg-core";
