import { cn } from "@/lib/utils";
import { ReactNode, ElementType } from "react";

interface TypographyProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export function Heading1({
  children,
  className,
  as: Component = "h1",
}: TypographyProps) {
  return (
    <Component className={cn("heading-1", className)}>{children}</Component>
  );
}

export function Heading2({
  children,
  className,
  as: Component = "h2",
}: TypographyProps) {
  return (
    <Component className={cn("heading-2", className)}>{children}</Component>
  );
}

export function Heading3({
  children,
  className,
  as: Component = "h3",
}: TypographyProps) {
  return (
    <Component className={cn("heading-3", className)}>{children}</Component>
  );
}

export function Heading4({
  children,
  className,
  as: Component = "h4",
}: TypographyProps) {
  return (
    <Component className={cn("heading-4", className)}>{children}</Component>
  );
}

export function Heading5({
  children,
  className,
  as: Component = "h5",
}: TypographyProps) {
  return (
    <Component className={cn("heading-5", className)}>{children}</Component>
  );
}

export function Heading6({
  children,
  className,
  as: Component = "h6",
}: TypographyProps) {
  return (
    <Component className={cn("heading-6", className)}>{children}</Component>
  );
}

export function BodyLarge({
  children,
  className,
  as: Component = "p",
}: TypographyProps) {
  return (
    <Component className={cn("body-large", className)}>{children}</Component>
  );
}

export function BodyRegular({
  children,
  className,
  as: Component = "p",
}: TypographyProps) {
  return (
    <Component className={cn("body-regular", className)}>{children}</Component>
  );
}

export function BodySmall({
  children,
  className,
  as: Component = "p",
}: TypographyProps) {
  return (
    <Component className={cn("body-small", className)}>{children}</Component>
  );
}

export function Caption({
  children,
  className,
  as: Component = "span",
}: TypographyProps) {
  return <Component className={cn("caption", className)}>{children}</Component>;
}

export function Label({
  children,
  className,
  as: Component = "label",
}: TypographyProps) {
  return <Component className={cn("label", className)}>{children}</Component>;
}
