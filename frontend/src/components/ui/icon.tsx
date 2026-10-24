import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconProps {
  icon: LucideIcon;
  variant?: "primary" | "secondary" | "accent" | "default";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

const variantClasses = {
  primary: "icon-primary",
  secondary: "icon-secondary",
  accent: "icon-accent",
  default: "text-slate-600 dark:text-slate-400",
};

export function Icon({
  icon: IconComponent,
  variant = "default",
  size = "md",
  className,
}: IconProps) {
  return (
    <IconComponent
      className={cn(sizeClasses[size], variantClasses[variant], className)}
    />
  );
}
