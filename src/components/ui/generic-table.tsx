"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ColumnDef, ColumnFiltersState, SortingState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Plus, Search } from "lucide-react"
import { useState } from "react"

interface GenericTableProps<T> {
    data: T[]
    columns: ColumnDef<T>[]
    searchKey: string
    onEdit?: (item: T) => void
    onDelete?: (item: T) => void
    onCreate?: () => void
    createText?: string
    search?: string
    onSearchChange?: (val: string) => void
    pagination?: {
        page: number
        totalPages: number
        onPageChange: (page: number) => void
    }
}

export function GenericTable<T>({ 
    data, 
    columns, 
    searchKey, 
    onEdit, 
    onDelete, 
    onCreate, 
    createText = "Crear Nuevo",
    search,
    onSearchChange,
    pagination
}: GenericTableProps<T>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        manualPagination: !!pagination,
        pageCount: pagination?.totalPages,
        state: {
            sorting,
            columnFilters,
        },
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center gap-2">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Buscar por ${searchKey}...`}
                            value={pagination ? (search ?? "") : (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                pagination ? onSearchChange?.(event.target.value) : table.getColumn(searchKey)?.setFilterValue(event.target.value)
                            }
                            className="pl-10 pr-4 rounded-full shadow-sm w-full bg-background border-2 border-border"
                        />
                    </div>
                </div>
                {onCreate && (
                    <Button onClick={onCreate} className="rounded-xl shadow-sm hover:cursor-pointer flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {createText}
                    </Button>
                )}
            </div>
            
            <div className="rounded-2xl border shadow-sm bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="text-muted-foreground font-semibold">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No hay resultados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            
            <div className="flex items-center justify-between py-4 px-2">
                <div className="text-sm text-muted-foreground">
                    {pagination ? (
                        <span>Página {pagination.page} de {pagination.totalPages}</span>
                    ) : (
                        <span>{table.getFilteredRowModel().rows.length} resultados</span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination ? pagination.onPageChange(pagination.page - 1) : table.previousPage()}
                        disabled={pagination ? pagination.page <= 1 : !table.getCanPreviousPage()}
                        className="hover:cursor-pointer disabled:cursor-not-allowed"
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination ? pagination.onPageChange(pagination.page + 1) : table.nextPage()}
                        disabled={pagination ? pagination.page >= pagination.totalPages : !table.getCanNextPage()}
                        className="hover:cursor-pointer disabled:cursor-not-allowed"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    )
}
