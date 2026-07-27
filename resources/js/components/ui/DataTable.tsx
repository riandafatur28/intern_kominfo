import { type ReactNode } from "react";

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps {
  columns: Column[];
  rows: Record<string, unknown>[];
  loading?: boolean;
  emptyText?: string;
  renderCell?: (col: Column, row: Record<string, unknown>) => ReactNode | null;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export default function DataTable({
  columns,
  rows,
  loading = false,
  emptyText = "Tidak ada data",
  renderCell,
}: DataTableProps) {
  if (loading) {
    return (
      <div className="bg-white border border-[#C2C6D8]/50 rounded-xl p-8 text-center text-sm text-[#767676]">
        Loading...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="bg-white border border-[#C2C6D8]/50 rounded-xl p-8 text-center text-sm text-[#767676]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#C2C6D8]/50 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F6FAFF] border-b border-[#C2C6D8]/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 text-left text-xs font-bold text-[#424655] uppercase tracking-[0.6px] ${col.className ?? ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id as string ?? i}
                className="border-b border-[#C2C6D8]/10 last:border-0 hover:bg-gray-50"
              >
                {columns.map((col) => {
                  const custom = renderCell?.(col, row);
                  if (custom !== null && custom !== undefined) {
                    return (
                      <td key={col.key} className="px-6 py-4 text-[#424655]">
                        {custom}
                      </td>
                    );
                  }
                  const val = row[col.key];
                  return (
                    <td key={col.key} className="px-6 py-4 text-[#424655]">
                      {val !== null && val !== undefined ? String(val) : "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
