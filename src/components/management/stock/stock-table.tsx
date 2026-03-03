"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InventoryItem, formatPrice, formatStock } from "@/services/stock-control.service"
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Edit3, Settings2, X } from "lucide-react"
import { useState } from "react"
import { BulkEditDialog } from "./bulk-edit-dialog"
import { StockAdjustmentDialog } from "./stock-adjustment-dialog"

interface StockTableProps {
    data: InventoryItem[]
    onRefresh: () => void
    lowThreshold?: number
    criticalThreshold?: number
}

export function StockTable({ 
    data,
    onRefresh,
    lowThreshold,
    criticalThreshold
}: StockTableProps) {
    const [sorting, setSorting] = useState<any>([])
    const [columnFilters, setColumnFilters] = useState<any>([])
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [bulkEditOpen, setBulkEditOpen] = useState(false)
    
    const columns: ColumnDef<InventoryItem>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value:any) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Seleccionar todos"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value:any) => row.toggleSelected(!!value)}
                    aria-label="Seleccionar fila"
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "skuCode",
            header: "SKU",
            cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("skuCode")}</span>
        },
        {
            accessorKey: "productName",
            header: "Producto",
            cell: ({ row }) => {
                const variant = row.original.variant;
                return (
                    <div className="flex flex-col">
                        <div className="font-medium">
                            {row.getValue("productName")}
                            {variant && <span className="text-muted-foreground font-normal ml-1">({variant})</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">{row.original.categoryName}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "stock",
            header: "Stock",
            cell: ({ row }) => {
                const item = row.original
                const low = lowThreshold ?? item.minStock ?? 10
                const critical = criticalThreshold ?? 5
                
                const isEmpty = item.stock === 0
                const isCritical = !isEmpty && item.stock <= critical
                const isLow = !isEmpty && !isCritical && item.stock <= low
                
                return (
                    <div className="flex items-center gap-1.5">
                        <Badge variant={isEmpty || isCritical ? "destructive" : isLow ? "outline" : "outline"}
                            className={
                                isCritical ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' : 
                                isLow ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' : 
                                ''
                            }>
                            {formatStock(item.stock, item.measurementUnit ?? 'UNIDAD')}
                        </Badge>
                    </div>
                )
            }
        },
        {
            accessorKey: "price",
            header: "Precio",
            cell: ({ row }) => {
                const item = row.original
                return (
                    <span className="font-mono">{formatPrice(parseFloat(item.price), item.measurementUnit)}</span>
                )
            }
        },
        {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => {
                const item = row.original
                return (
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                            setSelectedItem(item)
                            setDialogOpen(true)
                        }}
                        className="h-8 w-8 p-0 hover:cursor-pointer"
                        title="Ajustar Stock"
                    >
                        <Settings2 className="h-4 w-4" />
                    </Button>
                )
            }
        }
    ]

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
    })

    const selectedRows = table.getSelectedRowModel().rows.map(r => r.original)
    const selectedCount = selectedRows.length

    return (
        <div className="space-y-4 pb-40 sm:pb-20">
           
            {selectedCount > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-secondary/10 border border-secondary/30 rounded-xl animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-secondary">
                            {selectedCount} producto(s) seleccionado(s)
                        </span>
                        <Button
                            size="sm"
                            onClick={() => setBulkEditOpen(true)}
                            className="h-8 gap-1.5 hover:cursor-pointer"
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edición Masiva
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => table.resetRowSelection()}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="sm:rounded-3xl border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-borderH hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-muted/50 border-border">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="text-muted-foreground font-semibold">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={`text-foreground transition-colors border-border hover:bg-gray-800/20 hover:rounded-2xl data-[state=selected]:bg-secondary/5 ${row.original.stock <= row.original.minStock ? "bg-destructive/10" : ""}`}
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
                                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                                    No hay productos en esta branch. Asigna stock desde Entrada de Mercadería.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            
            <StockAdjustmentDialog 
                item={selectedItem}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={onRefresh}
            />

            <BulkEditDialog
                open={bulkEditOpen}
                onOpenChange={setBulkEditOpen}
                selectedItems={selectedRows}
                onSuccess={() => {
                    table.resetRowSelection()
                    onRefresh()
                }}
            />

            <div className="flex items-center justify-between space-x-2 py-4">
                <span className="text-sm text-muted-foreground">
                    {selectedCount > 0 ? `${selectedCount} seleccionados · ` : ''}{data.length} productos en total
                </span>
                <div className="flex gap-2">
                    <Button
                        variant="outline" 
                        className="hover:cursor-pointer"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline" 
                        className="hover:cursor-pointer"
                        size="sm" 
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    )
}
