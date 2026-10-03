import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-blue-800 text-white hover:bg-blue-900 shadow",
        destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
        outline:
          "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900",
        secondary: "bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300",
        ghost: "hover:bg-slate-100 text-slate-700 shadow-none hover:text-slate-900",
        gold: "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 shadow",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";
