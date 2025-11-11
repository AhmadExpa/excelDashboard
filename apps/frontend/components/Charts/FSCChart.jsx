import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function FSCChart({ globalPercent = 0, regionalPercents = {}, region = 'All' }) {
  const global = Math.round(globalPercent * 10) / 10;
  const data = Object.entries(regionalPercents || {}).map(([reg, pct]) => ({ region: reg, pct: Math.round((pct ?? 0) * 10) / 10 }));

  return (
    <div>
      <h3 className="section-title">FSC Certification</h3>
      <p className="text-sm text-slate-600">Global: <b className="text-slate-900">{isFinite(global) ? global : 0}%</b></p>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="region" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="pct" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
