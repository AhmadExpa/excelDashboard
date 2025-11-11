export default function RecyclabilityChart({ avgPct = 0, count = 0, region = 'All' }) {
  const pct = Math.round((avgPct ?? 0) * 1000) / 10;
  return (
    <div>
      <h3 className="section-title">Recyclability — {region}</h3>
      <div className="text-sm text-slate-700 space-y-1">
        <p>Average Recyclability: <b className="text-slate-900">{isFinite(pct) ? pct : 0}%</b></p>
        <p>Suppliers with data: <b className="text-slate-900">{count}</b></p>
      </div>
    </div>
  );
}
