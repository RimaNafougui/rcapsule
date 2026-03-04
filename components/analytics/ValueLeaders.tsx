// components/analytics/ValueLeaders.tsx
"use client";

export function ValueLeaders({ bestValue, worstValue }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Best Value - Editorial Style */}
      <div className="bg-[#2d4530]/5 border-l-4 border-[#2d4530] p-6">
        <div className="mb-6">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2d4530] mb-1">
            Investment Pieces
          </h3>
          <p className="text-xs text-[#6b7884] italic">
            Best cost-per-wear ratio
          </p>
        </div>

        <div className="space-y-4">
          {bestValue.slice(0, 5).map((item: any, index: number) => (
            <div
              key={item.id}
              className="flex justify-between items-start pb-4 border-b border-[#2d4530]/20 last:border-0"
            >
              <div className="flex items-start gap-3">
                <span className="text-[10px] font-bold text-[#6b7884] w-5 pt-0.5">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-medium text-[#171717] dark:text-[#EDEDED] mb-0.5">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-[#6b7884] uppercase tracking-wider">
                    {item.timesworn} wears
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-[#2d4530] italic">
                ${item.costPerWear.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Needs Attention */}
      <div className="bg-[#5e4b3b]/5 border-l-4 border-[#5e4b3b] p-6">
        <div className="mb-6">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#5e4b3b] mb-1">
            Wardrobe Edit
          </h3>
          <p className="text-xs text-[#6b7884] italic">
            Items deserving more attention
          </p>
        </div>

        <div className="space-y-4">
          {worstValue.slice(0, 5).map((item: any, _index: number) => (
            <div
              key={item.id}
              className="flex justify-between items-start pb-4 border-b border-[#5e4b3b]/20 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-[#171717] dark:text-[#EDEDED] mb-0.5">
                  {item.name}
                </p>
                <p className="text-[10px] text-[#6b7884] uppercase tracking-wider">
                  {item.timesworn} {item.timesworn === 1 ? "wear" : "wears"}
                </p>
              </div>
              <p className="text-sm font-bold text-[#5e4b3b] italic">
                ${item.costPerWear.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
