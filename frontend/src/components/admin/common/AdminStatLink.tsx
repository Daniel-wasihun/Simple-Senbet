// src/components/admin/common/AdminStatLink.tsx
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AdminStatLinkProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  href: string;
  className?: string;
}

export function AdminStatLink({
  title,
  value,
  icon: Icon,
  color,
  href,
  className,
}: AdminStatLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative bg-slate-50/80 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-5 transition-all duration-300 hover:shadow-xl hover:border-[#00A8E8]/50 hover:-translate-y-1 overflow-hidden",
        className
      )}
    >
      {/* Background Tech Accent */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-[#00A8E8]/0 to-[#00A8E8]/10 rounded-full blur-2xl group-hover:bg-[#00A8E8]/20 transition-all duration-500" />

      {/* Top Scanning Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00A8E8]/40 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

      {/* Icon Container */}
      <div className={cn(
        "relative p-4 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner",
        color
      )}>
        {/* Icon Background Glow */}
        <div className="absolute inset-0 bg-black/10 dark:bg-white/10" />

        {/* Icon */}
        <Icon size={24} className="relative z-10 text-white drop-shadow-md" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
          {title}
        </p>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
          {value}
        </h3>
      </div>
    </Link>
  );
}