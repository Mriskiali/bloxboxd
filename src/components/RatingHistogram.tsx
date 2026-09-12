import React from 'react';
import { ThumbsUp } from 'lucide-react';

interface RatingHistogramProps {
  histogram: { [stars: string]: number };
  totalCount: number;
  averageRating: number;
  upVotes?: number;
  downVotes?: number;
}

function formatCompact(num?: number): string {
  if (!num) return '0';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export const RatingHistogram: React.FC<RatingHistogramProps> = ({
  histogram,
  totalCount,
  averageRating,
  upVotes,
  downVotes
}) => {
  const steps = ['0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0'];

  const maxVal = Math.max(...steps.map(s => histogram[s] || 0), 1);
  const totalVotes = (upVotes || 0) + (downVotes || 0);
  const approvalPct = totalVotes > 0 ? Math.round(((upVotes || 0) / totalVotes) * 100) : null;

  return (
    <div className="bg-[#181e24] border border-[#26303b] rounded-xl p-4.5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-sm font-medium text-[#00E59B]">★ out of 5</span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-gray-300">
              {formatCompact(totalCount)} ratings
            </span>
            <span className="text-[10px] text-gray-500">
              ({totalCount.toLocaleString()} total)
            </span>
          </div>
        </div>

        {approvalPct !== null && (
          <div className="flex items-center justify-between mb-3 text-[11px] text-gray-400 bg-[#12161b] px-2.5 py-1.5 rounded-lg border border-[#222b35]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{approvalPct}% Positive Approval</span>
            </div>
            <div className="text-gray-400 font-mono text-[10px]">
              {formatCompact(upVotes)} 👍 / {formatCompact(downVotes)} 👎
            </div>
          </div>
        )}
      </div>

      {/* 10-bar histogram */}
      <div>
        <div className="h-14 flex items-end gap-1.5 pt-2 pb-1 border-b border-[#26303b]">
          {steps.map((star) => {
            const count = histogram[star] || 0;
            const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
            const heightPct = Math.max(8, (count / maxVal) * 100);

            return (
              <div
                key={star}
                className="group relative flex-1 h-full flex flex-col justify-end items-center"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-9 z-20 hidden group-hover:flex flex-col items-center pointer-events-none">
                  <div className="bg-[#0f1216] border border-[#2b3642] px-2 py-1 rounded text-[10px] font-semibold text-white whitespace-nowrap shadow-lg">
                    {star}★: {count.toLocaleString()} ({pct.toFixed(1)}%)
                  </div>
                  <div className="w-1.5 h-1.5 bg-[#0f1216] rotate-45 border-r border-b border-[#2b3642] -mt-0.5" />
                </div>

                {/* Bar element */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full bg-[#2c3744] group-hover:bg-[#00E59B] rounded-t-xs transition-all duration-200 cursor-pointer shadow-sm"
                />
              </div>
            );
          })}
        </div>

        {/* Axis labels */}
        <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono pt-1.5">
          <span>½★</span>
          <span>2½★</span>
          <span>5★</span>
        </div>
      </div>
    </div>
  );
};
