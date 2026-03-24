// components/analytics/CategoryBreakdown.tsx
"use client";

import type { CategoryStat } from "@/lib/types/analytics";

export function CategoryBreakdown({
  categories,
}: {
  categories: CategoryStat[];
}) {
  const maxCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <div className="bg-background border border-default-200 p-8">
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-default-200">
        <h3 className="text-[11px] font-display font-light tracking-normal text-foreground-600 mb-1">
          Category Analysis
        </h3>
        <p className="text-xs text-default-500 font-light italic">
          Distribution across your collection
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {categories.slice(0, 8).map((cat, index) => (
          <div key={cat.name} className="group">
            {/* Category Header */}
            <div className="flex justify-between items-baseline mb-3">
              <div className="flex items-baseline gap-3">
                <span className="text-[10px] font-bold text-default-500 w-6">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-base font-display font-light tracking-normal text-foreground">
                  {cat.name}
                </span>
              </div>

              <div className="flex items-baseline gap-4">
                <span className="text-xs text-default-500 font-light">
                  {cat.count} {cat.count === 1 ? "piece" : "pieces"}
                </span>
                <span className="text-sm font-bold text-foreground">
                  ${cat.value.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-default-200 overflow-hidden mb-2">
              <div
                className="h-full bg-foreground transition-all duration-700 ease-out"
                style={{ width: `${(cat.count / maxCount) * 100}%` }}
              />
            </div>

            {/* Metadata */}
            <div className="flex justify-between text-[9px] text-default-500 uppercase tracking-normal">
              <span>Avg ${cat.avgPrice.toFixed(0)}</span>
              <span>{cat.wears} total wears</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
