import { useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import SuppliersBarChart from "./Charts/SuppliersBarChart";
import PaymentTermsChart from "./Charts/PaymentTermsChart";
import ContractsPie from "./Charts/ContractsPie";
import SpendTop10Chart from "./Charts/SpendTop10Chart";
import RecyclabilityChart from "./Charts/RecyclabilityChart";
import RecycledContentChart from "./Charts/RecycledContentChart";
import FSCChart from "./Charts/FSCChart";
import WorldMap from "./WorldMap";
import ExportDashboardToExcel from "./ExcelButton"; // make sure this re-exports the component from ExportDashboardToExcel.jsx

export default function Dashboard({ data, onReset }) {
  const [region, setRegion] = useState("All");
  const [year, setYear] = useState("2024");

  // 1) Refs for charts to export (skip WorldMap per your requirement)
  const spendRef = useRef(null);
  const suppliersRef = useRef(null);
  const paymentRef = useRef(null);
  const contractsRef = useRef(null);
  const recyclabilityRef = useRef(null);
  const recycledRef = useRef(null);
  const fscRef = useRef(null);

  // 2) Existing memo/derived values (unchanged)
  const regions = useMemo(() => {
    const keys = Object.keys(data?.suppliersByRegion || {});
    const unique = Array.from(new Set(keys));
    return ["All", ...unique];
  }, [data]);

  const isAll = region === "All";

  const totalSuppliers = isAll
    ? data.totalSuppliers
    : data.suppliersByRegion?.[region] || 0;
  const paymentAvg = isAll
    ? data.paymentTerms?.avgDaysGlobal ?? 0
    : data.paymentTerms?.avgByRegion?.[region] ?? 0;
  const paymentDist = data.paymentTerms?.distribution || { "<=30": 0, "<=60": 0, ">60": 0 };

  const activeCount = data.contracts?.activeCount ?? 0;
  const noContractCount = data.contracts?.noContractCount ?? 0;

  const topSuppliersList = isAll
    ? data.topSuppliers?.[`global${year}`] || []
    : data.topSuppliers?.byRegion?.[region]?.[year] || [];

  const recyclabilityAvg = data.recyclability?.globalAvg ?? 0;
  const recyclabilityCount = data.recyclability?.dataCount ?? 0;

  const recycledAvg = data.recycledContent?.globalAvg ?? 0;
  const recycledDist = data.recycledContent?.distribution || {};

  const fscGlobal = data.fscCertification?.percentGlobal ?? 0;
  const fscByRegion = data.fscCertification?.percentByRegion || {};

  // 3) Tables for Excel sheets (shape: { name, rows: [{...}] })
  const datasets = useMemo(() => {
    const asRows = [];

    // a) Top suppliers for selected scope
    asRows.push({
      name: `Top Suppliers ${region}-${year}`,
      rows: (topSuppliersList || []).map((s, i) => ({
        rank: i + 1,
        supplier: s.name ?? s.supplier ?? "",
        spend: s.spend ?? 0,
        category: s.category ?? "",
      })),
    });

    // b) Suppliers by region (flatten)
    const suppliersRows = Object.entries(data.suppliersByRegion || {}).map(
      ([r, count]) => ({ region: r, suppliers: count })
    );
    asRows.push({ name: "Suppliers by Region", rows: suppliersRows });

    // c) Payment terms
    asRows.push({
      name: "Payment Terms",
      rows: [
        { metric: "Avg Days (scope)", value: paymentAvg },
        { metric: "<=30", value: paymentDist["<=30"] ?? 0 },
        { metric: "<=60", value: paymentDist["<=60"] ?? 0 },
        { metric: ">60", value: paymentDist[">60"] ?? 0 },
      ],
    });

    // d) Contracts
    asRows.push({
      name: "Contracts",
      rows: [
        { status: "Active", count: activeCount },
        { status: "No Contract", count: noContractCount },
      ],
    });

    // e) Recyclability
    asRows.push({
      name: "Recyclability",
      rows: [{ metric: "Global Avg %", value: recyclabilityAvg }, { metric: "Data Count", value: recyclabilityCount }],
    });

    // f) Recycled content
    const recycledRows = Object.entries(recycledDist).map(([bucket, v]) => ({ bucket, value: v }));
    asRows.push({ name: "Recycled Content", rows: [{ metric: "Global Avg %", value: recycledAvg }, ...recycledRows] });

    // g) FSC
    const fscRows = [{ region: "Global", percent: fscGlobal }];
    Object.entries(fscByRegion).forEach(([r, pct]) => fscRows.push({ region: r, percent: pct }));
    asRows.push({ name: "FSC Certification", rows: fscRows });

    return asRows;
  }, [
    region,
    year,
    topSuppliersList,
    data.suppliersByRegion,
    paymentAvg,
    paymentDist,
    activeCount,
    noContractCount,
    recyclabilityAvg,
    recyclabilityCount,
    recycledAvg,
    recycledDist,
    fscGlobal,
    fscByRegion,
  ]);

  // 4) Chart refs for image capture (skip WorldMap)
  const chartRefs = useMemo(
    () => [
      { title: `Spend Top 10 (${region} ${year})`, ref: spendRef },
      { title: `Suppliers by Region (${region})`, ref: suppliersRef },
      { title: `Payment Terms (${region})`, ref: paymentRef },
      { title: `Contracts (${region})`, ref: contractsRef },
      { title: `Recyclability (${region})`, ref: recyclabilityRef },
      { title: `Recycled Content (${region})`, ref: recycledRef },
      { title: `FSC Certification (${region})`, ref: fscRef },
    ],
    [region, year]
  );

  return (
    <div className="grid gap-4">
      <motion.div
        className="card p-4 flex flex-wrap items-center gap-3"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mr-auto">
          <Globe className="w-5 h-5" aria-hidden />
          <div className="font-semibold">Controls</div>
        </div>

        <label className="text-sm flex items-center gap-2">
          Region
          <select
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        <label className="text-sm flex items-center gap-2">
          Year
          <select
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="2023">2023</option>
            <option value="2024">2024</option>
          </select>
        </label>

        {/* 5) Export button */}
        <ExportDashboardToExcel
          filename={`Dashboard-${region}-${year}.xlsx`}
          datasets={datasets}
          chartRefs={chartRefs}
          meta={{
            subject: `Packaging Dashboard ${region} ${year}`,
            description: "Data tables + chart images. Map excluded by design.",
          }}
          beforeExport={async () => {
            // Make sure charts are fully rendered before capture
            await new Promise((r) => setTimeout(r, 50));
          }}
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div className="card p-4 md:col-span-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div ref={spendRef}>
            <SpendTop10Chart topSuppliers={topSuppliersList} year={year} region={region} />
          </div>
        </motion.div>

        <motion.div className="card p-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <div ref={suppliersRef}>
            <SuppliersBarChart regionalCounts={data.suppliersByRegion} region={region} total={totalSuppliers} />
          </div>
        </motion.div>

        <motion.div className="card p-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div ref={paymentRef}>
            <PaymentTermsChart avgDays={paymentAvg} distribution={paymentDist} region={region} />
          </div>
        </motion.div>

        <motion.div className="card p-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div ref={contractsRef}>
            <ContractsPie active={activeCount} noContract={noContractCount} region={region} />
          </div>
        </motion.div>

        <motion.div className="card p-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div ref={recyclabilityRef}>
            <RecyclabilityChart avgPct={recyclabilityAvg} count={recyclabilityCount} region={region} />
          </div>
        </motion.div>

        <motion.div className="card p-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div ref={recycledRef}>
            <RecycledContentChart avgPct={recycledAvg} distribution={recycledDist} region={region} />
          </div>
        </motion.div>

        <motion.div className="card p-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div ref={fscRef}>
            <FSCChart globalPercent={fscGlobal} regionalPercents={fscByRegion} region={region} />
          </div>
        </motion.div>
      </div>

      {/* Not exported (per your note) */}
      <motion.div className="card p-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <h3 className="section-title">Global Packaging Regulations Map</h3>
        <WorldMap regulations={data.regulations} />
      </motion.div>
    </div>
  );
}
