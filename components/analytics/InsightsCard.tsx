// components/analytics/InsightsCard.tsx
"use client";

import type { ComponentType } from "react";
import type { Insight } from "@/lib/types/analytics";

import {
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface InsightStyle {
  border: string;
  bg: string;
  icon: string;
  IconComponent: ComponentType<{ className?: string }>;
}

const INSIGHT_STYLES: Record<string, InsightStyle> = {
  positive: {
    border: "border-success-400",
    bg: "bg-success/5",
    icon: "text-success-600",
    IconComponent: CheckCircleIcon,
  },
  warning: {
    border: "border-warning-400",
    bg: "bg-warning/5",
    icon: "text-warning-600",
    IconComponent: ExclamationTriangleIcon,
  },
  tip: {
    border: "border-default-300",
    bg: "bg-default-50",
    icon: "text-default-500",
    IconComponent: LightBulbIcon,
  },
};

const DEFAULT_STYLE = INSIGHT_STYLES.tip;

export function InsightsCard({ insights }: { insights: Insight[] }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-default-200 dark:border-default-700 pb-4">
        <h3 className="text-[11px] font-display font-light tracking-normal text-foreground-600">
          Wardrobe Intelligence
        </h3>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const styles = INSIGHT_STYLES[insight.type] ?? DEFAULT_STYLE;
          const Icon = styles.IconComponent;

          return (
            <div
              key={index}
              className={`${styles.bg} border-l-4 ${styles.border} p-5 group hover:shadow-md transition-all duration-300`}
            >
              <div className="flex items-start gap-4">
                <Icon
                  className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`}
                />
                <div className="flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-default-500 mb-2">
                    {insight.category}
                  </p>
                  <p className="text-sm leading-relaxed text-foreground font-light">
                    {insight.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
