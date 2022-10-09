import React from 'react'
import { RadialBarChart, RadialBar, PolarAngleAxis, LabelList } from 'recharts';

export default function CoherenceGraph({ value }: { value: number }) {

    const data = [
        { name: value, value: value }
    ];

    return (
        <RadialBarChart
            width={120}
            height={120}
            innerRadius="60%"
            outerRadius="80%"
            data={data}
            startAngle={90}
            endAngle={-270}
        >
            <defs>
                <linearGradient id="colorUv" x1="1" y1="1" x2="0" y2="0">
                    <stop offset="66.37%" stopColor="#9013FE" stopOpacity={1} />
                    <stop offset="82.15%" stopColor="#009AFF" stopOpacity={1} />
                </linearGradient>
            </defs>
            <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
            />
            <RadialBar dataKey='value' fill="url(#colorUv)" >
                <LabelList dataKey="name" position="center" formatter={(value:string) => {return `${value} %`}}/>
            </RadialBar>

        </RadialBarChart>

    )
}
