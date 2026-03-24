"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InventoryItem, formatPrice, formatStock } from "@/services/stock-control.service"
import { useConfigStore } from "@/store/config.store"
import { useAuthStore } from "@/store/use-auth-store"
import { UserRole } from "@/types/schema"
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Edit3, Loader2, Settings2, X } from "lucide-react"
import { useState } from "react"
import { BulkEditDialog } from "./bulk-edit-dialog"
import { StockAdjustmentDialog } from "./stock-adjustment-dialog"

interface StockTableProps {
    data: InventoryItem[]
    onRefresh: () => void
    lowThreshold?: number
    criticalThreshold?: number
    pagination?: {
        page: number
        totalPages: number
        onPageChange: (page: number) => void
    }
    loading?: boolean
}

export function StockTable({ 
    data,
    onRefresh,
    lowThreshold,
    criticalThreshold,
    pagination,
    loading
}: StockTableProps) {
    const { user } = useAuthStore()
    const { config } = useConfigStore()
    const currentUserRole = (user?.role?.name || 'EMPLOYEE') as UserRole
    const [sorting, setSorting] = useState<any>([])
    const [columnFilters, setColumnFilters] = useState<any>([])
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [bulkEditOpen, setBulkEditOpen] = useState(false)
    
    const columns: ColumnDef<InventoryItem>[] = [
        {
            id: "select",
            header: ({ table }: { table: any }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Seleccionar todos"
                />
            ),
            cell: ({ row }: { row: any }) => (
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
            cell: ({ row }: { row: any }) => <span className="font-mono text-xs">{row.getValue("skuCode")}</span>
        },
        {
            accessorKey: "productName",
            header: "Producto",
            cell: ({ row }: { row: any }) => {
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
            cell: ({ row }: { row: any }) => {
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
            cell: ({ row }: { row: any }) => {
                const item = row.original
                return (
                    <span className="font-mono">{formatPrice(parseFloat(item.price), item.measurementUnit, config?.baseCurrency || 'USD', config?.currencySymbol)}</span>
                )
            }
        },
        {
            id: "actions",
            header: "Acciones",
            cell: ({ row }: { row: any }) => {
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
    ].filter(col => {
        if (col.id === 'actions' && currentUserRole === 'EMPLOYEE') return false;
        return true;
    })

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
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
        manualPagination: true,
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
                        {currentUserRole !== 'EMPLOYEE' && (
                            <Button
                                size="sm"
                                onClick={() => setBulkEditOpen(true)}
                                className="h-8 gap-1.5 hover:cursor-pointer"
                            >
                                <Edit3 className="h-3.5 w-3.5" />
                                Edición Masiva
                            </Button>
                        )}
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

            <div className="sm:rounded-3xl border-[1px] border-zinc-300 dark:border-zinc-800 shadow-[0_0_20px_rgba(0,0,0,0.02)] hover:shadow-[0_0_30px_rgba(0,0,0,0.04)] hover:border-borderH transition-all duration-300 bg-card overflow-hidden">
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
                    <TableBody className="relative min-h-[200px]">
                        {loading && (
                            <TableRow className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                                <TableCell colSpan={columns.length} className="border-none flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest animate-pulse">Cargando...</p>
                                </TableCell>
                            </TableRow>
                        )}
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={`loading-${i}`} className="border-border">
                                    {columns.map((_, j) => (
                                        <TableCell key={`loading-cell-${j}`} className="h-16">
                                             <div className="h-4 bg-muted animate-pulse rounded w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
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
                                    No hay productos en esta branch.
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

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                    <span className="text-sm text-muted-foreground">
                        Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
