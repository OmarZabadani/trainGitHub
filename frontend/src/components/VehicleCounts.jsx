import React from "react";
import { Car, Bus, Truck, Bike } from "lucide-react";

const items = [
  { key: "car", label: "Cars", Icon: Car, color: "var(--accent)" },
  { key: "bus", label: "Buses", Icon: Bus, color: "var(--yellow)" },
  { key: "truck", label: "Trucks", Icon: Truck, color: "var(--red)" },
  { key: "motorcycle", label: "Motorcycles", Icon: Bike, color: "var(--green)" },
  { key: "bicycle", label: "Bicycles", Icon: Bike, color: "#ffffff" },
];

export default function VehicleCounts({ counts }) {
  return (
    <div className="ce-card p-6" data-testid="vehicle-counts">
      <div className="text-xs font-mono uppercase tracking-[0.18em] text-[color:var(--text-muted)] mb-4">
        Vehicle Classes
      </div>
      <div className="space-y-3">
        {items.map(({ key, label, Icon, color }) => (
          <div
            key={key}
            className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
            data-testid={`count-${key}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 grid place-items-center rounded-md border border-white/10" style={{ background: `${color}10` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <span className="text-sm text-white">{label}</span>
            </div>
            <div className="font-mono text-xl" style={{ color }}>{counts[key] ?? 0}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
