"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface AppSelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
}

export function AppSelect({
  value,
  defaultValue,
  onChange,
  onValueChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  required = false,
  name,
  id,
  className,
  triggerClassName,
  contentClassName,
  size = "md",
  ariaLabel,
}: AppSelectProps) {
  const handleValueChange = (val: string) => {
    onValueChange?.(val);
    onChange?.(val);
  };

  const sizeClasses = {
    sm: "h-8 text-xs px-2.5 rounded-[4px]",
    md: "h-9 text-xs px-3 py-1.5 rounded-[4px]",
    lg: "h-10 text-sm px-3.5 rounded-[4px]",
  };

  // Radix Select: passing an empty string means "no value selected" which shows the placeholder.
  // If value is undefined we keep it uncontrolled; otherwise always pass a string.
  // Passing "" as value causes Radix to show the placeholder text correctly.
  const selectValue = value !== undefined ? (String(value) || undefined) : undefined;
  const initialValue = defaultValue !== undefined ? String(defaultValue) : undefined;

  return (
    <div className={cn("relative inline-block w-full min-w-0", className)}>
      <SelectPrimitive.Root
        value={selectValue}
        defaultValue={initialValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        name={name}
        required={required}
      >
        <SelectPrimitive.Trigger
          id={id}
          aria-label={ariaLabel || placeholder}
          className={cn(
            "group flex w-full items-center justify-between gap-2 border bg-white dark:bg-[#141a29]",
            "border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100",
            "shadow-2xs transition-all duration-150 cursor-pointer select-none",
            "hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-[#182032]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900",
            "data-[state=open]:border-blue-600 dark:data-[state=open]:border-blue-500 data-[state=open]:ring-2 data-[state=open]:ring-blue-600/20",
            sizeClasses[size],
            triggerClassName
          )}
        >
          <span className="truncate text-left font-medium block">
            <SelectPrimitive.Value placeholder={placeholder} />
          </span>
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={5}
            className={cn(
              "relative z-50 min-w-[var(--radix-select-trigger-width)] max-h-80 overflow-hidden",
              "rounded-[4px] border border-slate-200/90 dark:border-slate-800",
              "bg-white/95 dark:bg-[#141a29]/95 backdrop-blur-md shadow-xl",
              "text-slate-800 dark:text-slate-100",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
              contentClassName
            )}
          >
            <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <ChevronUp className="h-4 w-4" />
            </SelectPrimitive.ScrollUpButton>

            <SelectPrimitive.Viewport className="p-1.5 space-y-0.5">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center justify-between rounded-lg py-2 pl-3 pr-8",
                    "text-xs font-medium text-slate-700 dark:text-slate-200 outline-none transition-colors",
                    "hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300",
                    "focus:bg-blue-50 dark:focus:bg-blue-950/40 focus:text-blue-700 dark:focus:text-blue-300",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
                    "data-[state=checked]:bg-blue-50/80 dark:data-[state=checked]:bg-blue-950/50",
                    "data-[state=checked]:text-blue-700 dark:data-[state=checked]:text-blue-300 data-[state=checked]:font-semibold"
                  )}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                    {opt.description && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                        {opt.description}
                      </span>
                    )}
                  </div>
                  <SelectPrimitive.ItemIndicator className="absolute right-2.5 flex items-center justify-center">
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>

            <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <ChevronDown className="h-4 w-4" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}
