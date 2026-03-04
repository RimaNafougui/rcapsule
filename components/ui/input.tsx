"use client";

import { Input as HeroUIInput } from "@heroui/react";
import { Search, X } from "lucide-react";
import { type ReactNode } from "react";
import clsx from "clsx";

const variantClassNames = {
  default: {
    inputWrapper:
      "border border-default-200 bg-default-50 hover:bg-default-100 transition-colors shadow-none",
    input: "text-sm",
    label: "text-xs uppercase tracking-widest font-bold text-default-500",
  },
  underline: {
    inputWrapper:
      "border-b border-default-400 bg-transparent rounded-none px-0 shadow-none hover:border-foreground transition-colors",
    input: "text-sm",
    label: "text-xs uppercase tracking-widest font-bold text-default-500",
  },
  search: {
    inputWrapper:
      "border border-default-200 bg-default-50 hover:bg-default-100 transition-colors shadow-none",
    input: "text-sm",
    label: "text-xs uppercase tracking-widest font-bold text-default-500",
  },
} as const;

/**
 * Shared props that exist on every input variant.
 */
type DSInputShared = {
  label?: string;
  helperText?: string;
  error?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  type?: string;
  name?: string;
  required?: boolean;
  size?: "sm" | "md" | "lg";
};

/**
 * Default / underline variant.
 *
 * - `icon` is accepted (no search icon is injected automatically).
 * - `onClear` is forbidden (`never`) — passing it would be a type error,
 *   which prevents the easy mistake of wiring up a clear handler on a
 *   non-search input where nothing would render it.
 */
type DSInputDefault = DSInputShared & {
  variant?: "default" | "underline";
  icon?: ReactNode;
  value?: string;
  onClear?: never;
};

/**
 * Search variant.
 *
 * - `value` is required so the clear button can render conditionally.
 * - `onClear` is required — the search input always shows a clear button
 *   when `value` is non-empty, so a handler must always be provided.
 * - `icon` is forbidden (`never`) — the search icon is injected internally
 *   and a second icon would be confusing.
 *
 * WHY a discriminated union instead of optional fields:
 * TypeScript's control-flow narrowing on the `variant` discriminant lets the
 * compiler enforce these constraints statically. A caller that writes
 * `<DSInput variant="search" />` without `onClear` gets a compile error,
 * not a silent runtime bug.
 */
type DSInputSearch = DSInputShared & {
  variant: "search";
  value: string;
  onClear: () => void;
  icon?: never;
};

type DSInputProps = DSInputDefault | DSInputSearch;

export function DSInput({
  variant = "default",
  label,
  helperText,
  error,
  icon,
  placeholder,
  value,
  onChange,
  onClear,
  className,
  type = "text",
  size = "md",
  ...rest
}: DSInputProps) {
  const isSearch = variant === "search";

  return (
    <HeroUIInput
      className={clsx(className)}
      classNames={variantClassNames[variant]}
      description={helperText}
      endContent={
        isSearch && value ? (
          <button
            aria-label="Clear search"
            className="p-1 hover:bg-default-200 transition-colors"
            onClick={onClear}
          >
            <X size={14} />
          </button>
        ) : undefined
      }
      errorMessage={error}
      isInvalid={!!error}
      label={label}
      placeholder={placeholder}
      radius="none"
      size={size}
      startContent={
        isSearch ? <Search className="text-default-400" size={16} /> : icon
      }
      type={type}
      value={value}
      onChange={onChange}
      {...rest}
    />
  );
}
