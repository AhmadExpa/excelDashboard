import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function PaymentTermsChart({ avgDays = 0, distribution = {}, region = 'All' }) {
  const data = Object.entries(distribution || {}).map(([category, count]) => ({ category, count }));

  return (
    <div>
      <h3 className="section-title">Payment Terms — {region}</h3>
      <p className="text-sm text-slate-600">Average Payment Term: <b className="text-slate-900">{Math.round(avgDays)} days</b></p>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="category" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
