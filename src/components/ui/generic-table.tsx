"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Plus, Search } from "lucide-react"
import { useState } from "react"

interface GenericTableProps<T> {
    data: T[]
    columns: ColumnDef<T>[]
    searchKey?: string
    onEdit?: (item: T) => void
    onDelete?: (item: T) => void
    onCreate?: () => void
    createText?: string
}

export function GenericTable<T>({ data, columns, searchKey, onEdit, onDelete, onCreate, createText = "Crear Nuevo" }: GenericTableProps<T>) {
    const [sorting, setSorting] = useState<any>([])
    const [columnFilters, setColumnFilters] = useState<any>([])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between py-4 px-4 gap-4 sm:gap-0 ">
                <div className="relative w-full max-w-sm group">
                     {searchKey && (
                        <>
                             <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary">
                                <Search className="h-4 w-4" />
                            </div>
                            <Input
                                placeholder="Buscar..."
                                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                                onChange={(event) =>
                                    table.getColumn(searchKey)?.setFilterValue(event.target.value)
                                }
                                className="pl-10 pr-4 rounded-full shadow-sm w-full bg-gray-200 border-3 border-gray-400/20"
                            />
                        </>
                    )}
                </div>
                {onCreate && (
                    <Button onClick={onCreate} className="bg-secondary hover:bg-secondary/80 shadow-sm text-white dark:bg-secondary dark:hover:bg-secondary/80 hover:cursor-pointer">
                         <Plus className="mr-2 h-4 w-4" /> {createText}
                    </Button>
                )}
            </div>
            
            <div className="sm:rounded-3xl border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-borderH hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card  overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-muted/50 border-border">
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
                                    className={`hover:bg-gray-800/20  hover:rounded-2xl  transition-all border-border text-foreground ${onEdit ? 'cursor-pointer' : ''}`}
                                    onClick={() => onEdit && onEdit(row.original)}
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
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                    No hay resultados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
