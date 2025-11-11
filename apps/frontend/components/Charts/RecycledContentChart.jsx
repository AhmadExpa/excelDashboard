import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function RecycledContentChart({ avgPct = 0, distribution = {}, region = 'All' }) {
  const pct = Math.round((avgPct ?? 0) * 1000) / 10;
  const data = Object.entries(distribution || {}).map(([value, count]) => ({ value, count }));

  return (
    <div>
      <h3 className="section-title">Recycled Content — {region}</h3>
      <p className="text-sm text-slate-600">Average Recycled Content: <b className="text-slate-900">{isFinite(pct) ? pct : 0}%</b></p>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="value" interval={0} angle={-20} textAnchor="end" height={80} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
