import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const transformArrayToObject = (
  data: [string, number][]
): Record<string, number | string> => {
  const result: Record<string, number | string> = { name: "votes" };
  let totalVotes = data.reduce((acc, cur) => acc + cur[1], 0);
  if (totalVotes === 0) {
    totalVotes = 1;
  }

  data.forEach(([key, qty]) => {
    result[key] = (qty / totalVotes) * 100;
  });
  return result;
};



const StackedBarChart: React.FC<{ data: [string, number][] }> = ({ data }) => {
  const dataObject = transformArrayToObject(data);
  const keys = Object.keys(dataObject).filter((key) => key !== "name");
  // This should be values from theme!
  const fillColors = [
    "#4D00B4","#009AFF", "#9013FE", "#333333", "#009AFF", "#FAFBFC", "#FFBB28", "#FF8042", "#AF19FF", "#FF1963"
  ];
  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart
        data={[dataObject]}
        layout="vertical"
        
      >
        <CartesianGrid />
        <XAxis type="number" label={{value: "Percentage of votes", position:"insideBottom", offset: 0}}/>
        <YAxis dataKey="name" type="category" hide />
        
        <Tooltip />
        <Legend />
        
        {keys.map((key, index) => (
          <Bar key={index} dataKey={key} stackId="a" fill={fillColors[index % fillColors.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default StackedBarChart;
