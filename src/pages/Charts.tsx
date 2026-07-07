import React, { useMemo, useState } from 'react';
import Header from '../components/Header';
import CategoryStackedTooltip from '../components/CategoryStackedTooltip';
import CHART from '../assets/icons/chart_violet.png';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  BarChart,
  LabelList,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

import { useDisputes } from '../hooks/useDisputes';
import { useChainId } from '../hooks/useChainId';
import { Alert, Link, Skeleton, Typography } from '@mui/material';
import { formatDate } from '../lib/helpers';

import { Dispute } from '../graphql/subgraph';
import { useArbitrablesNames } from '../hooks/useArbitrablesNames';
import { useCourtNames } from '../hooks/useCourtNames';
import { useDisputeCategoriesV2 } from '../hooks/v2/useDisputeCategoriesV2';
import { useFeesPaidByDispute } from '../hooks/useFeesPaidByDispute';
import { getDisputeCategoriesV1, clusterByCategory, UNKNOWN_CATEGORY } from '../lib/disputeCategories';
import { useActiveJurors } from '../hooks/useActiveJurors';
import { FeesPaid, TimestampCounter } from '../lib/types';
import { usePNKStaked } from '../hooks/usePNKStaked';
import { useFeesPaid } from '../hooks/useFeesPaid';
import { useAllTransactionsCount } from '../hooks/useAllTransactionsCount';
import AllJurorsPieChart from '../components/AllJurorsPieChart';

interface RechartsData {
  timestamp: number;
  label: string;
  counter: number;
}

/**
 * Normalize a TimestampCounter (keyed by ms timestamps) to monthly buckets.
 * Last value in the month wins (snapshot semantics for gauges like active jurors).
 */
function toMonthlyCounter(data: TimestampCounter): TimestampCounter {
  const monthly: Record<string, { value: number; lastTs: number }> = {};
  for (const [tsMs, value] of Object.entries(data)) {
    const d = new Date(Number(tsMs));
    const key = String(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    if (!monthly[key] || Number(tsMs) > monthly[key].lastTs) {
      monthly[key] = { value, lastTs: Number(tsMs) };
    }
  }
  const result: TimestampCounter = {};
  for (const [key, { value }] of Object.entries(monthly)) {
    result[key] = value;
  }
  return result;
}

function timeCounterToRecharts(data: TimestampCounter): RechartsData[] {
  const monthly = toMonthlyCounter(data);
  return Object.keys(monthly)
    .map((timestamp) => ({
      timestamp: parseInt(timestamp) / 1000, // ms → s
      label: formatDate(parseInt(timestamp) / 1000, 'MMM yyyy'),
      counter: monthly[timestamp],
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

function generateCumulativeFees(
  data: FeesPaid,
): { label: string; timestamp: number; ethCumulative: number; usdCumulative: number }[] {
  const ethArray = timeCounterToRecharts(data['ETHAmount']);
  const usdArray = timeCounterToRecharts(data['ETHAmount_usd']);
  ethArray.sort((a, b) => a.timestamp - b.timestamp);
  usdArray.sort((a, b) => a.timestamp - b.timestamp);
  let cumulativeETH = 0;
  let cumulativeUSD = 0;
  const cumulativeSeries: { label: string; timestamp: number; ethCumulative: number; usdCumulative: number }[] = [];
  for (let i = 0; i < ethArray.length; i++) {
    cumulativeETH += ethArray[i].counter;
    cumulativeUSD += usdArray[i].counter;
    cumulativeSeries[i] = {
      label: ethArray[i].label,
      timestamp: ethArray[i].timestamp,
      ethCumulative: cumulativeETH,
      usdCumulative: cumulativeUSD,
    };
  }
  return cumulativeSeries;
}

function clusterByKey(
  disputes: Dispute[],
  key: 'subcourtID' | 'arbitrable',
): { key: string; value: number; percentage: number }[] {
  // let keys = disputes.map((dispute) => dispute[key].id).filter((x, i, a) => a.indexOf(x) === i);
  const occurrences: { [key: string]: number } = {};
  disputes.forEach((dispute) => {
    occurrences[dispute[key].id] = (occurrences[dispute[key].id] || 0) + 1;
  });
  const totalDisputes = disputes.length;

  const formatedOcurrences: { key: string; value: number; percentage: number }[] = [];
  Object.keys(occurrences).forEach((key: string) =>
    formatedOcurrences.push({
      key: key,
      value: occurrences[key],
      percentage: totalDisputes ? occurrences[key] / totalDisputes : 0,
    }),
  );
  return formatedOcurrences.sort((a, b) => (a.value < b.value ? 1 : b.value < a.value ? -1 : 0));
}

export default function Charts() {
  const chainId = useChainId();
  const { data: disputes } = useDisputes({ chainId: chainId! });
  const { data: activeJurors } = useActiveJurors(chainId!);
  const { data: pnkStaked } = usePNKStaked(chainId!);
  const { data: feesPaid } = useFeesPaid(chainId!);
  const { data: feesByDispute } = useFeesPaidByDispute(chainId!);
  const { data: txsCount } = useAllTransactionsCount(chainId!);
  const { data: arbitrableNames } = useArbitrablesNames();
  const { data: categoriesV2 } = useDisputeCategoriesV2(chainId!);
  const [focusBarCourt, setFocusBarCourt] = useState<number | null>(null);
  const [focusBarArbitrable, setFocusBarArbitrable] = useState<number | null>(null);
  const [focusBarFeeCategory, setFocusBarFeeCategory] = useState<number | null>(null);

  const dataByCourts = useMemo(
    () => (disputes ? clusterByKey(disputes, 'subcourtID').slice(0, 10) : undefined),
    [disputes],
  );
  const courtNames = useCourtNames(chainId!, dataByCourts?.map((d) => d.key) ?? []);

  const disputeCategories = useMemo(() => {
    if (!disputes) return undefined;
    if (chainId === '42161') return categoriesV2;
    if (!arbitrableNames) return undefined;
    return getDisputeCategoriesV1(disputes, chainId!, arbitrableNames);
  }, [disputes, chainId, categoriesV2, arbitrableNames]);

  const dataByCategory = useMemo(
    () => (disputes && disputeCategories ? clusterByCategory(disputes, disputeCategories) : undefined),
    [disputes, disputeCategories],
  );

  const feeCurrency = chainId === '100' ? 'xDAI' : 'ETH';

  const feesByCategory = useMemo(() => {
    if (!feesByDispute || !disputeCategories) return undefined;
    const totals: Record<string, number> = {};
    for (const fee of feesByDispute) {
      const category = disputeCategories.get(fee.disputeId) ?? UNKNOWN_CATEGORY;
      totals[category] = (totals[category] ?? 0) + fee.ethAmount;
    }
    return Object.entries(totals)
      .map(([category, ethAmount]) => ({ category, ethAmount }))
      .sort((a, b) => b.ethAmount - a.ethAmount)
      .slice(0, 12);
  }, [feesByDispute, disputeCategories]);

  // Stacked-by-category, monthly buckets. Same fee/cateogry data spread over time.
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

  // Sorted categories newest -> from top so legend is stable. To handle dynamic keys sorted desc by totals:
  //   { label: 'Jan 2024', [category]: amt, ... }, categories sorted desc by monthly sum.
  //   Fees used: ethAmount — Gnosis fees are in xDAI on the same field (1 DAI = 1 USD).
  const feesByCategoryOverTime = useMemo(() => {
    if (!feesByDispute || !disputeCategories) return undefined;
    const buckets: Map<string, Record<string, number>> = new Map();
    const totalsByCategory: Record<string, number> = {};
    for (const fee of feesByDispute) {
      if (fee.timestamp == null) continue;
      const label = formatDate(fee.timestamp, 'MMM yyyy');
      const category = disputeCategories.get(fee.disputeId) ?? UNKNOWN_CATEGORY;
      const bucket = buckets.get(label) ?? {};
      bucket[category] = (bucket[category] ?? 0) + fee.usdAmount;
      buckets.set(label, bucket);
      totalsByCategory[category] = (totalsByCategory[category] ?? 0) + fee.usdAmount;
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
  }, [feesByDispute, disputeCategories]);

  // Sort by startTime ascending so the Cases Evolution line chart renders correctly.
  // Disputes from v2 come ordered by id asc (cursor pagination) which may not match
  // chronological order. Filter out disputes with no startTime before charting.
  const disputesSortedByTime = useMemo(
    () =>
      disputes
        ? [...disputes].filter((d) => d.startTime != null).sort((a, b) => Number(a.startTime) - Number(b.startTime))
        : undefined,
    [disputes],
  );
  return (
    <div>
      <Header logo={CHART} title="Charts" text="A series of charts illustrating Kleros data." />

      <Alert variant="outlined" severity="info" sx={{ marginBottom: '10px' }}>
        <Typography>
          If you want to check aggregated data from all chains, please go to{' '}
          <Link href="/aggregated-charts">Aggregated Charts</Link>
        </Typography>
      </Alert>
      <Typography sx={{ marginBottom: '20px' }} variant="h1">
        Cases Evolution
      </Typography>
      {disputesSortedByTime ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="250px">
          <LineChart data={disputesSortedByTime}>
            <defs>
              <linearGradient id="colorUv" x1="0%" y1="0" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9013FE" />
                <stop offset="100%" stopColor="#009AFF" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="4 8" />
            <XAxis
              dataKey="startTime"
              domain={['auto', 'auto']}
              name="Date"
              tickFormatter={(unixTime) => formatDate(unixTime, 'MMMM yyyy')}
              type="number"
              scale="time"
            />
            <YAxis
              dataKey="id"
              name="Dispute"
              type="number"
              domain={[0, Math.max(...disputesSortedByTime.map((d) => Number(d.id)))]}
            />
            <Line strokeLinecap="round" stroke="url(#colorUv)" strokeWidth={'3px'} dataKey="id" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}

      <Typography sx={{ marginBottom: '20px' }} variant="h1">
        Active Jurors
      </Typography>
      {activeJurors ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="250px">
          <LineChart data={timeCounterToRecharts(activeJurors)}>
            <defs>
              <linearGradient id="colorActiveJurors" x1="0%" y1="0" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9013FE" />
                <stop offset="100%" stopColor="#009AFF" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="4 8" />
            <XAxis dataKey="label" type="category" interval="preserveStartEnd" />
            <YAxis dataKey="counter" name="Active Jurors" type="number" domain={[0, 'auto']} />
            <Line
              dataKey="counter"
              strokeLinecap="round"
              stroke="url(#colorActiveJurors)"
              strokeWidth={'3px'}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}

      <Typography sx={{ marginBottom: '20px' }} variant="h1">
        PNK Staked (% of Total Supply)
      </Typography>
      {pnkStaked ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="250px">
          <LineChart data={timeCounterToRecharts(pnkStaked['percentage'])}>
            <defs>
              <linearGradient id="colorPNKStaked" x1="0%" y1="0" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9013FE" />
                <stop offset="100%" stopColor="#009AFF" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="4 8" />
            <XAxis dataKey="label" type="category" interval="preserveStartEnd" />
            <YAxis
              dataKey="counter"
              name="PNK Staked / Total Supply [%]"
              type="number"
              tickFormatter={(tick) => {
                return `${(tick * 100).toFixed(1)}%`;
              }}
              domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1 * 100) / 100]}
            />
            <Line
              dataKey="counter"
              strokeLinecap="round"
              stroke="url(#colorPNKStaked)"
              strokeWidth={'3px'}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}

      <AllJurorsPieChart chainId={chainId!}></AllJurorsPieChart>

      <Typography sx={{ marginBottom: '0px' }} variant="h1">
        Fees paid to Jurors
      </Typography>
      <Typography sx={{ marginBottom: '20px', color: 'gray' }} variant="body2">
        Considering ETH/USD price at payment date
      </Typography>
      {feesPaid ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="250px">
          <LineChart data={generateCumulativeFees(feesPaid)}>
            <CartesianGrid vertical={false} strokeDasharray="4 8" />
            <XAxis dataKey="label" type="category" interval="preserveStartEnd" />
            <YAxis
              dataKey="usdCumulative"
              name="Fees in USD $"
              type="number"
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
              domain={[0, 'auto']}
              label={{
                value: '$',
                angle: -90,
                position: 'insideLeft',
                fill: '#9013FE',
              }}
              yAxisId="left"
            />
            <YAxis
              dataKey="ethCumulative"
              name="Fees in ETH"
              type="number"
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
              domain={[0, 'auto']}
              label={{
                value: 'ETH',
                angle: -90,
                position: 'insideRight',
                fill: '#009AFF',
              }}
              yAxisId="right"
              orientation="right"
            />
            <Line
              dataKey="usdCumulative"
              strokeLinecap="round"
              stroke="#9013FE"
              strokeWidth={'3px'}
              dot={false}
              yAxisId={'left'}
            />
            <Line
              dataKey="ethCumulative"
              strokeLinecap="round"
              stroke="#009AFF"
              strokeWidth={'3px'}
              dot={false}
              yAxisId={'right'}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}
      <Typography sx={{ marginBottom: '20px' }} variant="h1">
        Cases by Court
      </Typography>
      {dataByCourts ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="420px">
          <BarChart
            data={dataByCourts}
            layout="vertical"
            margin={{ top: 5, right: 60, bottom: 5, left: 5 }}
            onMouseMove={(state) => {
              if (state.isTooltipActive) {
                setFocusBarCourt(state.activeTooltipIndex!);
              } else {
                setFocusBarCourt(null);
              }
            }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="4 8" />
            <XAxis type="number" tickFormatter={(value) => `${(value * 100).toFixed(0)} %`} domain={[0, 'auto']} />
            <YAxis
              dataKey="key"
              type="category"
              width={150}
              tick={{ fontSize: 12 }}
              tickFormatter={(id) => courtNames.get(id) ?? id}
            />
            <Bar dataKey="percentage" fill="#9013FE">
              <LabelList dataKey="value" position="right" style={{ fontSize: 12 }} />
              {dataByCourts.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={focusBarCourt === index ? '#009AFF' : '#9013FE'} />
              ))}
            </Bar>
            <Tooltip
              formatter={(value: number) => `${(value * 100).toFixed(2)} %`}
              labelFormatter={(id) => `Court: ${courtNames.get(String(id)) ?? id}`}
              cursor={{ fill: 'transparent' }}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="420px" width="100%" />
      )}

      <Typography sx={{ marginBottom: '20px' }} variant="h1">
        Cases by Category
      </Typography>
      {dataByCategory ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="420px">
          <BarChart
            data={dataByCategory.slice(0, 12)}
            layout="vertical"
            margin={{ top: 5, right: 60, bottom: 5, left: 5 }}
            onMouseMove={(state) => {
              if (state.isTooltipActive) {
                setFocusBarArbitrable(state.activeTooltipIndex!);
              } else {
                setFocusBarArbitrable(null);
              }
            }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="4 8" />
            <XAxis type="number" tickFormatter={(value) => `${(value * 100).toFixed(0)} %`} domain={[0, 'auto']} />
            <YAxis dataKey="key" type="category" width={150} tick={{ fontSize: 12 }} />
            <Bar dataKey="percentage" fill="#9013FE">
              <LabelList dataKey="value" position="right" style={{ fontSize: 12 }} />
              {dataByCategory.slice(0, 12).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={focusBarArbitrable === index ? '#009AFF' : '#9013FE'} />
              ))}
            </Bar>
            <Tooltip
              formatter={(value: number, _name, props) => [
                `${(value * 100).toFixed(2)} % (${props.payload?.value} cases)`,
                'Share',
              ]}
              labelFormatter={(value) => `Category: ${value}`}
              cursor={{ fill: 'transparent' }}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="420px" width="100%" />
      )}

      <Typography sx={{ marginBottom: '0px' }} variant="h1">
        Fees by Category
      </Typography>
      <Typography sx={{ marginBottom: '20px', color: 'gray' }} variant="body2">
        Juror fees grouped by arbitrable category ({feeCurrency})
      </Typography>
      {feesByCategory ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="420px">
          <BarChart
            data={feesByCategory}
            layout="vertical"
            margin={{ top: 5, right: 80, bottom: 5, left: 5 }}
            onMouseMove={(state) => {
              if (state.isTooltipActive) {
                setFocusBarFeeCategory(state.activeTooltipIndex!);
              } else {
                setFocusBarFeeCategory(null);
              }
            }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="4 8" />
            <XAxis
              type="number"
              tickFormatter={(value) =>
                `${new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)} ${feeCurrency}`
              }
              domain={[0, 'auto']}
            />
            <YAxis dataKey="category" type="category" width={150} tick={{ fontSize: 12 }} />
            <Bar dataKey="ethAmount" fill="#9013FE">
              <LabelList
                dataKey="ethAmount"
                position="right"
                style={{ fontSize: 12 }}
                formatter={(value: number) =>
                  `${new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 2 }).format(value)} ${feeCurrency}`
                }
              />
              {feesByCategory.map((entry, index) => (
                <Cell key={`cell-fee-${index}`} fill={focusBarFeeCategory === index ? '#009AFF' : '#9013FE'} />
              ))}
            </Bar>
            <Tooltip
              formatter={(value: number) =>
                `${new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  maximumFractionDigits: 4,
                }).format(value)} ${feeCurrency}`
              }
              labelFormatter={(value) => `Category: ${value}`}
              cursor={{ fill: 'transparent' }}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="420px" width="100%" />
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
        Court Transactions count
      </Typography>
      <Typography sx={{ marginBottom: '20px', color: 'gray' }} variant="body2">
        Count of most important transactions per month
      </Typography>
      {txsCount ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="250px">
          <BarChart data={timeCounterToRecharts(txsCount)}>
            <CartesianGrid vertical={false} strokeDasharray="4 8" />
            <XAxis dataKey="label" type="category" interval="preserveStartEnd" />
            <YAxis
              dataKey="counter"
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
            <Bar dataKey="counter" fill="#9013FE" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}
    </div>
  );
}
