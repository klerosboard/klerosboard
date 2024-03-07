import Header from '../components/Header'
import CHART from '../assets/icons/chart_violet.png';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Bar, BarChart, Legend } from 'recharts';

import { useDisputes } from '../hooks/useDisputes';
import { Skeleton, Typography } from '@mui/material';
import { formatDate } from '../lib/helpers';

import { useActiveJurors } from '../hooks/useActiveJurors';
import { TimestampCounter } from '../lib/types';
import { usePNKStaked } from '../hooks/usePNKStaked';
import { useFeesPaid } from '../hooks/useFeesPaid';
import { useAllTransactionsCount } from '../hooks/useAllTransactionsCount';


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

  return (
    <div>
      <Header
        logo={CHART}
        title='Charts'
        text="Aggregated KPIs for Kleros Court in all it's chains"
      />

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
              <Line data={disputes_gno} strokeLinecap="round" stroke="#009AFF" strokeWidth={'3px'} dataKey="id" dot={false} />
              <Line data={disputes_eth} strokeLinecap="round" stroke="#9013FE" strokeWidth={'3px'} dataKey="id" dot={false} />
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
