import {
  Bar,
  BarChart,
  CartesianGrid,
  Customized,
  Legend,
  LegendProps,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import CHART from '../assets/icons/chart_violet.png';
import CategoryStackedTooltip from '../components/CategoryStackedTooltip';
import Header from '../components/Header';

interface AxisScale {
  scale: (v: unknown) => number;
  bandSize?: number;
  y?: number;
}

/** SVG labels rendered at x=visibleTotal, centered on each bar row. Respects chain toggles. */
function TotalLabels({
  data,
  format,
  hidden,
  xAxisMap,
  yAxisMap,
}: {
  data: Array<{ category: string; data_eth: number; data_gno: number; data_arb: number; total: number }>;
  format: (v: number) => string;
  hidden: { data_eth: boolean; data_gno: boolean; data_arb: boolean };
  xAxisMap?: Record<string, AxisScale>;
  yAxisMap?: Record<string, AxisScale>;
}) {
  const xScale = xAxisMap ? Object.values(xAxisMap)[0]?.scale : undefined;
  const yAxis = yAxisMap ? Object.values(yAxisMap)[0] : undefined;
  if (!xScale || !yAxis) return null;

  return (
    <g>
      {data.map((d) => {
        const visibleTotal =
          (hidden.data_eth ? 0 : d.data_eth) + (hidden.data_gno ? 0 : d.data_gno) + (hidden.data_arb ? 0 : d.data_arb);
        return (
          <text
            key={d.category}
            x={xScale(visibleTotal) + 6}
            y={(yAxis.y ?? 0) + (yAxis.scale(d.category) as number) + (yAxis.bandSize ?? 0) / 2}
            dominantBaseline="middle"
            fontSize={12}
          >
            {format(visibleTotal)}
          </text>
        );
      })}
    </g>
  );
}

import { Grid, Skeleton, Typography } from '@mui/material';
import { useDisputes } from '../hooks/useDisputes';
import { useArbitrablesNames } from '../hooks/useArbitrablesNames';
import { useFeesPaidByDispute } from '../hooks/useFeesPaidByDispute';
import { useDisputeCategoriesV2 } from '../hooks/v2/useDisputeCategoriesV2';
import { getDisputeCategoriesV1, aggregateByCategory, aggregateFeesByCategory } from '../lib/disputeCategories';
import { formatAmount, formatDate, formatPNK, getPercentageStaked } from '../lib/helpers';
import { cardStyle } from '../lib/theme';
import { useCallback, useMemo, useState } from 'react';
import BALANCE from '../assets/icons_stats/balance_orange.png';
import COMMUNITY from '../assets/icons_stats/community_green.png';
import ETHEREUM from '../assets/icons_stats/ethereum.png';
import KLEROS from '../assets/icons_stats/kleros.png';
import KLEROS_ORACLE from '../assets/icons_stats/kleros_oracle.png';
import StatCard from '../components/StatCard';
import { KlerosCounter } from '../graphql/subgraph';
import { useActiveJurors } from '../hooks/useActiveJurors';
import { useAllTransactionsCount } from '../hooks/useAllTransactionsCount';
import { useFeesPaid } from '../hooks/useFeesPaid';
import { Dispute } from '../graphql/subgraph';
import { useKlerosCounter } from '../hooks/useKlerosCounters';
import { usePNKBalance } from '../hooks/usePNKBalance';
import { usePNKStaked } from '../hooks/usePNKStaked';
import { TimestampCounter } from '../lib/types';

const row_css = {
  justifyContent: 'space-between',
  alignItems: 'center',
  ...cardStyle,
  margin: '10px 0px',
  paddingTop: '0px',
  width: '100%',
};

interface CombinedRechartsData {
  label: string;
  timestamp: number;
  data_eth: number;
  data_gno: number;
  data_arb: number;
}

function formatMonthLabel(msTimestamp: string): string {
  const d = new Date(Number(msTimestamp));
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Aggregates a TimestampCounter (keyed by ms timestamps) into monthly buckets.
 * Each bucket key is the UTC start-of-month timestamp in ms.
 * Values are summed within the month (for counts) or the last value is kept
 * (for gauges like active jurors). We use "last value wins" per month to
 * match the snapshot semantics of the v2 subgraph counters.
 */
function toMonthlyCounter(data: TimestampCounter): TimestampCounter {
  const monthly: TimestampCounter = {};
  for (const [tsMs, value] of Object.entries(data)) {
    const d = new Date(Number(tsMs));
    const monthStartMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
    const key = String(monthStartMs);
    // last value in the month wins (snapshot semantics)
    if (!(key in monthly) || Number(tsMs) > (monthly[`__last_${key}`] ?? 0)) {
      monthly[key] = value;
      monthly[`__last_${key}`] = Number(tsMs);
    }
  }
  // strip internal tracking keys
  for (const key of Object.keys(monthly)) {
    if (key.startsWith('__last_')) delete monthly[key];
  }
  return monthly;
}

function combineDataTimeCounter({
  data_eth,
  data_gno,
  data_arb,
}: {
  data_eth: TimestampCounter;
  data_gno: TimestampCounter;
  data_arb: TimestampCounter;
}): CombinedRechartsData[] {
  // Normalize all series to monthly buckets before combining
  const monthly_eth = toMonthlyCounter(data_eth);
  const monthly_gno = toMonthlyCounter(data_gno);
  const monthly_arb = toMonthlyCounter(data_arb);

  const allTimestamps = new Set([
    ...Object.keys(monthly_eth),
    ...Object.keys(monthly_gno),
    ...Object.keys(monthly_arb),
  ]);
  const combinedData = Array.from(allTimestamps).map((timestamp) => ({
    label: formatMonthLabel(timestamp),
    timestamp: parseInt(timestamp) / 1000, // ms → s for sorting
    data_eth: monthly_eth[timestamp] || 0,
    data_gno: monthly_gno[timestamp] || 0,
    data_arb: monthly_arb[timestamp] || 0,
  }));
  return combinedData.sort((a, b) => a.timestamp - b.timestamp);
}

function aggregateKlerosCounters({
  data_eth,
  data_gno,
  data_arb,
}: {
  data_eth: KlerosCounter;
  data_gno: KlerosCounter;
  data_arb: KlerosCounter;
}): KlerosCounter {
  const aggregatedKC: KlerosCounter = { ...data_eth }; // use eth data as base

  const commonKeys = Object.keys(data_eth).filter((key) => key !== '__typename') as (keyof KlerosCounter)[];
  const safeBigInt = (v: unknown): bigint => BigInt(v != null ? String(v) : '0');
  commonKeys.forEach((key) => {
    if (key === 'id') {
      aggregatedKC[key] = data_eth[key];
    } else {
      aggregatedKC[key] = (
        safeBigInt(data_eth[key]) +
        safeBigInt(data_gno[key]) +
        safeBigInt(data_arb[key])
      ).toString();
    }
  });
  return aggregatedKC;
}

function combineDisputesData(
  disputes_eth: Dispute[],
  disputes_gno: Dispute[],
  disputes_arb: Dispute[],
): CombinedRechartsData[] {
  const byMonth: Record<string, { ts: number; eth: number; gno: number; arb: number }> = {};

  function count(dd: Dispute[], key: 'eth' | 'gno' | 'arb') {
    dd.forEach((d) => {
      if (!d.startTime) return;
      const ms = Number(d.startTime) * 1000;
      const date = new Date(ms);
      const m = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
      if (!byMonth[m]) {
        byMonth[m] = { ts: Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1) / 1000, eth: 0, gno: 0, arb: 0 };
      }
      byMonth[m][key]++;
    });
  }

  count(disputes_eth, 'eth');
  count(disputes_gno, 'gno');
  count(disputes_arb, 'arb');

  const monthly = Object.entries(byMonth)
    .map(([, v]) => ({
      label: formatDate(v.ts, 'MMMM yyyy'),
      timestamp: v.ts,
      data_eth: v.eth,
      data_gno: v.gno,
      data_arb: v.arb,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Convert to cumulative (running total)
  let cumEth = 0;
  let cumGno = 0;
  let cumArb = 0;
  return monthly.map((d) => {
    cumEth += d.data_eth;
    cumGno += d.data_gno;
    cumArb += d.data_arb;
    return { ...d, data_eth: cumEth, data_gno: cumGno, data_arb: cumArb };
  });
}

function generateCumulativeFeesCombined(combinedData: CombinedRechartsData[]): CombinedRechartsData[] {
  combinedData.sort((a, b) => a.timestamp - b.timestamp);
  let cumulativeUSD_eth = 0;
  let cumulativeUSD_gno = 0;
  let cumulativeUSD_arb = 0;
  const cumulativeSeries: CombinedRechartsData[] = [];
  for (let i = 0; i < combinedData.length; i++) {
    cumulativeUSD_eth += combinedData[i].data_eth;
    cumulativeUSD_gno += combinedData[i].data_gno;
    cumulativeUSD_arb += combinedData[i].data_arb;
    cumulativeSeries[i] = {
      label: combinedData[i].label,
      timestamp: combinedData[i].timestamp,
      data_eth: cumulativeUSD_eth,
      data_gno: cumulativeUSD_gno,
      data_arb: cumulativeUSD_arb,
    };
  }
  return cumulativeSeries;
}

// ---- Chain toggle ----

interface ChainVisibility {
  data_eth: boolean;
  data_gno: boolean;
  data_arb: boolean;
}

function useChainToggle() {
  const [hidden, setHidden] = useState<ChainVisibility>({
    data_eth: false,
    data_gno: false,
    data_arb: false,
  });

  const handleLegendClick = useCallback((e: Parameters<NonNullable<LegendProps['onClick']>>[0]) => {
    const key = e.dataKey as keyof ChainVisibility;
    setHidden((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return { hidden, handleLegendClick };
}

export default function AggregatedCharts() {
  const { hidden, handleLegendClick } = useChainToggle();

  const { data: kc_eth } = useKlerosCounter({ chainId: '1' });
  const { data: kc_gno } = useKlerosCounter({ chainId: '100' });
  const { data: kc_arb } = useKlerosCounter({ chainId: '42161' });
  const { data: disputes_eth } = useDisputes({ chainId: '1' });
  const { data: disputes_gno } = useDisputes({ chainId: '100' });
  const { data: disputes_arb } = useDisputes({ chainId: '42161' });
  const { data: activeJurors_eth } = useActiveJurors('1');
  const { data: activeJurors_gno } = useActiveJurors('100');
  const { data: activeJurors_arb } = useActiveJurors('42161');
  const { data: pnkStaked_eth } = usePNKStaked('1');
  const { data: pnkStaked_gno } = usePNKStaked('100');
  const { data: pnkStaked_arb } = usePNKStaked('42161');
  const { data: feesPaid_eth } = useFeesPaid('1');
  const { data: feesPaid_gno } = useFeesPaid('100');
  const { data: feesPaid_arb } = useFeesPaid('42161');
  const { data: feesByDispute_eth } = useFeesPaidByDispute('1');
  const { data: feesByDispute_gno } = useFeesPaidByDispute('100');
  const { data: feesByDispute_arb } = useFeesPaidByDispute('42161');
  const { data: txsCount_eth } = useAllTransactionsCount('1');
  const { data: txsCount_gno } = useAllTransactionsCount('100');
  const { data: txsCount_arb } = useAllTransactionsCount('42161');
  const { data: arbitrableNames } = useArbitrablesNames();
  const { data: categoriesV2_arb } = useDisputeCategoriesV2('42161');
  const { totalSupply } = usePNKBalance([]);

  // Dispute categories per chain
  const categories_eth = useMemo(
    () => (disputes_eth && arbitrableNames ? getDisputeCategoriesV1(disputes_eth, '1', arbitrableNames) : undefined),
    [disputes_eth, arbitrableNames],
  );
  const categories_gno = useMemo(
    () => (disputes_gno && arbitrableNames ? getDisputeCategoriesV1(disputes_gno, '100', arbitrableNames) : undefined),
    [disputes_gno, arbitrableNames],
  );

  const dataByCategory = useMemo(() => {
    if (!categories_eth || !categories_gno || !categoriesV2_arb) return undefined;
    return aggregateByCategory([categories_eth, categories_gno, categoriesV2_arb], 10).map((d) => ({
      ...d,
      total: d.data_eth + d.data_gno + d.data_arb,
    }));
  }, [categories_eth, categories_gno, categoriesV2_arb]);

  const feesByCategory = useMemo(() => {
    if (
      !feesByDispute_eth ||
      !feesByDispute_gno ||
      !feesByDispute_arb ||
      !categories_eth ||
      !categories_gno ||
      !categoriesV2_arb
    )
      return undefined;
    return aggregateFeesByCategory(
      [feesByDispute_eth, feesByDispute_gno, feesByDispute_arb],
      [categories_eth, categories_gno, categoriesV2_arb],
      10,
    ).map((d) => ({ ...d, total: d.data_eth + d.data_gno + d.data_arb }));
  }, [feesByDispute_eth, feesByDispute_gno, feesByDispute_arb, categories_eth, categories_gno, categoriesV2_arb]);

  const CATEGORY_COLORS = [
    '#9013FE',
    '#009AFF',
    '#FF8042',
    '#FFBB28',
    '#00C49F',
    '#AA00FF',
    '#04795B',
    '#28A0F0',
    '#AAAAAA',
    '#778899',
    '#333333',
    '#FF4444',
  ];

  const feesByCategoryOverTime = useMemo(() => {
    if (
      !feesByDispute_eth ||
      !feesByDispute_gno ||
      !feesByDispute_arb ||
      !categories_eth ||
      !categories_gno ||
      !categoriesV2_arb
    )
      return undefined;

    const buckets: Map<string, Record<string, number>> = new Map();
    const totalsByCategory: Record<string, number> = {};

    const chains = [
      { fees: feesByDispute_eth, cats: categories_eth, hide: hidden.data_eth },
      { fees: feesByDispute_gno, cats: categories_gno, hide: hidden.data_gno },
      { fees: feesByDispute_arb, cats: categoriesV2_arb, hide: hidden.data_arb },
    ];

    for (const { fees, cats, hide } of chains) {
      if (hide) continue;
      for (const fee of fees) {
        if (fee.timestamp == null) continue;
        const d = new Date(fee.timestamp * 1000);
        const label = `${d.toLocaleString('en-US', { month: 'short' })} ${d.getUTCFullYear()}`;
        const category = cats.get(fee.disputeId) ?? 'Unknown';
        const bucket = buckets.get(label) ?? {};
        bucket[category] = (bucket[category] ?? 0) + fee.usdAmount;
        buckets.set(label, bucket);
        totalsByCategory[category] = (totalsByCategory[category] ?? 0) + fee.usdAmount;
      }
    }

    const sortedCategories = Object.keys(totalsByCategory).sort((a, b) => totalsByCategory[b] - totalsByCategory[a]);
    return {
      data: [...buckets.entries()]
        .map(([label, byCat]) => {
          const row: Record<string, number | string> = { label };
          for (const c of sortedCategories) row[c] = byCat[c] ?? 0;
          return row;
        })
        .sort((a, b) => Date.parse(String(a.label)) - Date.parse(String(b.label))),
      categories: sortedCategories,
    };
  }, [
    feesByDispute_eth,
    feesByDispute_gno,
    feesByDispute_arb,
    categories_eth,
    categories_gno,
    categoriesV2_arb,
    hidden,
  ]);

  const kc = useMemo(
    () =>
      kc_eth && kc_gno && kc_arb
        ? aggregateKlerosCounters({ data_eth: kc_eth, data_gno: kc_gno, data_arb: kc_arb })
        : undefined,
    [kc_eth, kc_gno, kc_arb],
  );

  return (
    <div>
      <Header logo={CHART} title="Charts" text="Aggregated KPIs for Kleros Court in all it's chains" />
      <Grid container sx={{ justifyContent: 'center', alignItems: 'start', width: '100%' }}>
        <Grid container columnSpacing={0} sx={row_css}>
          <Grid size={{ xs: 12, md: 4, lg: 2 }}>
            <StatCard
              title={'PNK Staked'}
              subtitle={`%${totalSupply && kc ? getPercentageStaked(kc, totalSupply) : '...'} Staked`}
              value={kc ? formatPNK(kc.tokenStaked) : undefined}
              image={KLEROS}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4, lg: 2 }}>
            <StatCard
              title={`Fees Paid`}
              subtitle={'All times'}
              value={
                kc_eth && kc_gno && kc_arb
                  ? (() => {
                      const ethRaw = (
                        BigInt(String(kc_eth.totalETHFees)) + BigInt(String(kc_arb.totalETHFees))
                      ).toString();
                      const ethFees = parseFloat(formatAmount(ethRaw, '1', false, false, 2));
                      const daiFees = parseFloat(formatAmount(kc_gno.totalETHFees, '100', false, false, 2));
                      const fmt = (n: number) =>
                        new Intl.NumberFormat('en-US', {
                          notation: 'compact',
                          compactDisplay: 'short',
                          maximumFractionDigits: 2,
                        }).format(n);
                      return `${fmt(ethFees)} ETH + ${fmt(daiFees)} DAI`;
                    })()
                  : undefined
              }
              image={ETHEREUM}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4, lg: 2 }}>
            <StatCard
              title={'PNK Redistributed'}
              subtitle={'All times'}
              value={kc ? formatPNK(kc.totalTokenRedistributed) : undefined}
              image={KLEROS_ORACLE}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4, lg: 2 }}>
            <StatCard title={'Active Jurors'} subtitle={'All times'} value={kc?.activeJurors} image={COMMUNITY} />
          </Grid>
          <Grid size={{ xs: 12, md: 4, lg: 2 }}>
            <StatCard title={'Cases'} subtitle={'All times'} value={kc?.disputesCount} image={BALANCE} />
          </Grid>
        </Grid>
      </Grid>

      <Typography sx={{ marginBottom: '20px' }} variant="h1">
        Cases Evolution
      </Typography>
      {disputes_eth && disputes_gno && disputes_arb ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="250px">
          <BarChart data={combineDisputesData(disputes_eth, disputes_gno, disputes_arb)}>
            <CartesianGrid vertical={false} strokeDasharray="4 8" />
            <XAxis dataKey="label" />
            <YAxis name="Cases" type="number" domain={[0, 'auto']} />
            <Legend onClick={handleLegendClick} style={{ cursor: 'pointer' }} />
            <Tooltip labelFormatter={(label) => label} />
            <Bar dataKey="data_eth" fill="#9013FE" stackId="stack" name="Ethereum" hide={hidden.data_eth} />
            <Bar dataKey="data_gno" fill="#04795B" stackId="stack" name="Gnosis" hide={hidden.data_gno} />
            <Bar dataKey="data_arb" fill="#28A0F0" stackId="stack" name="Arbitrum" hide={hidden.data_arb} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}

      <Typography sx={{ marginBottom: '20px' }} variant="h1">
        Active Jurors
      </Typography>
      {activeJurors_eth && activeJurors_gno && activeJurors_arb ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="250px">
          <BarChart
            data={combineDataTimeCounter({
              data_eth: activeJurors_eth,
              data_gno: activeJurors_gno,
              data_arb: activeJurors_arb,
            })}
          >
            <CartesianGrid vertical={false} strokeDasharray="4 8" />
            <XAxis dataKey="label" />
            <YAxis name="Active Jurors" type="number" domain={[0, 'auto']} />
            <Legend onClick={handleLegendClick} style={{ cursor: 'pointer' }} />
            <Tooltip labelFormatter={(label) => label} />
            <Bar dataKey="data_eth" fill="#9013FE" stackId="stack" name="Ethereum" hide={hidden.data_eth} />
            <Bar dataKey="data_gno" fill="#04795B" stackId="stack" name="Gnosis" hide={hidden.data_gno} />
            <Bar dataKey="data_arb" fill="#28A0F0" stackId="stack" name="Arbitrum" hide={hidden.data_arb} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}

      <Typography sx={{ marginBottom: '20px' }} variant="h1">
        PNK Staked (% of Total Supply)
      </Typography>
      {pnkStaked_eth && pnkStaked_gno && pnkStaked_arb ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="250px">
          <BarChart
            data={combineDataTimeCounter({
              data_eth: pnkStaked_eth['percentage'],
              data_gno: pnkStaked_gno['percentage'],
              data_arb: pnkStaked_arb['percentage'],
            })}
          >
            <CartesianGrid vertical={false} strokeDasharray="4 8" />
            <XAxis dataKey="label" />
            <YAxis
              name="PNK Staked / Total Supply [%]"
              type="number"
              tickFormatter={(tick) => {
                return `${(tick * 100).toFixed(1)}%`;
              }}
              domain={[0, 'auto']}
            />
            <Legend onClick={handleLegendClick} style={{ cursor: 'pointer' }} />
            <Tooltip labelFormatter={(label) => label} formatter={(value: number) => `${(value * 100).toFixed(2)}%`} />
            <Bar dataKey="data_eth" fill="#9013FE" stackId="stack" name="Ethereum" hide={hidden.data_eth} />
            <Bar dataKey="data_gno" fill="#04795B" stackId="stack" name="Gnosis" hide={hidden.data_gno} />
            <Bar dataKey="data_arb" fill="#28A0F0" stackId="stack" name="Arbitrum" hide={hidden.data_arb} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}

      <Typography sx={{ marginBottom: '0px' }} variant="h1">
        Cumulative juror fees
      </Typography>
      <Typography sx={{ marginBottom: '20px', color: 'gray' }} variant="body2">
        Taking into account the ETH/USD exchange rate at the time of payment
      </Typography>
      {feesPaid_eth && feesPaid_gno && feesPaid_arb ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="250px">
          <BarChart
            data={generateCumulativeFeesCombined(
              combineDataTimeCounter({
                data_eth: feesPaid_eth['ETHAmount_usd'],
                data_gno: feesPaid_gno['ETHAmount_usd'],
                data_arb: feesPaid_arb['ETHAmount_usd'],
              }),
            )}
          >
            <CartesianGrid vertical={false} strokeDasharray="4 8" />
            <XAxis dataKey="label" />
            <YAxis
              name="Fees in USD $"
              type="number"
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
              domain={[0, 'auto']}
              label={{ value: '$', angle: -90, position: 'insideLeft', fill: '#9013FE' }}
            />
            <Legend onClick={handleLegendClick} style={{ cursor: 'pointer' }} />
            <Tooltip labelFormatter={(label) => label} formatter={(value: number) => `$${value.toFixed(2)}`} />
            <Bar dataKey="data_eth" fill="#9013FE" stackId="stack" name="Ethereum" hide={hidden.data_eth} />
            <Bar dataKey="data_gno" fill="#04795B" stackId="stack" name="Gnosis" hide={hidden.data_gno} />
            <Bar dataKey="data_arb" fill="#28A0F0" stackId="stack" name="Arbitrum" hide={hidden.data_arb} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}

      <Typography sx={{ marginBottom: '20px' }} variant="h1">
        Cases by Category
      </Typography>
      {dataByCategory ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="320px">
          <BarChart data={dataByCategory} layout="vertical" margin={{ left: 24, right: 60 }}>
            <CartesianGrid horizontal={false} strokeDasharray="4 8" />
            <XAxis type="number" domain={[0, 'auto']} />
            <YAxis dataKey="category" type="category" width={150} tick={{ fontSize: 12 }} />
            <Legend onClick={handleLegendClick} style={{ cursor: 'pointer' }} />
            <Tooltip labelFormatter={(label) => label} />
            <Bar dataKey="data_eth" stackId="category" fill="#9013FE" name="Ethereum" hide={hidden.data_eth} />
            <Bar dataKey="data_gno" stackId="category" fill="#04795B" name="Gnosis" hide={hidden.data_gno} />
            <Bar dataKey="data_arb" stackId="category" fill="#28A0F0" name="Arbitrum" hide={hidden.data_arb} />
            <Customized
              component={(props: unknown) => (
                <TotalLabels data={dataByCategory} format={(v) => String(v)} hidden={hidden} {...(props as object)} />
              )}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="320px" width="100%" />
      )}

      <Typography sx={{ marginBottom: '20px' }} variant="h1">
        Fees by Category
      </Typography>
      <Typography sx={{ marginBottom: '20px', color: 'gray' }} variant="body2">
        Juror fees grouped by arbitrable category across all chains (USD equivalent at payment time)
      </Typography>
      {feesByCategory ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="320px">
          <BarChart data={feesByCategory} layout="vertical" margin={{ left: 24, right: 100 }}>
            <CartesianGrid horizontal={false} strokeDasharray="4 8" />
            <XAxis
              type="number"
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  style: 'currency',
                  currency: 'USD',
                }).format(value)
              }
              domain={[0, 'auto']}
            />
            <YAxis dataKey="category" type="category" width={150} tick={{ fontSize: 12 }} />
            <Legend onClick={handleLegendClick} style={{ cursor: 'pointer' }} />
            <Tooltip
              labelFormatter={(label) => label}
              formatter={(value: number) =>
                new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  style: 'currency',
                  currency: 'USD',
                }).format(value)
              }
            />
            <Bar dataKey="data_eth" stackId="category" fill="#9013FE" name="Ethereum" hide={hidden.data_eth} />
            <Bar dataKey="data_gno" stackId="category" fill="#04795B" name="Gnosis" hide={hidden.data_gno} />
            <Bar dataKey="data_arb" stackId="category" fill="#28A0F0" name="Arbitrum" hide={hidden.data_arb} />
            <Customized
              component={(props: unknown) => (
                <TotalLabels
                  data={feesByCategory}
                  format={(v) =>
                    new Intl.NumberFormat('en-US', {
                      notation: 'compact',
                      compactDisplay: 'short',
                      style: 'currency',
                      currency: 'USD',
                    }).format(v)
                  }
                  hidden={hidden}
                  {...(props as object)}
                />
              )}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="320px" width="100%" />
      )}
      <Typography sx={{ marginTop: '20px', marginBottom: '0px' }} variant="h1">
        Fees by Category over Time
      </Typography>
      <Typography sx={{ marginBottom: '20px', color: 'gray' }} variant="body2">
        Juror fees stacked by arbitrable category, monthly buckets (USD at payment time)
      </Typography>
      {feesByCategoryOverTime ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="420px">
          <BarChart data={feesByCategoryOverTime.data} margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 8" />
            <XAxis dataKey="label" interval="preserveStartEnd" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(value: number) =>
                new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  style: 'currency',
                  currency: 'USD',
                }).format(value)
              }
              domain={[0, 'auto']}
            />
            <Legend wrapperStyle={{ fontSize: 12, maxHeight: 80, overflowY: 'auto' }} />
            <Tooltip content={<CategoryStackedTooltip />} cursor={{ fill: 'transparent' }} />
            {feesByCategoryOverTime.categories.map((category, index) => (
              <Bar
                key={category}
                dataKey={category}
                stackId="fees"
                fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="420px" width="100%" />
      )}

      <Typography sx={{ marginTop: '20px', marginBottom: '0px' }} variant="h1">
        Court Transactions
      </Typography>
      <Typography sx={{ marginBottom: '20px', color: 'gray' }} variant="body2">
        Number of the most significant transactions per month.
      </Typography>
      {txsCount_eth && txsCount_gno && txsCount_arb ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="250px">
          <BarChart
            data={combineDataTimeCounter({
              data_eth: txsCount_eth,
              data_gno: txsCount_gno,
              data_arb: txsCount_arb,
            })}
          >
            <CartesianGrid vertical={false} strokeDasharray="4 8" />
            <XAxis dataKey="label" />
            <YAxis
              name="Transactions Count"
              type="number"
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
              domain={[0, 'auto']}
            />
            <Legend onClick={handleLegendClick} style={{ cursor: 'pointer' }} />
            <Tooltip labelFormatter={(label) => label} />
            <Bar dataKey="data_eth" fill="#9013FE" stackId="stack" name="Ethereum" hide={hidden.data_eth} />
            <Bar dataKey="data_gno" fill="#04795B" stackId="stack" name="Gnosis" hide={hidden.data_gno} />
            <Bar dataKey="data_arb" fill="#28A0F0" stackId="stack" name="Arbitrum" hide={hidden.data_arb} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}
    </div>
  );
}
