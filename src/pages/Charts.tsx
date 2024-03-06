import React, { useEffect, useState } from 'react'
import Header from '../components/Header'
import CHART from '../assets/icons/chart_violet.png';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Bar, BarChart, LabelList, Cell, Tooltip } from 'recharts';

import { useDisputes } from '../hooks/useDisputes';
import { useParams } from 'react-router-dom';
import { Skeleton, Typography } from '@mui/material';
import { formatDate } from '../lib/helpers';

import { Dispute } from '../graphql/subgraph';
import { shortenAddress } from '@usedapp/core';
import { useActiveJurors } from '../hooks/useActiveJurors';
import { FeesPaid, TimestampCounter } from '../lib/types';
import { usePNKStaked } from '../hooks/usePNKStaked';
import { useFeesPaid } from '../hooks/useFeesPaid';

interface RechartsData {
  timestamp: number
  counter: number
}

function timeCounterToRecharts(data: TimestampCounter): RechartsData[] {
  return Object.keys(data).map(timestamp => ({
    timestamp: parseInt(timestamp) / 1000, // time data from kleros_stats is in ms
    counter: data[timestamp]
  }));
}

function generateCumulativeFees(data: FeesPaid): { timestamp: number; ethCumulative: number, usdCumulative: number }[] {
  // Get an array from the object
  const ethArray = timeCounterToRecharts(data['ETHAmount']);
  const usdArray = timeCounterToRecharts(data['ETHAmount_usd']);
  // Sort the array by timestamp
  ethArray.sort((a, b) => a.timestamp - b.timestamp);
  usdArray.sort((a, b) => a.timestamp - b.timestamp);
  // Get the cumsum
  let cumulativeETH = 0;
  let cumulativeUSD = 0;
  let cumulativeSeries: { timestamp: number; ethCumulative: number, usdCumulative: number }[] = []
  for (let i = 0; i<ethArray.length; i++) {
    cumulativeETH += ethArray[i].counter
    cumulativeUSD += usdArray[i].counter
    cumulativeSeries[i] = {
      timestamp: ethArray[i].timestamp,
      ethCumulative: cumulativeETH,
      usdCumulative: cumulativeUSD
    }
  }
  return cumulativeSeries;
}

function clusterByKey(disputes: Dispute[], key: "subcourtID" | "arbitrable"): { key: string, value: number, percentage: number }[] {
  // let keys = disputes.map((dispute) => dispute[key].id).filter((x, i, a) => a.indexOf(x) === i);
  let occurrences: { [key: string]: number } = {}
  disputes.forEach(dispute => {
    occurrences[dispute[key].id] = (occurrences[dispute[key].id] || 0) + 1;
  })
  const totalDisputes = disputes.length

  let formatedOcurrences: { key: string, value: number, percentage: number }[] = []
  Object.keys(occurrences).forEach((key: string) => formatedOcurrences.push({ key: key, value: occurrences[key], percentage: totalDisputes ? occurrences[key] / totalDisputes : 0 }))
  return formatedOcurrences.sort((a, b) => (a.value < b.value) ? 1 : ((b.value < a.value) ? -1 : 0))
}


export default function Charts() {
  const { chainId } = useParams();
  const [dataByCourts, setDataByCourts] = useState<{ key: string, value: number, percentage: number }[] | undefined>(undefined);
  const [dataByArbitrables, setDataByArbitrables] = useState<{ key: string, value: number, percentage: number }[] | undefined>(undefined);
  const { data: disputes } = useDisputes({ chainId: chainId! });
  const { data: activeJurors } = useActiveJurors(chainId!);
  const { data: pnkStaked } = usePNKStaked(chainId!);
  const { data: feesPaid } = useFeesPaid(chainId!);
  if (feesPaid) console.log(generateCumulativeFees(feesPaid))
  const [focusBarCourt, setFocusBarCourt] = useState<number | null>(null);
  const [focusBarArbitrable, setFocusBarArbitrable] = useState<number | null>(null);

  useEffect(() => {
    if (disputes) {
      setDataByArbitrables(clusterByKey(disputes, "arbitrable"));
      setDataByCourts(clusterByKey(disputes, "subcourtID"));
    }
  }, [disputes])
  return (
    <div>
      <Header
        logo={CHART}
        title='Charts'
        text='A series of charts illustrating Kleros data.'
      />

      <Typography sx={{ marginBottom: '20px' }} variant='h1'>Cases Evolution</Typography>
      {
        disputes ?
          <ResponsiveContainer width="100%" height="100%" minHeight="250px">
            <LineChart data={disputes}>
              <defs>
                <linearGradient id="colorUv" x1="0%" y1="0" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9013FE" />
                  <stop offset="100%" stopColor="#009AFF" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 8" />
              <XAxis dataKey="startTime"
                domain={["auto", "auto"]}
                name="Date"
                tickFormatter={unixTime => formatDate(unixTime, 'MMMM yyyy')}
                type="number"
                scale="time"
              />
              <YAxis dataKey="id" name="Dispute" type='number' domain={[0, Number(disputes[0].id)]} />
              <Line data={disputes} strokeLinecap="round" stroke="url(#colorUv)" strokeWidth={'3px'} dataKey="id" dot={false} />              
            </LineChart>
          </ResponsiveContainer>

          : <Skeleton height='250px' width='100%' />
      }

      <Typography sx={{ marginBottom: '20px' }} variant='h1'>Active Jurors</Typography>
      {
        activeJurors ?
          <ResponsiveContainer width="100%" height="100%" minHeight="250px">
            <LineChart data={timeCounterToRecharts(activeJurors)}>
              <defs>
                <linearGradient id="colorUv" x1="0%" y1="0" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9013FE" />
                  <stop offset="100%" stopColor="#009AFF" />
                </linearGradient>
              </defs>
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
                name="Active Jurors"
                type="number"
                domain={[0, 'auto']}
              />
              <Line
                dataKey="counter"
                strokeLinecap="round"
                stroke="url(#colorUv)"
                strokeWidth={'3px'}
                dot={false}
              /> 
            </LineChart>
          </ResponsiveContainer>

          : <Skeleton height='250px' width='100%' />
      }

      <Typography sx={{ marginBottom: '20px' }} variant='h1'>PNK Staked</Typography>
      {
        pnkStaked ?
          <ResponsiveContainer width="100%" height="100%" minHeight="250px">
            <LineChart data={timeCounterToRecharts(pnkStaked['percentage'])}>
              <defs>
                <linearGradient id="colorUv" x1="0%" y1="0" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9013FE" />
                  <stop offset="100%" stopColor="#009AFF" />
                </linearGradient>
              </defs>
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
                  return `${tick * 100}%`;
                }}
                domain={[0, .60]}
              />
              <Line
                dataKey="counter"
                strokeLinecap="round"
                stroke="url(#colorUv)"
                strokeWidth={'3px'}
                dot={false}
              />
              
            </LineChart>
          </ResponsiveContainer>

          : <Skeleton height='250px' width='100%' />
      }


      <Typography sx={{ marginBottom: '0px' }} variant='h1'>Fees paid to Jurors</Typography>
      <Typography sx={{ marginBottom: '20px', color: 'gray' }} variant='body2'>Considering ETH/USD price at payment date</Typography>
      {
        feesPaid ?
          <ResponsiveContainer width="100%" height="100%" minHeight="250px">
            <LineChart data={generateCumulativeFees(feesPaid)}>
              <defs>
                <linearGradient id="colorUv" x1="0%" y1="0" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9013FE" />
                  <stop offset="100%" stopColor="#009AFF" />
                </linearGradient>
              </defs>
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
                dataKey="usdCumulative"
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
                yAxisId='left'
              />
              <YAxis
                dataKey="ethCumulative"
                name="Fees in ETH"
                type="number"
                tickFormatter={(value) =>
                  new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(value)
                }
                domain={[0, 'auto']}
                label={{ value: 'ETH', angle: -90, position: 'insideRight', fill: '#009AFF' }}
                yAxisId='right'
                orientation='right'
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

          : <Skeleton height='250px' width='100%' />
      }
      <Typography sx={{ marginBottom: '0px' }} variant='h1'>Monthly fees paid to Jurors</Typography>
      <Typography sx={{ marginBottom: '20px', color: 'gray' }} variant='body2'>Considering ETH/USD price at payment date</Typography>
      {
        feesPaid ?
          <ResponsiveContainer width="100%" height="100%" minHeight="250px">
            <BarChart data={timeCounterToRecharts(feesPaid['ETHAmount_usd'])}>
              <defs>
                <linearGradient id="colorUv" x1="0%" y1="0" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9013FE" />
                  <stop offset="100%" stopColor="#009AFF" />
                </linearGradient>
              </defs>
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
                name="Fees in USD $"
                type="number"
                tickFormatter={(value) =>
                  new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(value)
                }
                domain={[0, 'auto']}
                label={{ value: '$', angle: -90, position: 'insideLeft'}}
              />

              <Bar
                dataKey="counter"
                fill="#9013FE"
              />
              
            </BarChart>
          </ResponsiveContainer>

          : <Skeleton height='250px' width='100%' />
      }

      <Typography sx={{ marginBottom: '20px' }} variant='h1'>Cases by Court</Typography>
      {
        dataByCourts ?
          <ResponsiveContainer width="100%" height="100%" minHeight="250px">
            <BarChart
              data={dataByCourts}
              onMouseMove={state => {
                if (state.isTooltipActive) {
                  setFocusBarCourt(state.activeTooltipIndex!);
                } else {
                  setFocusBarCourt(null);
                }
              }}
            >
              <XAxis dataKey="key"
                name="Courts"
                type="category"
              />
              <YAxis dataKey="percentage" name="Dispute" type='number' tickFormatter={(value) => `${value * 100} %`} domain={[0, 0.75]} />
              <CartesianGrid vertical={false} strokeDasharray="4 8" />
              <Bar dataKey="percentage" fill="#9013FE">
                <LabelList dataKey="value" position={"top"} />
                {dataByCourts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={focusBarCourt === index ? '#009AFF' : '#9013FE'} />
                ))}
              </Bar>
              {/* <Brush dataKey="key" height={30} stroke="#8884d8" /> */}
              <Tooltip
                coordinate={{ x: 0, y: 150 }}
                formatter={(value: number) => { return `${(value * 100).toFixed(2)} %`; }}
                labelFormatter={(value) => { return `Court: ${value}` }}
                cursor={{ fill: 'transparent' }}
              />
            </BarChart>
          </ResponsiveContainer>

          : <Skeleton height='250px' width='100%' />
      }

      <Typography sx={{ marginBottom: '20px' }} variant='h1'>Cases by DApp</Typography>
      {
        dataByArbitrables ?
          <ResponsiveContainer width="100%" height="100%" minHeight="250px">
            <BarChart
              data={dataByArbitrables}
              onMouseMove={state => {
                if (state.isTooltipActive) {
                  setFocusBarArbitrable(state.activeTooltipIndex!);
                } else {
                  setFocusBarArbitrable(null);
                }
              }}
              margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="4 8" />
              <XAxis dataKey="key"
                name="Arbitrable"
                type="category"
                tickFormatter={(value) => shortenAddress(value)}
              />
              <YAxis dataKey="percentage" name="Dispute" type='number' tickFormatter={(value) => `${value * 100} %`} domain={[0, 0.75]} />
              <Bar dataKey="percentage" fill="#9013FE" >
                <LabelList dataKey="value" position="top" />
                {dataByArbitrables.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={focusBarArbitrable === index ? '#009AFF' : '#9013FE'} />
                ))}
              </Bar>
              <Tooltip
                coordinate={{ x: 0, y: 150 }}
                formatter={(value: number) => { return `${(value * 100).toFixed(2)} %`; }}
                labelFormatter={(value) => { return `Arbitrable: ${value}` }}
                cursor={{ fill: 'transparent' }}
              />
              {/* <Brush dataKey="key" height={30} stroke="#8884d8" /> */}

            </BarChart>
          </ResponsiveContainer>

          : <Skeleton height='250px' width='100%' />
      }
    </div>



  )
}
