import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B', '#06B6D4'];

export default function ExpenseChart({ expenses }) {
  // Aggregate expenses by category
  const dataMap = {};
  expenses.forEach(e => {
    if (e.type === 'debit') {
      dataMap[e.category] = (dataMap[e.category] || 0) + e.amount;
    }
  });

  const data = Object.keys(dataMap).map((name, index) => ({
    name,
    value: dataMap[name],
    color: COLORS[index % COLORS.length]
  }));

  if (data.length === 0) return <div className="small-muted" style={{textAlign:'center', padding:'20px'}}>No spending data to chart.</div>;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `₹${value}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}