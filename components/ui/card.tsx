import { type ReactNode } from "react";
import clsx from "clsx";

const variantStyles = {
  default: "bg-background border border-default-200",
  elevated: "bg-background shadow-sm",
  bordered: "bg-background border border-default-200",
  feature: "bg-background border border-default-200 p-8 md:p-10",
  stat: "bg-foreground text-background p-8 md:p-10",
} as const;

interface DSCardProps {
  variant?: keyof typeof variantStyles;
  hoverable?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function DSCard({
  variant = "default",
  hoverable = false,
  className,
  children,
  onClick,
}: DSCardProps) {
  return (
    <div
      className={clsx(
        variantStyles[variant],
        hoverable &&
          "group cursor-pointer transition-all duration-300 hover:border-foreground hover:shadow-md",
        variant === "elevated" && hoverable && "hover:shadow-lg",
        className,
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

interface FeatureCardProps {
  icon?: ReactNode;
  title: string;
  description: string;
  className?: string;
  children?: ReactNode;
}

export function FeatureCard({
  icon,
  title,
  description,
  className,
  children,
}: FeatureCardProps) {
  return (
    <DSCard hoverable className={className} variant="feature">
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="font-bold uppercase tracking-widest text-sm mb-2">
        {title}
      </h3>
      <p className="text-sm text-default-500 leading-relaxed">{description}</p>
      {children}
    </DSCard>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  className?: string;
  children?: ReactNode;
}

export function StatCard({
  label,
  value,
  subtitle,
  className,
  children,
}: StatCardProps) {
  return (
    <DSCard className={className} variant="stat">
      <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">
        {label}
      </div>
      <div className="text-3xl md:text-4xl font-mono font-light tracking-tighter">
        {value}
      </div>
      {subtitle && <div className="text-xs opacity-40 mt-1">{subtitle}</div>}
      {children}
    </DSCard>
  );
}
