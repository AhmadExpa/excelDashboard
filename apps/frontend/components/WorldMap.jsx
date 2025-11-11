import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { useMemo, useState } from 'react';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export default function WorldMap({ regulations = {} }) {
  const [hover, setHover] = useState(null);
  const countriesWithRegs = useMemo(() => new Set(Object.keys(regulations || {})), [regulations]);

  return (
    <div className="relative">
      <ComposableMap projectionConfig={{ scale: 140 }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map(geo => {
              const name = geo.properties.name;
              const has = countriesWithRegs.has(name);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(evt) => {
                    if (!has) return setHover(null);
                    setHover({ x: evt.clientX, y: evt.clientY, name, items: regulations[name] });
                  }}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    default: { fill: has ? '#9ad1ff' : '#EAEAEC', outline: 'none' },
                    hover: { fill: has ? '#63b4ff' : '#d8d8d8', outline: 'none' },
                    pressed: { fill: '#2f9bff', outline: 'none' }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {hover && (
        <div
          className="absolute bg-white border border-slate-200 rounded-xl p-3 shadow-soft pointer-events-none text-sm"
          style={{ top: hover.y + 10, left: hover.x + 10 }}
        >
          <div className="font-semibold mb-1">{hover.name}</div>
          {(hover.items || []).slice(0, 6).map((item, idx) => (
            <div key={idx}>
              {item.type} — <i>{item.status}</i>
            </div>
          ))}
          {(hover.items || []).length > 6 && <div className="opacity-70">…and more</div>}
        </div>
      )}
    </div>
  );
}
