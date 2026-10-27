import * as Icons from "lucide-react";

export function DynamicIcon({ name }: { name?: string }) {
  const Icon = name && (Icons as any)[name];

  if (!Icon) return null;

  return <Icon className="w-5 h-5" />;
}
