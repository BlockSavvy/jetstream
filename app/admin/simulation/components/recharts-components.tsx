'use client';

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

// Area chart component for demand vs capacity visualization
export function AreaChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="capacity" 
          stackId="1" 
          stroke="#8884d8" 
          fill="#8884d8" 
          name="Capacity"
        />
        <Area 
          type="monotone" 
          dataKey="demand" 
          stackId="2" 
          stroke="#ffc658" 
          fill="#ffc658" 
          name="Demand"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

// Pie chart component for flight type distribution visualization
export function PieChart({ data, colors }: { data: any[], colors: string[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

// Bar chart component for route demand visualization
export function BarChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="demand" fill="#8884d8" name="Demand" />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

// Export all chart components
export default {
  AreaChart,
  PieChart,
  BarChart
}; 