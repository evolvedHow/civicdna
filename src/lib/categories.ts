import type { Category } from "../types";

export const CATEGORY_ORDER: Category[] = [
  "market",
  "social",
  "welfare",
  "global",
  "governance",
];

export const CATEGORY_META: Record<
  Category,
  { label: string; chip: string; accent: string }
> = {
  market: {
    label: "Market Dynamics",
    chip: "bg-teal-50 text-teal-700 ring-teal-200",
    accent: "#0d9488",
  },
  social: {
    label: "Social Fabric",
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    accent: "#4f46e5",
  },
  welfare: {
    label: "Welfare Systems",
    chip: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    accent: "#0891b2",
  },
  global: {
    label: "Global Integration",
    chip: "bg-violet-50 text-violet-700 ring-violet-200",
    accent: "#7c3aed",
  },
  governance: {
    label: "Governance",
    chip: "bg-slate-100 text-slate-700 ring-slate-300",
    accent: "#475569",
  },
};