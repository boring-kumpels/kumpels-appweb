import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  title: string;
  subtitle?: string;
  className?: string;
  showValue?: boolean;
  color?: "blue" | "green" | "orange" | "red";
}

const colorMap = {
  blue: {
    circle: "stroke-blue-500",
    background: "stroke-gray-200",
    text: "text-blue-600"
  },
  green: {
    circle: "stroke-green-500", 
    background: "stroke-gray-200",
    text: "text-green-600"
  },
  orange: {
    circle: "stroke-orange-500",
    background: "stroke-gray-200", 
    text: "text-orange-600"
  },
  red: {
    circle: "stroke-red-500",
    background: "stroke-gray-200",
    text: "text-red-600"
  }
};

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  title,
  subtitle,
  className,
  showValue = true,
  color = "green"
}: CircularProgressProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  const colors = colorMap[color];

  return (
    <div className={cn("flex flex-col items-center space-y-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={colors.background}
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(colors.circle, "transition-all duration-1000 ease-in-out")}
            style={{
              transformOrigin: "50% 50%"
            }}
          />
        </svg>

        {/* Center content */}
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={cn("text-2xl font-bold", colors.text)}>
                {normalizedValue}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Labels */}
      <div className="text-center space-y-1">
        <h3 className="text-sm font-medium text-center text-muted-foreground max-w-[140px] leading-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}