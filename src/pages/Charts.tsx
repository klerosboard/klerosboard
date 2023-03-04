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
  const { data: disputes } = useDisputes({ chainId: chainId! })

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
        text='A serie of charts illustrating Kleros data.'
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
              <XAxis dataKey="startTime"
                domain={["auto", "auto"]}
                name="Date"
                tickFormatter={unixTime => formatDate(unixTime, 'MMMM yyyy')}
                type="number"
                scale="time"
              />
              <YAxis dataKey="id" name="Dispute" type='number' domain={[0, Number(disputes[0].id)]} />
              <Line data={disputes} strokeLinecap="round" stroke="url(#colorUv)" strokeWidth={'3px'} dataKey="id" dot={false} />
              <CartesianGrid vertical={false} strokeDasharray="4 8" />
            </LineChart>
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
              <YAxis dataKey="percentage" name="Dispute" type='number' tickFormatter={(value) => `${value * 100} %`} domain={[0, 0.75]}/>
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
                formatter={(value:number) => {return `${(value*100).toFixed(2)} %`;}}
                labelFormatter={(value) => {return `Court: ${value}`}}
                cursor={{fill: 'transparent'}}
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
              <XAxis dataKey="key"
                name="Arbitrable"
                type="category"
                tickFormatter={(value) => shortenAddress(value)}
              />
              <YAxis dataKey="percentage" name="Dispute" type='number' tickFormatter={(value) => `${value * 100} %`} domain={[0, 0.75]}/>
              <Bar dataKey="percentage" fill="#9013FE" >
                <LabelList dataKey="value" position="top" />
                {dataByArbitrables.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={focusBarArbitrable === index ? '#009AFF' : '#9013FE'} />
                ))}
              </Bar>
              <CartesianGrid vertical={false} strokeDasharray="4 8" />
              <Tooltip 
                coordinate={{ x: 0, y: 150 }}
                formatter={(value:number) => {return `${(value*100).toFixed(2)} %`;}}
                labelFormatter={(value) => {return `Arbitrable: ${value}`}}
                cursor={{fill: 'transparent'}}
              />
              {/* <Brush dataKey="key" height={30} stroke="#8884d8" /> */}

            </BarChart>
          </ResponsiveContainer>

          : <Skeleton height='250px' width='100%' />
      }
    </div>



  )
}
