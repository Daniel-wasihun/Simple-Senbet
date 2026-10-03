import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-blue-100 text-blue-900 border border-blue-200",
        secondary: "border-transparent bg-amber-100 text-amber-900 border border-amber-300",
        success: "border-transparent bg-emerald-100 text-emerald-900 border border-emerald-300",
        destructive: "border-transparent bg-rose-100 text-rose-800 border border-rose-300",
        outline: "text-slate-700 border border-slate-300 bg-white",
        warning: "border-transparent bg-yellow-100 text-yellow-900 border border-yellow-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
