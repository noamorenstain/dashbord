import React, { useMemo, useState } from "react";
import { Wrench, AlertCircle, CheckCircle2, Coins } from "lucide-react";
import { useData } from "../data/DataContext";
import { useFilters } from "../context/FilterContext";
import { filterDataSet, maintenanceCost } from "../lib/calculations";
import { fmtEUR, fmtNum, fmtDate } from "../lib/format";
import { KpiCard } from "../components/ui/KpiCard";
import { Card } from "../components/ui/Card";
import { FilterBar } from "../components/FilterBar";
import { DataTable, Column } from "../components/ui/DataTable";
import { Badge } from "../components/ui/StatusBadge";
import { Select } from "../components/ui/Select";
import { Maintenance } from "../data/types";

function statusTone(s: string): "green" | "amber" | "red" | "slate" {
  if (s.includes("טופל")) return "green";
  if (s.includes("בטיפול")) return "amber";
  if (s.includes("פתוח")) return "red";
  return "slate";
}

export function MaintenancePage() {
  const { data } = useData();
  const { filters } = useFilters();
  const base = useMemo(() => filterDataSet(data, filters), [data, filters]);

  const [status, setStatus] = useState("all");
  const statuses = useMemo(() => [...new Set(data.maintenance.map((m) => m.status).filter(Boolean))], [data.maintenance]);
  const rows = useMemo(
    () => base.maintenance.filter((m) => status === "all" || m.status === status)
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
    [base.maintenance, status]
  );

  const open = base.maintenance.filter((m) => m.status.includes("פתוח")).length;
  const done = base.maintenance.filter((m) => m.status.includes("טופל")).length;

  const cols: Column<Maintenance>[] = [
    { key: "propertyId", header: "נכס" },
    { key: "roomNumber", header: "חדר", render: (m) => m.roomNumber ?? "—" },
    { key: "date", header: "תאריך", render: (m) => fmtDate(m.date) },
    { key: "reportBy", header: "דווח ע\"י" },
    { key: "amount", header: "עלות", render: (m) => fmtEUR(m.amount) },
    { key: "status", header: "סטטוס", render: (m) => <Badge text={m.status || "—"} tone={statusTone(m.status)} /> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">תחזוקה ותקלות</h2>
        <p className="text-slate-400 text-sm">דיווחי תקלות ועלויות תיקון (גיליון Maintence)</p>
      </div>
      <FilterBar showPlatform={false} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="סך דיווחים" value={fmtNum(base.maintenance.length)} icon={<Wrench size={20} />} tone="brand" />
        <KpiCard label="תקלות פתוחות" value={fmtNum(open)} icon={<AlertCircle size={20} />} tone="negative" />
        <KpiCard label="טופלו" value={fmtNum(done)} icon={<CheckCircle2 size={20} />} tone="positive" />
        <KpiCard label="עלות תחזוקה כוללת" value={fmtEUR(maintenanceCost(base))} icon={<Coins size={20} />} tone="amber" />
      </div>

      <Card
        title="דיווחי תחזוקה"
        action={<Select label="סטטוס" value={status} options={[{ value: "all", label: "הכול" }, ...statuses.map((s) => ({ value: s, label: s }))]} onChange={setStatus} />}
      >
        <DataTable columns={cols} rows={rows} maxHeight={520} />
      </Card>
    </div>
  );
}
