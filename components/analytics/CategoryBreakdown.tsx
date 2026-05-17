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
        <h3 className="font-display font-light text-2xl md:text-3xl tracking-tight mb-1">
          Category Analysis
        </h3>
        <p className="eyebrow text-stone">
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
                <span className="eyebrow text-stone">
                  <span className="num">{cat.count}</span>{" "}
                  {cat.count === 1 ? "piece" : "pieces"}
                </span>
                <span className="num text-sm text-foreground">
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
            <div className="flex justify-between eyebrow text-stone">
              <span>
                Avg <span className="num">${cat.avgPrice.toFixed(0)}</span>
              </span>
              <span>
                <span className="num">{cat.wears}</span> total wears
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
