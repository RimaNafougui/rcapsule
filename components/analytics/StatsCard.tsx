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
      className={`bg-white dark:bg-black border border-[#E5E5E5] dark:border-[#262626] border-l-4 ${accentColors[accent]} hover:shadow-lg transition-all duration-300`}
      radius="none"
    >
      <CardBody className="p-6">
        {/* Label */}
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#6b7884] mb-3 letter-spacing-widest">
          {label}
        </p>

        {/* Value */}
        <p className="text-4xl font-display font-light tracking-normal mb-2 text-[#171717] dark:text-[#EDEDED] italic">
          {value}
        </p>

        {/* Subtext */}
        {subtext && (
          <p className="text-xs text-[#6b7884] mb-3 font-light">{subtext}</p>
        )}

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
