"use client";

import { useMemo, useState, useRef } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface Option {
    label: string;
    value: string;
}

interface SearchableSelectProps {
    value?: string;
    onValueChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    disabled?: boolean;
}

export default function SearchableSelect({
    value,
    onValueChange,
    options,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    className,
    disabled = false,
}: SearchableSelectProps) {
    const [search, setSearch] = useState("");
    const contentRef = useRef<HTMLDivElement>(null);

    // Filter options based on search
    const filteredOptions = useMemo(() => {
        if (!search) return options;
        const lowerSearch = search.toLowerCase();
        return options.filter((option) =>
            option.label.toLowerCase().includes(lowerSearch)
        );
    }, [search, options]);

    const selectedLabel = useMemo(() => {
        return options.find((opt) => opt.value === value)?.label;
    }, [value, options]);

    return (
        <Select
            value={value}
            onValueChange={onValueChange}
            disabled={disabled}
        >
            <SelectTrigger className={cn("w-full", className)}>
                <SelectValue placeholder={placeholder}>
                    {value ? selectedLabel : placeholder}
                </SelectValue>
            </SelectTrigger>

            <SelectContent
                className="max-h-64 overflow-y-auto"
                ref={contentRef}
            >
                {/* Search input sticky at top */}
                <div className="sticky top-0 z-10 p-2 bg-popover/95 backdrop-blur-sm border-b">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>

                {filteredOptions.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                        No results found.
                    </div>
                ) : (
                    filteredOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            <span className="flex items-center gap-2">
                                {option.label}
                            </span>
                        </SelectItem>
                    ))
                )}
            </SelectContent>
        </Select>
    );
}
