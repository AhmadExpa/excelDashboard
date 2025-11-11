import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";

function formatCompact(v) {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(v ?? 0));
}

function Title({ year, region }) {
  const scope = region && region !== "All" ? `(${region})` : "(Global)";
  return (
    <div className="flex items-center gap-2">
      <TrendingUp className="h-4 w-4 opacity-70" />
      <h3 className="text-lg font-semibold tracking-tight">
        Top 10 Suppliers by Spend — {year} {scope}
      </h3>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
      No suppliers found for this selection.
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload || {};
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md backdrop-blur">
      <div className="text-xs text-muted-foreground">{p.name}</div>
      <div className="text-base font-medium">{formatCompact(p.spend)}</div>
    </div>
  );
}

// Single-line, ellipsized Y-axis tick to avoid clutter
function NameTick({ x, y, payload, max = 28 }) {
  const full = String(payload?.value ?? "");
  const short = full.length > max ? full.slice(0, max - 1) + "…" : full;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        className="fill-muted-foreground"
        fontSize="11"
        title={full} // native tooltip with full name
      >
        {short}
      </text>
    </g>
  );
}

export default function SpendTop10Chart({ topSuppliers = [], year = "2024", region = "All" }) {
  const data = useMemo(() => {
    const cleaned = Array.isArray(topSuppliers)
      ? topSuppliers
          .filter((d) => d && d.name != null && d.spend != null)
          .map((d) => ({ name: String(d.name), spend: Number(d.spend) }))
      : [];
    cleaned.sort((a, b) => b.spend - a.spend);
    return cleaned.slice(0, 10);
  }, [topSuppliers]);

  const hasData = data.length > 0;

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <Title year={year} region={region} />

      <motion.div
        className="mt-3 rounded-xl border bg-card p-4 shadow-sm"
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        {!hasData ? (
          <EmptyState />
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 10, right: 48, left: 200, bottom: 6 }} // more left room
                barCategoryGap={12}
              >
                <defs>
                  <linearGradient id="spendBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />

                <XAxis
                  type="number"
                  tickFormatter={formatCompact}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={200}
                  tickMargin={8}
                  interval={0}
                  tick={<NameTick max={28} />} // << prevent label crowding
                />

                <Tooltip cursor={false} content={<CustomTooltip />} />

                <Bar dataKey="spend" radius={[6, 6, 6, 6]} fill="url(#spendBar)" maxBarSize={22}>
                  <LabelList
                    dataKey="spend"
                    position="right"
                    formatter={formatCompact}
                    className="fill-foreground text-xs"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {hasData && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing top {data.length} suppliers by spend</span>
            <span>Values shown in compact format</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
