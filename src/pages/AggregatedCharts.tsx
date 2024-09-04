import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import CHART from '../assets/icons/chart_violet.png';
import Header from '../components/Header';

import { Grid, Skeleton, Typography } from '@mui/material';
import { useDisputes } from '../hooks/useDisputes';
import { formatAmount, formatDate, formatPNK } from '../lib/helpers';

import { BigNumber } from 'ethers';
import { useEffect, useState } from 'react';
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
import { useKlerosCounter } from '../hooks/useKlerosCounters';
import { usePNKBalance } from '../hooks/usePNKBalance';
import { usePNKStaked } from '../hooks/usePNKStaked';
import { TimestampCounter } from '../lib/types';
import { getPercentageStaked, row_css } from './Home';


interface CombinedRechartsData {
  timestamp: number
  data_eth: number
  data_gno: number
}

function combineDataTimeCounter({ data_eth, data_gno }: { data_eth: TimestampCounter, data_gno: TimestampCounter }): CombinedRechartsData[] {
  const allTimestamps = new Set([...Object.keys(data_eth), ...Object.keys(data_gno)]);
  // Crear un array de objetos con los datos combinados
  const combinedData = Array.from(allTimestamps).map(timestamp => ({
    timestamp: parseInt(timestamp) / 1000, // time data from kleros_stats is in ms
    data_eth: data_eth[timestamp] || 0,
    data_gno: data_gno[timestamp] || 0
  }));
  return combinedData
}

function aggregateKlerosCounters({ data_eth, data_gno }: { data_eth: KlerosCounter, data_gno: KlerosCounter }): KlerosCounter {
  let aggregatedKC: KlerosCounter = { ...data_eth }; // use eth data as base

  const commonKeys = Object.keys(data_eth).filter((key) => (key !== '__typename')) as (keyof KlerosCounter)[];
  commonKeys.forEach(key => {
    key === 'id'
      ? aggregatedKC[key] = data_eth[key]
      : aggregatedKC[key] = BigNumber.from(data_eth[key]).add(BigNumber.from(data_gno[key])).toString()
  });
  return aggregatedKC;
}

function generateCumulativeFeesCombined(combinedData: CombinedRechartsData[]): CombinedRechartsData[] {
  // Get an array from the object
  // Sort the array by timestamp
  combinedData.sort((a, b) => a.timestamp - b.timestamp);
  // Get the cumsum
  let cumulativeUSD_eth = 0;
  let cumulativeUSD_gno = 0;
  let cumulativeSeries: { timestamp: number; data_eth: number, data_gno: number }[] = []
  for (let i = 0; i < combinedData.length; i++) {
    cumulativeUSD_eth += combinedData[i].data_eth
    cumulativeUSD_gno += combinedData[i].data_gno
    cumulativeSeries[i] = {
      timestamp: combinedData[i].timestamp,
      data_eth: cumulativeUSD_eth,
      data_gno: cumulativeUSD_gno
    }
  }
  return cumulativeSeries;
}

export default function AggregatedCharts() {
  const { data: kc_eth } = useKlerosCounter({ chainId: '1' });
  const { data: kc_gno } = useKlerosCounter({ chainId: '100' });
  const [kc, setKc] = useState<KlerosCounter | undefined>(undefined);
  const { data: disputes_eth } = useDisputes({ chainId: '1' });
  const { data: disputes_gno } = useDisputes({ chainId: '100' });
  const { data: activeJurors_eth } = useActiveJurors('1');
  const { data: activeJurors_gno } = useActiveJurors('100');
  const { data: pnkStaked_eth } = usePNKStaked('1');
  const { data: pnkStaked_gno } = usePNKStaked('100');
  const { data: feesPaid_eth } = useFeesPaid('1');
  const { data: feesPaid_gno } = useFeesPaid('100');
  const { data: txsCount_eth } = useAllTransactionsCount('1');
  const { data: txsCount_gno } = useAllTransactionsCount('100');
  const { totalSupply } = usePNKBalance([]);

  useEffect(() => {
    if (kc_eth && kc_gno) {
      setKc(aggregateKlerosCounters({ data_eth: kc_eth, data_gno: kc_gno }))
    }
  }, [kc_eth, kc_gno])

  return (
    <div>
      <Header
        logo={CHART}
        title='Charts'
        text="Aggregated KPIs for Kleros Court in all it's chains"
      />
      <Grid container justifyContent='center' alignItems='start'>
        <Grid container item columnSpacing={0} sx={row_css}>
          <Grid item xs={12} md={4} lg={2}><StatCard title={'PNK Staked'} subtitle={`%${totalSupply && kc ? getPercentageStaked(kc, totalSupply) : '...'} Staked`} value={kc ? formatPNK(kc.tokenStaked) : undefined} image={KLEROS} /></Grid>
          <Grid item xs={12} md={4} lg={2}><StatCard title={`Fees Paid`} subtitle={'All times'} value={kc_eth && kc_gno ? `${formatAmount(kc_eth.totalETHFees, '1')}ETH + ${formatAmount(kc_gno.totalETHFees, '100')}DAI` : undefined} image={ETHEREUM} /></Grid>
          <Grid item xs={12} md={4} lg={2}><StatCard title={'PNK Redistributed'} subtitle={'All times'} value={kc ? formatPNK(kc.totalTokenRedistributed) : undefined} image={KLEROS_ORACLE} /></Grid>
          <Grid item xs={12} md={4} lg={2}><StatCard title={'Active Jurors'} subtitle={'All times'} value={kc?.activeJurors} image={COMMUNITY} /></Grid>
          <Grid item xs={12} md={4} lg={2}><StatCard title={'Cases'} subtitle={'All times'} value={kc?.disputesCount} image={BALANCE} /></Grid>
        </Grid>
      </Grid>

      <Typography sx={{ marginBottom: '20px' }} variant='h1'>Cases Evolution</Typography>
      {
        disputes_eth && disputes_gno ?
          <ResponsiveContainer width="100%" height="100%" minHeight="250px">
            <LineChart>
              <CartesianGrid vertical={false} strokeDasharray="4 8" />
              <XAxis dataKey="startTime"
                domain={["minData", "auto"]}
                name="Date"
                tickFormatter={unixTime => formatDate(unixTime, 'MMMM yyyy')}
                type="number"
                scale="time"
              />
              <YAxis dataKey="id" name="Dispute" type='number' domain={[0, Number(disputes_eth[0].id)]} />
              <Legend />
              <Tooltip labelFormatter={t => formatDate(t, 'MMMM yyyy')} />
              <Line data={disputes_gno} strokeLinecap="round" stroke="#009AFF" strokeWidth={'3px'} dataKey="id" dot={false} name='Gnosis'/>
              <Line data={disputes_eth} strokeLinecap="round" stroke="#9013FE" strokeWidth={'3px'} dataKey="id" dot={false} name='Ethereum'/>
            </LineChart>
          </ResponsiveContainer>
          : <Skeleton height='250px' width='100%' />
      }

      <Typography sx={{ marginBottom: '20px' }} variant='h1'>Active Jurors</Typography>
      {
        activeJurors_eth && activeJurors_gno ?
          <ResponsiveContainer width="100%" height="100%" minHeight="250px">
            <BarChart data={combineDataTimeCounter({
              data_eth: activeJurors_eth,
              data_gno: activeJurors_gno
            })
            }>
              <CartesianGrid vertical={false} strokeDasharray="4 8" />
              <XAxis
                dataKey="timestamp"
                domain={["auto", "auto"]}
                name="Date"
                tickFormatter={unixTime => formatDate(unixTime, 'MMMM yyyy')}
                type="number"
                scale="time"
              />
              <YAxis
                name="Active Jurors"
                type="number"
                domain={[0, 'auto']}
              />
              <Legend />
              <Tooltip labelFormatter={t => formatDate(t, 'MMMM yyyy')} />
              <Bar
                dataKey="data_eth"
                fill="#9013FE"
                stackId="stack"
                name='Ethereum'
              />
              <Bar
                dataKey="data_gno"
                fill="#009AFF"
                stackId="stack"
                name='Gnosis'
              />
            </BarChart>
          </ResponsiveContainer>
          : <Skeleton height='250px' width='100%' />
      }

      <Typography sx={{ marginBottom: '20px' }} variant='h1'>PNK Staked</Typography>
      {
        pnkStaked_eth && pnkStaked_gno ?
          <ResponsiveContainer width="100%" height="100%" minHeight="250px">
            <BarChart data={combineDataTimeCounter({
              data_eth: pnkStaked_eth['percentage'],
              data_gno: pnkStaked_gno['percentage']
            })
            }>
              <CartesianGrid vertical={false} strokeDasharray="4 8" />
              <XAxis
                dataKey="timestamp"
                domain={["auto", "auto"]}
                name="Date"
                tickFormatter={unixTime => formatDate(unixTime, 'MMMM yyyy')}
                type="number"
                scale="time"
              />
              <YAxis
                dataKey="counter"
                name="PNK Staked / Total Supply [%]"
                type="number"
                tickFormatter={(tick) => {
                  return `${(tick * 100).toFixed(1)}%`;
                }}
                domain={[0, .60]}
              />
              <Legend />
              <Tooltip
                labelFormatter={t => formatDate(t, 'MMMM yyyy')} 
                formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
              />
              <Bar
                dataKey="data_eth"
                fill="#9013FE"
                stackId="stack"
                name='Ethereum'
              />
              <Bar
                dataKey="data_gno"
                fill="#009AFF"
                stackId="stack"
                name='Gnosis'
              />
            </BarChart>
          </ResponsiveContainer>
          : <Skeleton height='250px' width='100%' />
      }


      <Typography sx={{ marginBottom: '0px' }} variant='h1'>Cumulative juror fees</Typography>
      <Typography sx={{ marginBottom: '20px', color: 'gray' }} variant='body2'>Taking into account the ETH/USD exchange rate at the time of payment</Typography>
      {
        feesPaid_eth && feesPaid_gno ?
          <ResponsiveContainer width="100%" height="100%" minHeight="250px">
            <BarChart data={
              generateCumulativeFeesCombined(
                combineDataTimeCounter({
                  data_eth: feesPaid_eth['ETHAmount_usd'],
                  data_gno: feesPaid_gno['ETHAmount_usd'],
                })
              )
            }>
              <CartesianGrid vertical={false} strokeDasharray="4 8" />
              <XAxis
                dataKey="timestamp"
                domain={["auto", "auto"]}
                name="Date"
                tickFormatter={unixTime => formatDate(unixTime, 'MMMM yyyy')}
                type="number"
                scale="time"
              />
              <YAxis
                name="Fees in USD $"
                type="number"
                tickFormatter={(value) =>
                  new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(value)
                }
                domain={[0, 'auto']}
                label={{ value: '$', angle: -90, position: 'insideLeft', fill: '#9013FE' }}
              />
              <Legend />
              <Tooltip
                labelFormatter={t => formatDate(t, 'MMMM yyyy')} 
                formatter={(value: number) => `$${value.toFixed(2)}`}
              />
              <Bar
                dataKey="data_eth"
                fill="#9013FE"
                stackId="stack"
                name='Ethereum'
              />
              <Bar
                dataKey="data_gno"
                fill="#009AFF"
                stackId="stack"
                name='Gnosis'
              />
            </BarChart>
          </ResponsiveContainer>

          : <Skeleton height='250px' width='100%' />
      }

      <Typography sx={{ marginBottom: '0px' }} variant='h1'>Monthly fees paid to Jurors</Typography>
      <Typography sx={{ marginBottom: '20px', color: 'gray' }} variant='body2'>Considering ETH/USD price at payment date</Typography>
      {
        feesPaid_eth && feesPaid_gno ?
          <ResponsiveContainer width="100%" height="100%" minHeight="250px">
            <BarChart data={
              combineDataTimeCounter({
                data_eth: feesPaid_eth['ETHAmount_usd'],
                data_gno: feesPaid_gno['ETHAmount_usd']
              })
            }
            >
              <CartesianGrid vertical={false} strokeDasharray="4 8" />
              <XAxis
                dataKey="timestamp"
                domain={["dataMin-1000", "auto"]}
                name="Date"
                tickFormatter={unixTime => formatDate(unixTime, 'MMMM yyyy')}
                type="number"
                scale="time"
              />
              <YAxis
                name="Fees in USD $"
                type="number"
                tickFormatter={(value) =>
                  new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(value)
                }
                domain={[0, 'auto']}
                label={{ value: '$', angle: -90, position: 'insideLeft' }}
              />
              <Legend />
              <Tooltip
                labelFormatter={t => formatDate(t, 'MMMM yyyy')} 
                formatter={(value: number) => `$${value.toFixed(2)}`}
              />
              <Bar
                dataKey="data_eth"
                fill="#9013FE"
                stackId="stack"
                name='Ethereum'
              />
              <Bar
                dataKey="data_gno"
                fill="#009AFF"
                stackId="stack"
                name='Gnosis'
              />
            </BarChart>
          </ResponsiveContainer>

          : <Skeleton height='250px' width='100%' />
      }

      <Typography sx={{ marginBottom: '0px' }} variant='h1'>Court Transactions</Typography>
      <Typography sx={{ marginBottom: '20px', color: 'gray' }} variant='body2'>Number of the most significant transactions per month.</Typography>
      {
        txsCount_eth && txsCount_gno ?
          <ResponsiveContainer width="100%" height="100%" minHeight="250px">
            <BarChart data={combineDataTimeCounter({
              data_eth: txsCount_eth,
              data_gno: txsCount_gno
            })}>
              <CartesianGrid vertical={false} strokeDasharray="4 8" />
              <XAxis
                dataKey="timestamp"
                domain={["auto", "auto"]}
                name="Date"
                tickFormatter={unixTime => formatDate(unixTime, 'MMMM yyyy')}
                type="number"
                scale="time"
              />
              <YAxis
                name="Transactions Count"
                type="number"
                tickFormatter={(value) =>
                  new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(value)
                }
                domain={[0, 'auto']}
              />
              <Legend />
              <Tooltip labelFormatter={t => formatDate(t, 'MMMM yyyy')} />
              <Bar
                dataKey="data_eth"
                fill="#9013FE"
                stackId="stack"
                name='Ethereum'
              />
              <Bar
                dataKey="data_gno"
                fill="#009AFF"
                stackId="stack"
                name='Gnosis'
              />
            </BarChart>
          </ResponsiveContainer>
          : <Skeleton height='250px' width='100%' />
      }
    </div>

  )
}
