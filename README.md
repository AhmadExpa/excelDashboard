# Full-Stack Dashboard (Monorepo)

A local, single-user app to upload an Excel file, compute supplier/regulation metrics in memory, and visualize them in a Next.js dashboard.

## Structure
```
fullstack-dashboard-monorepo/
├─ apps/
│  ├─ backend/     (Express + Multer + xlsx)
│  └─ frontend/    (Next.js + React + Recharts + react-simple-maps + Tailwind + Framer Motion + lucide-react)
└─ package.json    (npm workspaces; dev script runs both)
```

## Quick Start
1) From the repository root:
```bash
npm run install-all
```

2) Start both backend (port 3001) and frontend (port 3000):
```bash
npm run dev
```

3) Open http://localhost:3000. Upload an Excel file (.xlsx). Default sheet name is **Mapping Corrugates**.
   The backend parses the workbook in memory and returns metrics, including top suppliers for 2023/2024,
   payment terms distribution, contract status, recyclability, recycled content, FSC %, and a regulations map
   (expects a sheet named **Global_Packaging_Regulations**).

> No persistence: data is processed per upload and kept in memory only.

## UI Stack
- Tailwind CSS for styling
- Framer Motion for micro-interactions/entrances
- lucide-react for icons
