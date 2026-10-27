import React from "react";
import * as Icons from "lucide-react";
import { LucideProps } from "lucide-react";

interface DynamicIconProps extends Omit<LucideProps, "name"> {
  name: string | null | undefined;
  fallback?: string;
}

const DynamicIcon = ({
  name,
  fallback = "HelpCircle",
  ...props
}: DynamicIconProps) => {
  // 1. Return default icon if name is empty
  if (!name) {
    const DefaultIcon = (Icons as any)[fallback] || Icons.Menu;
    return <DefaultIcon {...props} />;
  }

  // Sanitize: Remove slashes and trim whitespace
  const cleanName = name.replace(/\//g, "").trim();

  // Find the component in the Lucide library
  const IconComponent = (Icons as any)[cleanName];

  // Return the icon or a fallback help icon if not found
  if (!IconComponent) {
    const FallbackIcon = (Icons as any)[fallback] || Icons.HelpCircle;
    return <FallbackIcon {...props} />;
  }

  return <IconComponent {...props} />;
};

export default DynamicIcon;
