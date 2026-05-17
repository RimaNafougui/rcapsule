// components/analytics/StatsCard.tsx
"use client";

import { Card, CardBody } from "@heroui/react";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

interface StatsCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: string;
  trendPositive?: boolean;
  accent?: "beige" | "pine" | "earth" | "charcoal";
}

export function StatsCard({
  label,
  value,
  subtext,
  trend,
  trendPositive,
  accent = "charcoal",
}: StatsCardProps) {
  const accentColors = {
    beige: "border-l-[#e1dbc9]",
    pine: "border-l-[#2d4530]",
    earth: "border-l-[#5e4b3b]",
    charcoal: "border-l-[#3c3c3c]",
  };

  return (
    <Card
      className={`bg-white dark:bg-black border border-[#E5E5E5] dark:border-[#262626] border-l-4 ${accentColors[accent]} transition-all duration-300`}
      radius="none"
    >
      <CardBody className="p-6">
        {/* Label */}
        <p className="eyebrow text-stone mb-3">{label}</p>

        {/* Value */}
        <p className="text-4xl font-display font-light tracking-tight mb-2 text-[#171717] dark:text-[#EDEDED]">
          <span className="num">{value}</span>
        </p>

        {/* Subtext */}
        {subtext && <p className="eyebrow text-stone mb-3">{subtext}</p>}

        {/* Trend */}
        {trend && (
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${
              trendPositive ? "text-[#2d4530]" : "text-[#5e4b3b]"
            }`}
          >
            {trendPositive ? (
              <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
            ) : (
              <ArrowTrendingDownIcon className="w-3.5 h-3.5" />
            )}
            <span className="text-[10px] tracking-normal">{trend}</span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
