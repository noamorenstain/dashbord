import React from "react";

/** תג סטטוס צבעוני גנרי */
export function Badge({
  text,
  tone = "slate",
}: {
  text: string;
  tone?: "slate" | "green" | "red" | "amber" | "blue";
}) {
  const map = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-brand-100 text-brand-700",
  } as const;
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${map[tone]}`}>
      {text}
    </span>
  );
}

/** תג סטטוס רווחיות: רווחי / מאוזן / הפסד */
export function ProfitStatusBadge({ status }: { status: "profit" | "balanced" | "loss" }) {
  if (status === "profit") return <Badge text="רווחי" tone="green" />;
  if (status === "balanced") return <Badge text="מאוזן" tone="amber" />;
  return <Badge text="בהפסד" tone="red" />;
}

/** תג לסטטוס תשלום של הוצאה */
export function PaymentBadge({ status }: { status: string }) {
  if (status === "שולם") return <Badge text={status} tone="green" />;
  if (status === "לא שולם") return <Badge text={status} tone="red" />;
  if (status.includes("חלקית")) return <Badge text={status} tone="amber" />;
  return <Badge text={status || "—"} tone="slate" />;
}
