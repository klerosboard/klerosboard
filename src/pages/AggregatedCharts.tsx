import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import CHART from '../assets/icons/chart_violet.png';
import Header from '../components/Header';

import { Grid, Skeleton, Typography } from '@mui/material';
import { useDisputes } from '../hooks/useDisputes';
import { formatAmount, formatDate, formatPNK, getPercentageStaked } from '../lib/helpers';
import { useMemo } from 'react';
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
  border: '1px solid #E5E5E5',
  boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.06)',
  borderRadius: '3px',
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

function combineDataTimeCounter({
  data_eth,
  data_gno,
  data_arb,
}: {
  data_eth: TimestampCounter;
  data_gno: TimestampCounter;
  data_arb: TimestampCounter;
}): CombinedRechartsData[] {
  const allTimestamps = new Set([...Object.keys(data_eth), ...Object.keys(data_gno), ...Object.keys(data_arb)]);
  const combinedData = Array.from(allTimestamps).map((timestamp) => ({
    label: formatMonthLabel(timestamp),
    timestamp: parseInt(timestamp) / 1000, // time data from kleros_stats is in ms
    data_eth: data_eth[timestamp] || 0,
    data_gno: data_gno[timestamp] || 0,
    data_arb: data_arb[timestamp] || 0,
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
  commonKeys.forEach((key) => {
    if (key === 'id') {
      aggregatedKC[key] = data_eth[key];
    } else {
      aggregatedKC[key] = (
        BigInt(String(data_eth[key])) +
        BigInt(String(data_gno[key])) +
        BigInt(String(data_arb[key]))
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

export default function AggregatedCharts() {
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
  const { data: txsCount_eth } = useAllTransactionsCount('1');
  const { data: txsCount_gno } = useAllTransactionsCount('100');
  const { data: txsCount_arb } = useAllTransactionsCount('42161');
  const { totalSupply } = usePNKBalance([]);

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
                  ? `${formatAmount(kc_eth.totalETHFees, '1')}ETH + ${formatAmount(kc_gno.totalETHFees, '100')}DAI + ${formatAmount(kc_arb.totalETHFees, '42161')}ETH`
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
            <Legend />
            <Tooltip labelFormatter={(label) => label} />
            <Bar dataKey="data_eth" fill="#9013FE" stackId="stack" name="Ethereum" />
            <Bar dataKey="data_gno" fill="#009AFF" stackId="stack" name="Gnosis" />
            <Bar dataKey="data_arb" fill="#12AAFF" stackId="stack" name="Arbitrum" />
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
            <Legend />
            <Tooltip labelFormatter={(label) => label} />
            <Bar dataKey="data_eth" fill="#9013FE" stackId="stack" name="Ethereum" />
            <Bar dataKey="data_gno" fill="#009AFF" stackId="stack" name="Gnosis" />
            <Bar dataKey="data_arb" fill="#12AAFF" stackId="stack" name="Arbitrum" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}

      <Typography sx={{ marginBottom: '20px' }} variant="h1">
        PNK Staked
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
              domain={[0, 0.6]}
            />
            <Legend />
            <Tooltip labelFormatter={(label) => label} formatter={(value: number) => `${(value * 100).toFixed(2)}%`} />
            <Bar dataKey="data_eth" fill="#9013FE" stackId="stack" name="Ethereum" />
            <Bar dataKey="data_gno" fill="#009AFF" stackId="stack" name="Gnosis" />
            <Bar dataKey="data_arb" fill="#12AAFF" stackId="stack" name="Arbitrum" />
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
            <Legend />
            <Tooltip labelFormatter={(label) => label} formatter={(value: number) => `$${value.toFixed(2)}`} />
            <Bar dataKey="data_eth" fill="#9013FE" stackId="stack" name="Ethereum" />
            <Bar dataKey="data_gno" fill="#009AFF" stackId="stack" name="Gnosis" />
            <Bar dataKey="data_arb" fill="#12AAFF" stackId="stack" name="Arbitrum" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}

      <Typography sx={{ marginBottom: '0px' }} variant="h1">
        Monthly fees paid to Jurors
      </Typography>
      <Typography sx={{ marginBottom: '20px', color: 'gray' }} variant="body2">
        Considering ETH/USD price at payment date
      </Typography>
      {feesPaid_eth && feesPaid_gno && feesPaid_arb ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="250px">
          <BarChart
            data={combineDataTimeCounter({
              data_eth: feesPaid_eth['ETHAmount_usd'],
              data_gno: feesPaid_gno['ETHAmount_usd'],
              data_arb: feesPaid_arb['ETHAmount_usd'],
            })}
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
              label={{ value: '$', angle: -90, position: 'insideLeft' }}
            />
            <Legend />
            <Tooltip labelFormatter={(label) => label} formatter={(value: number) => `$${value.toFixed(2)}`} />
            <Bar dataKey="data_eth" fill="#9013FE" stackId="stack" name="Ethereum" />
            <Bar dataKey="data_gno" fill="#009AFF" stackId="stack" name="Gnosis" />
            <Bar dataKey="data_arb" fill="#12AAFF" stackId="stack" name="Arbitrum" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}

      <Typography sx={{ marginBottom: '0px' }} variant="h1">
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
            <Legend />
            <Tooltip labelFormatter={(label) => label} />
            <Bar dataKey="data_eth" fill="#9013FE" stackId="stack" name="Ethereum" />
            <Bar dataKey="data_gno" fill="#009AFF" stackId="stack" name="Gnosis" />
            <Bar dataKey="data_arb" fill="#12AAFF" stackId="stack" name="Arbitrum" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}
    </div>
  );
}
