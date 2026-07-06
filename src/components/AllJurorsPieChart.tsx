import { ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { Box, Skeleton, Typography } from '@mui/material';
import { useJurors } from '../hooks/useJurors';
import { Juror } from '../graphql/subgraph';
import { formatEther } from 'viem';
import React, { useMemo, useState } from 'react';
import { shortenAddress } from '../lib/utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

type JurorStake = {
  id: string;
  totalStaked: number | bigint;
};

const renderActiveShape = (props: {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
}) => {
  if (!props) return <g />;
  const { cx = 0, cy = 0, innerRadius = 0, outerRadius = 0, startAngle = 0, endAngle = 0, fill = '#000' } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 8}
        fill={fill}
      />
    </g>
  );
};

function formatTotalStaked(allJurors: Juror[]): JurorStake[] {
  const totalStakedWei = allJurors.reduce((total, juror) => total + BigInt(String(juror.totalStaked)), 0n);

  const smallJurors = {
    id: 'Jurors with <1%',
    totalStaked: 0,
  };
  const formattedTotalStaked: JurorStake[] = [];
  allJurors.forEach((juror) => {
    const jurorStaked = BigInt(String(juror.totalStaked));
    if ((jurorStaked * 100n) / totalStakedWei > 1n) {
      formattedTotalStaked.push({
        totalStaked: Number(formatEther(jurorStaked)),
        id: juror.id,
      });
    } else {
      smallJurors['totalStaked'] += Number(formatEther(jurorStaked));
    }
  });
  formattedTotalStaked.push(smallJurors);
  formattedTotalStaked.sort((a, b) => (a.totalStaked > b.totalStaked ? 1 : -1));
  return formattedTotalStaked;
}

export default function AllJurorsPieChart({ chainId }: { chainId: string }) {
  const { data: allJurors } = useJurors(chainId!);
  const jurorStakes = useMemo(() => (allJurors ? formatTotalStaked(allJurors) : undefined), [allJurors]);
  const [jurorStakesActiveIndex, setJurorStakeActiveIndex] = useState<number>(0);

  const onPieEnter = (_: number | string, index: number) => {
    setJurorStakeActiveIndex(index);
  };

  const activeJuror = jurorStakes ? jurorStakes[jurorStakesActiveIndex] : undefined;
  const totalStake = jurorStakes ? jurorStakes.reduce((sum, j) => sum + Number(j.totalStaked), 0) : 0;
  const activePercent = activeJuror && totalStake > 0 ? (Number(activeJuror.totalStaked) / totalStake) * 100 : 0;

  return (
    <div>
      <Typography sx={{ marginBottom: '20px' }} variant="h1">
        Jurors Distribution
      </Typography>
      {jurorStakes && jurorStakes.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height="100%" minHeight="250px">
            <PieChart width={400} height={400}>
              {/* TODO: Add the second pie with the jurors with < 1% of Stake */}
              <Pie
                activeIndex={jurorStakesActiveIndex}
                activeShape={renderActiveShape as (props: unknown) => React.ReactElement}
                data={jurorStakes}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                dataKey="totalStaked"
                onMouseEnter={onPieEnter}
              >
                {jurorStakes.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {activeJuror && (
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Juror: {activeJuror.id.startsWith('0x') ? shortenAddress(activeJuror.id) : activeJuror.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stake: {activePercent.toFixed(2)}% (
                {Number(activeJuror.totalStaked).toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                })}{' '}
                PNK)
              </Typography>
            </Box>
          )}
        </>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}
    </div>
  );
}
