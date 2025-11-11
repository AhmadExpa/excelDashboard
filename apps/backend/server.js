const express = require('express');
const multer = require('multer');
const cors = require('cors');
const xlsx = require('xlsx');

const app = express();

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use(cors({ origin: true }));

const upload = multer({ storage: multer.memoryStorage() });

function toNumber(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    if (cleaned) return Number(cleaned[0]);
  }
  return null;
}

function toPercentFraction(val) {
  const num = toNumber(val);
  if (num === null) return null;
  if (num > 1.00001) return num / 100.0;
  if (num < 0) return null;
  return num;
}

function safeLower(str) {
  return (str || '').toString().trim().toLowerCase();
}

function topNByKey(rows, key, n = 10, nameKeys = ['Supplier', 'Supplier Name', 'Parent supplier']) {
  const arr = [...rows].filter(r => typeof r[key] === 'number' && !Number.isNaN(r[key]));
  arr.sort((a, b) => (b[key] || 0) - (a[key] || 0));
  return arr.slice(0, n).map(r => {
    let name = null;
    for (const k of nameKeys) if (r[k]) { name = r[k]; break; }
    return { name: name || 'Unknown', spend: r[key] || 0 };
  });
}

function countByPaymentTerm(rows) {
  const dist = { '<=30': 0, '<=60': 0, '>60': 0 };
  rows.forEach(r => {
    const pt = toNumber(r['PT Days']);
    if (pt === null) return;
    if (pt <= 30) dist['<=30']++;
    else if (pt <= 60) dist['<=60']++;
    else dist['>60']++;
  });
  return dist;
}

function avgPaymentTerm(rows) {
  const nums = rows.map(r => toNumber(r['PT Days'])).filter(v => v !== null);
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function fscYes(row) {
  const cert = safeLower(row['FSC Certificate/ Equivalent'] || row['FSC Certificate'] || row['FSC']);
  if (!cert) return false;
  return cert.includes('yes') || cert === 'fsc' || cert.includes('valid');
}

function groupByRegion(rows) {
  const by = {};
  rows.forEach(r => {
    const region = r.Region || 'Unspecified';
    if (!by[region]) by[region] = [];
    by[region].push(r);
  });
  return by;
}

app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Backward-compatible: fall back to legacy `sheetName`
    const mappingSheetName = req.body.mappingSheetName || req.body.sheetName || 'Mapping Corrugates';
    const regulationsSheetName = req.body.regulationsSheetName || 'Global_Packaging_Regulations';

    const wb = xlsx.read(req.file.buffer, { type: 'buffer' });

    const mappingSheet = wb.Sheets[mappingSheetName];
    if (!mappingSheet) {
      return res.status(400).json({ error: `Sheet "${mappingSheetName}" not found` });
    }
    const mappingData = xlsx.utils.sheet_to_json(mappingSheet, { defval: null });

    const regSheet = wb.Sheets[regulationsSheetName];
    const regulationsData = regSheet ? xlsx.utils.sheet_to_json(regSheet, { defval: null }) : [];

    const totalSuppliers = mappingData.length;
    const byRegionRaw = groupByRegion(mappingData);
    const suppliersByRegion = Object.fromEntries(
      Object.entries(byRegionRaw).map(([k, v]) => [k, v.length])
    );

    const paymentTerms = {
      avgDaysGlobal: avgPaymentTerm(mappingData),
      distribution: countByPaymentTerm(mappingData),
      avgByRegion: {}
    };
    for (const [reg, rows] of Object.entries(byRegionRaw)) {
      paymentTerms.avgByRegion[reg] = avgPaymentTerm(rows);
    }

    const activeCount = mappingData.filter(r => safeLower(r['Contract status']).includes('active')).length;
    const noContractCount = mappingData.filter(r => safeLower(r['Contract status']).includes('no contract')).length;

    const topSuppliers = {
      global2023: topNByKey(mappingData, '2023 Spend'),
      global2024: topNByKey(mappingData, '2024 Spend'),
      byRegion: {}
    };
    for (const [reg, rows] of Object.entries(byRegionRaw)) {
      topSuppliers.byRegion[reg] = {
        2023: topNByKey(rows, '2023 Spend'),
        2024: topNByKey(rows, '2024 Spend')
      };
    }

    const recycVals = mappingData
      .map(r => toPercentFraction(r['Recyclability %']))
      .filter(v => v !== null);

    const recyclability = {
      globalAvg: recycVals.length ? recycVals.reduce((a, b) => a + b, 0) / recycVals.length : 0,
      dataCount: recycVals.length
    };

    const recycledKeys = ['Recycled materia contentl %', 'Recycled content %', 'Recycled material content %'];
    function getRecycledField(row) {
      for (const k of recycledKeys) if (k in row) return row[k];
      return null;
    }
    const contentVals = mappingData.map(r => getRecycledField(r));
    const numericContent = contentVals.map(toPercentFraction).filter(v => v !== null);
    const recycledContent = {
      globalAvg: numericContent.length ? numericContent.reduce((a, b) => a + b, 0) / numericContent.length : 0,
      distribution: {}
    };
    contentVals.forEach(val => {
      if (val === null || val === undefined) {
        recycledContent.distribution.undefined = (recycledContent.distribution.undefined || 0) + 1;
        return;
      }
      const num = toPercentFraction(val);
      const key = num !== null ? `${Math.round(num * 100)}%` : String(val).trim();
      recycledContent.distribution[key] = (recycledContent.distribution[key] || 0) + 1;
    });

    const fscYesCount = mappingData.filter(fscYes).length;
    const fscCertification = {
      percentGlobal: totalSuppliers ? (fscYesCount / totalSuppliers) * 100 : 0,
      percentByRegion: {}
    };
    for (const [reg, rows] of Object.entries(byRegionRaw)) {
      const yes = rows.filter(fscYes).length;
      fscCertification.percentByRegion[reg] = rows.length ? (yes / rows.length) * 100 : 0;
    }

    const countryRegMap = {};
    regulationsData.forEach(entry => {
      const country = entry.Jurisdiction || entry.Country || entry.JURISDICTION;
      if (!country) return;
      const type = entry['Type (EPR / SUP / DRS / Tax / Design)'] || entry.Type || entry.RegType || 'Unknown';
      const status = entry.Status || entry.RegStatus || 'Unknown';
      if (!countryRegMap[country]) countryRegMap[country] = [];
      countryRegMap[country].push({ type, status });
    });

    const warnings = [];
    if (!regSheet) {
      warnings.push(`Sheet "${regulationsSheetName}" not found. Regulations section will be empty.`);
    }

    res.json({
      meta: { mappingSheetName, regulationsSheetName },
      warnings,
      totalSuppliers,
      suppliersByRegion,
      paymentTerms,
      contracts: { activeCount, noContractCount },
      topSuppliers,
      recyclability,
      recycledContent,
      fscCertification,
      regulations: countryRegMap
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Processing error' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
