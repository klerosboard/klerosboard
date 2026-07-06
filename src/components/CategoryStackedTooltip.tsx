import { Box, Paper, Typography } from '@mui/material';
import { TooltipProps } from 'recharts';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

interface TooltipItem {
  name: string;
  value: number;
  color: string;
}

export default function CategoryStackedTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  const items: TooltipItem[] = payload
    .map((p) => ({
      name: (p.name as string) || (p.dataKey as string),
      value: Number(p.value) || 0,
      color: (p.color as string) || '#ccc',
    }))
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value);

  if (items.length === 0) return null;

  const total = items.reduce((sum, item) => sum + item.value, 0);
  const maxItems = 10;
  const shown = items.slice(0, maxItems);
  const hiddenCount = items.length - maxItems;

  return (
    <Paper sx={{ p: 1, maxHeight: 320, overflowY: 'auto', maxWidth: 280 }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Month: {label}
      </Typography>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {shown.map((item, index) => (
          <Box component="li" key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25 }}>
            <Box sx={{ width: 10, height: 10, bgcolor: item.color, borderRadius: '2px', flexShrink: 0 }} />
            <Typography variant="body2" sx={{ flexGrow: 1, minWidth: 0 }} noWrap>
              {item.name}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatCurrency(item.value)}
            </Typography>
          </Box>
        ))}
      </Box>
      {hiddenCount > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          and {hiddenCount} more categories
        </Typography>
      )}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 0.5,
          pt: 0.5,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Total
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatCurrency(total)}
        </Typography>
      </Box>
    </Paper>
  );
}
