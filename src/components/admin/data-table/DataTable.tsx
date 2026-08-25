"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { SearchInput } from "@/components/ui/search-input";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  page?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  className?: string;
  emptyMessage?: string;
}

function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  pageSize = 10,
  page = 1,
  totalPages,
  totalItems,
  onPageChange,
  className,
  emptyMessage = "No results found.",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  const startEntry =
    totalItems && totalItems > 0
      ? (page - 1) * pageSize + 1
      : 0;

  const endEntry =
    totalItems && totalItems > 0
      ? Math.min(page * pageSize, totalItems)
      : 0;

    
  return (
    <div className={cn("space-y-4 h-full flex flex-col justify-between rounded-2xl", className)}>
      {searchKey && (
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder={searchPlaceholder}
            defaultValue={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onSearch={(value) => table.getColumn(searchKey)?.setFilterValue(value)}
            className="w-full max-w-sm"
          />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl">
        <div className="h-full overflow-x-auto overflow-y-auto overscroll-x-contain">
          <table className="w-full min-w-[720px] table-auto caption-bottom text-sm border-separate border-spacing-0">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="transition-colors">
                  {headerGroup.headers.map((header) => {
                    const isActions =
                      header.column.id.toLowerCase() === "actions" ||
                      header.id.toLowerCase() === "actions";
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "h-14 px-4 text-left align-middle text-xs font-semibold tracking-wider whitespace-nowrap text-[var(--color-neutral-500)] uppercase sm:px-5 bg-[var(--color-neutral-50)] border-b border-gray-200 sticky top-0 z-10",
                          isActions &&
                            "text-right sticky top-0 right-0 z-30 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] border-l border-neutral-200/80 bg-[var(--color-neutral-50)]",
                          header.column.getCanSort() &&
                            "cursor-pointer select-none hover:text-[var(--color-neutral-700)]"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            isActions && "justify-end"
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-gray-300">
                              {header.column.getIsSorted() === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronsUpDown className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="group transition-colors hover:bg-[var(--color-neutral-50)]"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isActions =
                        cell.column.id.toLowerCase() === "actions" ||
                        cell.id.toLowerCase().includes("actions");
                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            "px-4 py-4 align-middle whitespace-nowrap sm:px-5 bg-white group-hover:bg-[var(--color-neutral-50)] transition-colors border-b border-gray-200",
                            isActions &&
                              "text-right [&>div]:justify-end sticky right-0 z-20 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] border-l border-neutral-200/80 bg-white group-hover:bg-[var(--color-neutral-50)]"
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center text-gray-500 bg-white border-b border-gray-200">
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5">
        <p className="text-sm text-[var(--color-neutral-500)]">
          Showing {startEntry}–{endEntry} of {totalItems ?? data.length} entries
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-neutral-300)]",
              "bg-white text-[var(--color-neutral-700)] transition-colors hover:bg-[var(--color-neutral-50)]",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-[var(--color-neutral-700)]">
            {page} / {totalPages ?? 1}
          </span>
          <button
            onClick={() => onPageChange?.(page + 1)}
            disabled={!totalPages || page >= totalPages}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-neutral-300)]",
              "bg-white text-[var(--color-neutral-700)] transition-colors hover:bg-[var(--color-neutral-50)]",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { DataTable };
export type { DataTableProps };
