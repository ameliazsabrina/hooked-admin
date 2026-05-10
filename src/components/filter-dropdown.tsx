"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type FilterDropdownOption<TValue extends string> = {
  value: TValue;
  label: ReactNode;
};

type FilterDropdownProps<TValue extends string> = {
  value: TValue;
  options: readonly FilterDropdownOption<TValue>[];
  onValueChange: (value: TValue) => void;
  className?: string;
};

export function FilterDropdown<TValue extends string>({
  value,
  options,
  onValueChange,
  className,
}: FilterDropdownProps<TValue>) {
  const selected = options.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("h-10 w-40 justify-between px-3 font-normal", className)}
        >
          <span className="min-w-0 truncate">{selected?.label ?? value}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onValueChange(nextValue as TValue)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
