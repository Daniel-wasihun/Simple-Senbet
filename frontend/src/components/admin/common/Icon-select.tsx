"use client";

import { useMemo, useState, useRef } from "react";
import * as Lucide from "lucide-react";
import { ChevronsUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IconSelectProps {
  value?: string; // the selected icon name
  onValueChange?: (iconName: string) => void; // returns only the name
}

export default function IconSelect({ value, onValueChange }: IconSelectProps) {
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(50);
  const contentRef = useRef<HTMLDivElement>(null);

  // Full icon list
  const iconList = useMemo(() => {
    return Object.entries(Lucide)
      .filter(([name, item]) => {
        if (["createLucideIcon", "LucideIcon"].includes(name)) return false;
        const isComponent =
          typeof item === "function" || (typeof item === "object" && (item as any).$$typeof);
        const isNotAlias = !name.endsWith("Icon");
        return isComponent && isNotAlias;
      })
      .map(([name, Icon]) => ({ name, Icon: Icon as Lucide.LucideIcon }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Filtered icons based on search
  const filteredIcons = useMemo(() => {
    if (!search) return iconList;
    const lowerSearch = search.toLowerCase();
    return iconList.filter(({ name }) => name.toLowerCase().includes(lowerSearch));
  }, [search, iconList]);

  // Lazy loaded icons
  const visibleIcons = filteredIcons.slice(0, visibleCount);

  // Load more on scroll
  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setVisibleCount((prev) => Math.min(prev + 50, filteredIcons.length));
    }
  };

  // Currently selected icon component for display
  const SelectedIcon = value ? (Lucide as any)[value] : null;

  return (
    <Select
      value={value}
      onValueChange={(name) => onValueChange && onValueChange(name)} // return the icon name
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select icon...">
          {value && SelectedIcon && (
            <div className="flex items-center gap-2">
              <SelectedIcon className="h-4 w-4" />
              <span>{value}</span>
            </div>
          )}
        </SelectValue>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </SelectTrigger>

      <SelectContent
        className="max-h-64 overflow-y-auto"
        ref={contentRef}
        onScroll={handleScroll}
      >
        {/* Search input */}
        <div className="sticky top-0 z-10 p-2 bg-popover border-b">
          <input
            type="text"
            placeholder="Search icons..."
            className="w-full rounded border px-2 py-1 text-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(50);
            }}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Showing {filteredIcons.length} of {iconList.length} icons
          </p>
        </div>

        {/* Render visible icons */}
        {visibleIcons.map(({ name, Icon }) => (
          <SelectItem key={name} value={name}>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{name}</span>
            </div>
          </SelectItem>
        ))}

        {/* Loading indicator */}
        {visibleCount < filteredIcons.length && (
          <div className="p-2 text-center text-sm text-muted-foreground">
            Loading more icons...
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
