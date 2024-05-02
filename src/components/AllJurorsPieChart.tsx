import { ResponsiveContainer, PieChart, Pie, Cell, Sector } from "recharts";
import { Skeleton, Typography } from "@mui/material";
import { useJurors } from "../hooks/useJurors";
import { Juror } from "../graphql/subgraph";
import { formatEther } from "@ethersproject/units";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import { shortenAddress } from "@usedapp/core";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

type JurorStake = {
  id: string;
  totalStaked: number | BigNumber;
};

const renderActiveShape = (props: {
  cx: any;
  cy: any;
  midAngle: any;
  innerRadius: any;
  outerRadius: any;
  startAngle: any;
  endAngle: any;
  fill: any;
  payload: any;
  percent: any;
}) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
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
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
      >{`Juror: ${
        payload.id.startsWith("0x") ? shortenAddress(payload.id) : payload.id
      }`}</text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#999"
      >
        {`(Stake: ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

function formatTotalStaked(allJurors: Juror[]): JurorStake[] {
  const totalStakedWei = allJurors.reduce(
    (total, juror) => total.add(BigNumber.from(juror.totalStaked)),
    BigNumber.from(0)
  );

  const smallJurors = {
    id: "Jurors with <1%",
    totalStaked: 0,
  };
  const formattedTotalStaked: JurorStake[] = [];
  allJurors.forEach((juror) => {
    if (
      BigNumber.from(juror.totalStaked)
        .mul(100)
        .div(totalStakedWei)
        .gt(BigNumber.from(1))
    ) {
      formattedTotalStaked.push({
        totalStaked: Number(formatEther(juror.totalStaked)),
        id: juror.id,
      });
    } else {
      smallJurors["totalStaked"] += Number(formatEther(juror.totalStaked));
    }
  });
  formattedTotalStaked.push(smallJurors);
  formattedTotalStaked.sort((a, b) => (a.totalStaked > b.totalStaked ? 1 : -1));
  return formattedTotalStaked;
}

export default function AllJurorsPieChart({ chainId }: { chainId: string }) {
  const { data: allJurors } = useJurors(chainId!);
  const [jurorStakes, setJurorStakes] = useState<JurorStake[] | undefined>(
    undefined
  );
  const [jurorStakesActiveIndex, setJurorStakeActiveIndex] =
    useState<number>(0);

  useEffect(() => {
    if (allJurors) {
      const formated = formatTotalStaked(allJurors!);
      setJurorStakes(formated);
    }
  }, [allJurors]);

  const onPieEnter = (_: any, index: number) => {
    setJurorStakeActiveIndex(index);
  };

  return (
    <div>
      <Typography sx={{ marginBottom: "20px" }} variant="h1">
        Jurors Distribution
      </Typography>
      {jurorStakes && jurorStakes.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%" minHeight="250px">
          <PieChart width={400} height={400}>
            {/* TODO: Add the second pie with the jurors with < 1% of Stake */}
            <Pie
              activeIndex={jurorStakesActiveIndex}
              activeShape={renderActiveShape}
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
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton height="250px" width="100%" />
      )}
    </div>
  );
}
