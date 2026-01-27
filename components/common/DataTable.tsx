"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

export interface TableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
}

export default function DataTable<T extends { id?: string }>({
  columns,
  data,
  onRowClick,
  emptyState
}: DataTableProps<T>) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-dashed border-border-subtle p-6 text-center text-sm text-text-muted">
        {emptyState || "No records found."}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted text-left text-xs uppercase tracking-[0.2em] text-text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={clsx("px-4 py-3", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.id ?? index}
              className={clsx(
                "border-t border-border-subtle transition",
                onRowClick ? "cursor-pointer hover:bg-white/5" : ""
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td key={column.key} className={clsx("px-4 py-3", column.className)}>
                  {column.render ? column.render(row) : (row as Record<string, ReactNode>)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
