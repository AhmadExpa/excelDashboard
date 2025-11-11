import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const ACTIVE_COLOR = "#9b9fa4ff";   // gray-900 (dark)
const INACTIVE_COLOR = "#D1D5DB"; // gray-300 (light)

function ValueLabel(props) {
  const { cx, cy, midAngle, outerRadius, value } = props;
  const RAD = Math.PI / 180;
  const r = outerRadius + 14; // place label just outside
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  return (
    <text x={x} y={y} dy={4} textAnchor={x >= cx ? "start" : "end"}
      fontSize={12} className="fill-muted-foreground">
      {value}
    </text>
  );
}

export default function ContractsPie({ active = 0, noContract = 0, region = "All" }) {
  const data = [
    { name: "Active Contract", value: active, color: ACTIVE_COLOR },
    { name: "No Contract", value: noContract, color: INACTIVE_COLOR },
  ];

  return (
    <div>
      <h3 className="section-title">Contract Status — {region}</h3>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              labelLine
              label={<ValueLabel />}
              isAnimationActive={false}
            >
              {data.map((d, i) => (
                <Cell key={`c-${i}`} fill={d.color} />
              ))}
            </Pie>

            <Tooltip
              cursor={false}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--background)",
              }}
            />

            <Legend
              payload={data.map((d) => ({
                value: d.name,
                type: "square",
                color: d.color,
                id: d.name,
              }))}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
