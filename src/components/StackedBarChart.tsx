import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";

// Well-known slot names get a pinned color; dynamic option labels get colors by encounter order.
const FIXED_COLORS: Record<string, string> = {
  Pending: "#AAAAAA",
  Committed: "#778899",
  "Refuse to Arbitrate": "#333333",
  Others: "#FFBB28",
};

const OPTION_COLORS = ["#4D00B4", "#009AFF", "#9013FE", "#FF8042"];

const FIXED_SLOT_NAMES = new Set(Object.keys(FIXED_COLORS));

export function resolveSlotColor(key: string, optionIndex: number): string {
  if (key in FIXED_COLORS) return FIXED_COLORS[key];
  return OPTION_COLORS[optionIndex % OPTION_COLORS.length];
}

const StackedBarChart: React.FC<{ data: [string, number][] }> = ({ data }) => {
  const total = data.reduce((acc, [, n]) => acc + n, 0) || 1;

  let optionIndex = 0;
  const segments = data.map(([key, count]) => {
    const isFixed = FIXED_SLOT_NAMES.has(key);
    const color = resolveSlotColor(key, optionIndex);
    if (!isFixed) optionIndex++;
    return { key, count, pct: count / total, color };
  });

  return (
    <Box sx={{ width: "100%", mt: 1 }}>
      {/* Stacked bar — only render segments with actual votes */}
      <Box sx={{ display: "flex", width: "100%", height: 24, borderRadius: 1, overflow: "hidden" }}>
        {segments.filter(({ count }) => count > 0).map(({ key, count, pct, color }) => (
          <Tooltip key={key} title={`${key}: ${count} (${(pct * 100).toFixed(1)}%)`} arrow>
            <Box
              sx={{
                width: `${pct * 100}%`,
                height: "100%",
                backgroundColor: color,
                cursor: "default",
                transition: "opacity 0.15s",
                "&:hover": { opacity: 0.8 },
              }}
            />
          </Tooltip>
        ))}
      </Box>

      {/* Legend — always show all slots */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 0.75 }}>
        {segments.map(({ key, pct, color }) => (
          <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "2px", backgroundColor: color, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: pct === 0 ? "text.disabled" : "text.secondary" }}>
              {key} {(pct * 100).toFixed(1)}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default StackedBarChart;
