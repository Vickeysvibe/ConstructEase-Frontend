import { useEffect, useState, type ReactNode } from "react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "./Button";
import { EmptyState, ErrorState, LoadingBlock } from "./Display";

export type { ColumnDef };

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** right-aligned tabular numbers */
    numeric?: boolean;
    /** server sort field; makes the header clickable */
    sortKey?: string;
    /** hide below this viewport width (px) */
    hideBelow?: number;
    /** footer cell content */
    footer?: ReactNode;
  }
}

export interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[] | undefined;
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  toolbar?: ReactNode;
  /** server pagination */
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  /** server sorting: "field" or "-field" */
  sort?: string;
  onSortChange?: (sort: string | undefined) => void;
  caption?: string;
  showFooter?: boolean;
}

function useViewportWidth() {
  const [w, setW] = useState(() => (typeof window === "undefined" ? 1200 : window.innerWidth));
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

/** Table with explicit columns, server pagination/sorting, and built-in loading / error / empty states. */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading,
  error,
  onRetry,
  onRowClick,
  empty,
  toolbar,
  page,
  pageSize,
  total,
  onPageChange,
  sort,
  onSortChange,
  caption,
  showFooter,
}: DataTableProps<T>) {
  const width = useViewportWidth();
  const visible = columns.filter((c) => !c.meta?.hideBelow || width >= c.meta.hideBelow);
  const table = useReactTable({ data: data ?? [], columns: visible, getCoreRowModel: getCoreRowModel(), getRowId: (r) => rowKey(r) });

  const sortField = sort?.replace(/^-/, "");
  const sortDesc = sort?.startsWith("-");
  const toggleSort = (key: string) => {
    if (!onSortChange) return;
    if (sortField !== key) onSortChange(key);
    else if (!sortDesc) onSortChange(`-${key}`);
    else onSortChange(undefined);
  };

  let body: ReactNode;
  if (error) body = <div style={{ padding: 16 }}><ErrorState error={error} onRetry={onRetry} /></div>;
  else if (loading && !data) body = <LoadingBlock rows={5} />;
  else if (!data?.length) body = <div style={{ padding: 16 }}>{empty ?? <EmptyState plain title="Nothing here yet" />}</div>;
  else
    body = (
      <div className="ce-table-wrap">
        <table className="ce-table" aria-busy={loading || undefined}>
          {caption && <caption className="ce-visually-hidden">{caption}</caption>}
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const meta = h.column.columnDef.meta;
                  const label = flexRender(h.column.columnDef.header, h.getContext());
                  const active = meta?.sortKey && sortField === meta.sortKey;
                  return (
                    <th
                      key={h.id}
                      className={meta?.numeric ? "num" : undefined}
                      aria-sort={active ? (sortDesc ? "descending" : "ascending") : undefined}
                      style={{ width: h.column.columnDef.size !== 150 ? h.column.columnDef.size : undefined }}
                    >
                      {meta?.sortKey && onSortChange ? (
                        <button onClick={() => toggleSort(meta.sortKey!)}>
                          {label}
                          {active && (sortDesc ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                        </button>
                      ) : (
                        label
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                data-clickable={onRowClick ? "true" : undefined}
                onClick={onRowClick ? (e) => !(e.target as HTMLElement).closest("button,a,input,select,label") && onRowClick(row.original) : undefined}
                onKeyDown={onRowClick ? (e) => e.key === "Enter" && e.currentTarget === e.target && onRowClick(row.original) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={cell.column.columnDef.meta?.numeric ? "num" : undefined}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {showFooter && (
            <tfoot>
              <tr>
                {table.getVisibleLeafColumns().map((c) => (
                  <td key={c.id} className={c.columnDef.meta?.numeric ? "num" : undefined}>
                    {c.columnDef.meta?.footer}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );

  const pages = page && pageSize && total !== undefined ? Math.max(1, Math.ceil(total / pageSize)) : 0;
  return (
    <div className="ce-card">
      {toolbar && <div className="ce-table-toolbar">{toolbar}</div>}
      {body}
      {pages > 1 && onPageChange && (
        <div className="ce-pager">
          <span>
            {(page! - 1) * pageSize! + 1}–{Math.min(page! * pageSize!, total!)} of {total}
          </span>
          <div className="ce-pager__btns">
            <Button size="sm" icon={<ChevronLeft />} disabled={page! <= 1} onClick={() => onPageChange(page! - 1)}>
              Previous
            </Button>
            <Button size="sm" disabled={page! >= pages} onClick={() => onPageChange(page! + 1)}>
              Next <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Debounced search box for table toolbars. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    if (text === value) return;
    const t = setTimeout(() => onChange(text), 300);
    return () => clearTimeout(t);
  }, [text, value, onChange]);
  return (
    <div className="ce-search">
      <Search aria-hidden />
      <input className="ce-input" type="search" value={text} placeholder={placeholder} aria-label={label} onChange={(e) => setText(e.target.value)} />
    </div>
  );
}
