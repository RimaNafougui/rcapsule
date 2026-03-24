import { type ReactNode } from "react";
import clsx from "clsx";

interface SectionHeaderProps {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  alignment?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  alignment = "left",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={clsx(
        "flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12 border-b border-divider pb-6",
        alignment === "center" && "text-center items-center md:items-center",
        className,
      )}
    >
      <div>
        <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-display font-light tracking-normal">
          {title}
        </h1>
        {subtitle && (
          <div className="text-[clamp(0.625rem,0.8vw,0.75rem)] uppercase tracking-widest text-default-500 mt-2">
            {subtitle}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
