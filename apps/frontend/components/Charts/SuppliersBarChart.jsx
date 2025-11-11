import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function SuppliersBarChart({ regionalCounts = {}, region = 'All', total = 0 }) {
  let data = [];
  if (region === 'All') {
    data = Object.entries(regionalCounts || {}).map(([reg, count]) => ({ region: reg, suppliers: count }));
  } else {
    data = [{ region, suppliers: total }];
  }

  return (
    <div>
      <h3 className="section-title">Suppliers {region === 'All' ? '(by Region)' : `(${region})`}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="region" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="suppliers" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
