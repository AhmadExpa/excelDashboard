"use client";

import { useMemo, useRef, useState } from "react";
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
import ExportDashboardToPDF from "./ExcelButton";

export default function Dashboard({ data, onReset }) {
  const [region, setRegion] = useState("All");
  const [year, setYear] = useState("2024");

  // This ref wraps exactly what you want in the PDF
  const printRef = useRef(null);

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

  const paymentDist = data.paymentTerms?.distribution || {
    "<=30": 0,
    "<=60": 0,
    ">60": 0,
  };

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
              <option key={r} value={r}>
                {r}
              </option>
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

        <ExportDashboardToPDF
          targetRef={printRef}
          fileName={`Dashboard-${region}-${year}.pdf`}
          pageOrientation="portrait" // "portrait" or "landscape"
          marginPt={36} // 0.5" margins
          scale={3} // high-res rasterization
        />
      </motion.div>

      {/* Everything inside this wrapper will be captured into the PDF */}
      <div ref={printRef} className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            className="card p-4 md:col-span-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <SpendTop10Chart
              topSuppliers={topSuppliersList}
              year={year}
              region={region}
            />
          </motion.div>

          <motion.div
            className="card p-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SuppliersBarChart
              regionalCounts={data.suppliersByRegion}
              region={region}
              total={totalSuppliers}
            />
          </motion.div>

          <motion.div
            className="card p-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <PaymentTermsChart
              avgDays={paymentAvg}
              distribution={paymentDist}
              region={region}
            />
          </motion.div>

          <motion.div
            className="card p-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ContractsPie
              active={activeCount}
              noContract={noContractCount}
              region={region}
            />
          </motion.div>

          <motion.div
            className="card p-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <RecyclabilityChart
              avgPct={recyclabilityAvg}
              count={recyclabilityCount}
              region={region}
            />
          </motion.div>

          <motion.div
            className="card p-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <RecycledContentChart
              avgPct={recycledAvg}
              distribution={recycledDist}
              region={region}
            />
          </motion.div>

          <motion.div
            className="card p-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FSCChart
              globalPercent={fscGlobal}
              regionalPercents={fscByRegion}
              region={region}
            />
          </motion.div>
        </div>

        <motion.div
          className="card p-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h3 className="section-title">Global Packaging Regulations Map</h3>
          <WorldMap regulations={data.regulations} />
        </motion.div>
      </div>
    </div>
  );
}
