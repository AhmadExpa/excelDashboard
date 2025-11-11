"use client";

import { useState } from "react";
import {
  UploadCloud,
  RefreshCcw,
  Info,
  CheckCircle2,
  ChevronDown,
  ListChecks,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Dashboard from "../components/Dashboard";

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [mappingSheetName, setMappingSheetName] =
    useState("Mapping Corrugates");
  const [regulationsSheetName, setRegulationsSheetName] = useState(
    "Global_Packaging_Regulations"
  );
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  // accordion toggles
  const [openMap, setOpenMap] = useState(true);
  const [openReg, setOpenReg] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("mappingSheetName", mappingSheetName);
      form.append("regulationsSheetName", regulationsSheetName);

      const res = await fetch(`${apiBase}/upload`, {
        method: "POST",
        body: form,
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json.error || "Upload failed");
        setBusy(false);
        return;
      }

      if (json.warnings && json.warnings.length) {
        console.warn(json.warnings.join(" | "));
      }
      setData(json);
    } catch (err) {
      console.error(err);
      alert("Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setData(null);
    setFile(null);
    setMappingSheetName("Mapping Corrugates");
    setRegulationsSheetName("Global_Packaging_Regulations");
  };

  // small helpers
  const Section = ({ title, open, onToggle, children, badge }) => (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-sky-600" aria-hidden />
          <span className="font-semibold text-slate-800">{title}</span>
          {badge ? (
            <span className="ml-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
              {badge}
            </span>
          ) : null}
        </div>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );

  const Chip = ({ children }) => (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
      {children}
    </span>
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          <UploadCloud className="w-6 h-6" aria-hidden />
          <h1 className="text-xl font-semibold">Excel Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {!data ? (
          <>
            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-sm"
            >
              <div className="flex items-start gap-3 p-4">
                <div className="rounded-xl bg-sky-100 p-2">
                  <Info className="w-5 h-5 text-sky-700" aria-hidden />
                </div>
                <div className="text-sm text-slate-700">
                  <p className="font-medium text-slate-800">
                    Before you upload
                  </p>
                  <p className="mt-0.5">
                    Make sure your workbook has the two sheets listed below with
                    the required columns. Numbers may be written like{" "}
                    <em>1,234.56</em> and percentages as <em>85</em> or{" "}
                    <em>0.85</em>.
                  </p>
                </div>
              </div>

              <div className="px-4 pb-4 space-y-4">
                {/* Mapping Sheet */}
                <Section
                  title='Mapping Sheet — e.g. "Mapping Corrugates"'
                  open={openMap}
                  onToggle={() => setOpenMap((v) => !v)}
                  badge="drives all supplier KPIs"
                >
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                      <span>
                        <strong>Region</strong> — groups suppliers (missing
                        values go to <Chip>Unspecified</Chip>)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                      <span>
                        <strong>PT Days</strong> — numeric; used for payment
                        terms averages and buckets (<Chip>&lt;=30</Chip>{" "}
                        <Chip>&lt;=60</Chip> <Chip>&gt;60</Chip>)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                      <span>
                        <strong>Contract status</strong> — counts{" "}
                        <Chip>active</Chip> and <Chip>no contract</Chip>{" "}
                        (case-insensitive)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                      <span>
                        <strong>2023 Spend</strong> &amp;{" "}
                        <strong>2024 Spend</strong> — rank top suppliers
                        globally & by region
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                      <span>
                        <strong>Recyclability %</strong> — average recyclability
                        (accepts 0–100 or 0–1)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                      <span>
                        <strong>
                          Supplier / Supplier Name / Parent supplier
                        </strong>{" "}
                        — label used in “Top Suppliers” lists
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                      <span>
                        <strong>Recycled content %</strong> — any of:{" "}
                        <Chip>Recycled materia contentl %</Chip>{" "}
                        <Chip>Recycled content %</Chip>{" "}
                        <Chip>Recycled material content %</Chip>
                        &nbsp;→ distribution + global average
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                      <span>
                        <strong>FSC</strong> — any of:{" "}
                        <Chip>FSC Certificate/ Equivalent</Chip>{" "}
                        <Chip>FSC Certificate</Chip> <Chip>FSC</Chip>
                        &nbsp;(<em>yes</em>/<em>valid</em>/exact <em>fsc</em>{" "}
                        =&nbsp;counted)
                      </span>
                    </li>
                  </ul>
                </Section>

                {/* Regulations Sheet */}
                <Section
                  title='Regulations Sheet — e.g. "Global_Packaging_Regulations"'
                  open={openReg}
                  onToggle={() => setOpenReg((v) => !v)}
                  badge="optional but recommended"
                >
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                      <span>
                        <strong>Jurisdiction / Country / JURISDICTION</strong> —
                        required per-row to include in the map
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                      <span>
                        <strong>Type</strong> — any of:{" "}
                        <Chip>Type (EPR / SUP / DRS / Tax / Design)</Chip>{" "}
                        <Chip>Type</Chip> <Chip>RegType</Chip>
                        &nbsp;(defaults to <em>Unknown</em> if missing)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                      <span>
                        <strong>Status</strong> — any of: <Chip>Status</Chip>{" "}
                        <Chip>RegStatus</Chip>
                        &nbsp;(defaults to <em>Unknown</em> if missing)
                      </span>
                    </li>
                  </ul>
                </Section>
              </div>
            </motion.div>

            {/* Upload Form */}
            <motion.form
              className="card p-6 max-w-xl mx-auto grid gap-4"
              onSubmit={handleUpload}
              encType="multipart/form-data"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Excel file (.xlsx)
                </label>
                <input
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) =>
                    setFile(
                      e.target.files && e.target.files[0]
                        ? e.target.files[0]
                        : null
                    )
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mapping sheet name
                  </label>
                  <input
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    type="text"
                    value={mappingSheetName}
                    onChange={(e) => setMappingSheetName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Regulations sheet name
                  </label>
                  <input
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    type="text"
                    value={regulationsSheetName}
                    onChange={(e) => setRegulationsSheetName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-60"
                >
                  <UploadCloud className="w-4 h-4" aria-hidden />
                  {busy ? "Processing…" : "Upload & Generate"}
                </button>
              </div>
            </motion.form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Dashboard data={data} onReset={handleReset} />
          </motion.div>
        )}
      </main>

      {data && (
        <div className="fixed bottom-4 right-4">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 shadow-soft hover:bg-black"
            title="Reset"
          >
            <RefreshCcw className="w-4 h-4" aria-hidden />
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
