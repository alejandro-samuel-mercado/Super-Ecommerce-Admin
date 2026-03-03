"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sale } from "@/types/schema"
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowUpDown, FileText, Search } from "lucide-react"
import { useState } from "react"



interface SalesTableProps {
    data: Sale[]
    onView: (sale: Sale) => void
    hideSearch?: boolean
}

export function SalesTable({ data, onView, hideSearch = false }: SalesTableProps) {
    const [sorting, setSorting] = useState<any>([])
    const [columnFilters, setColumnFilters] = useState<any>([])
    
    const columns: ColumnDef<Sale>[] = [
        {
            accessorKey: "id",
            header: "ID Venta",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs">#{row.getValue("id")}</span>
                    {row.original.observations && (
                        <span title="Contiene observaciones">
                            <FileText className="h-3 w-3 text-amber-500" />
                        </span>
                    )}
                </div>
            )
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => {
                return (
                    <Button className="hover:cursor-pointer" variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Fecha
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const date = new Date(row.getValue("createdAt"))
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{format(date, "d MMM yyyy", { locale: es })}</span>
                        <span className="text-xs text-muted-foreground">{format(date, "HH:mm", { locale: es })} hs</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "user",
            header: "Cliente",
            cell: ({ row }) => {
                const user = row.original.user
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{user?.name || "Consumidor Final"}</span>
                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "total",
            header: "Total",
            cell: ({ row }) => <span className="font-bold text-emerald-600">{row.original.currencyCode || ''} {row.getValue<number>("total").toLocaleString()}</span>
        },
        {
            accessorKey: "paymentStatus",
            header: "Estado Pago",
            cell: ({ row }) => {
                const status = row.getValue("paymentStatus") as string
                let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
                let className = ""

                switch (status) {
                    case 'PAID':
                        variant = 'default'
                        className = 'bg-emerald-600 hover:bg-emerald-700'
                        break
                    case 'CANCELLED':
                    case 'REJECTED':
                        variant = 'destructive'
                        className = ''
                        break
                    case 'PENDING':
                    default:
                        variant = 'secondary'
                        className = 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 hover:bg-amber-200 border-amber-200 dark:border-amber-800'
                }

                return (
                     <Badge variant={variant} className={className}>
                        {status==="PAID" ? "Pagada" : status==="CANCELLED" ? "Cancelada" : status==="REJECTED" ? "Rechazada" : "Pendiente"}
                     </Badge>
                )
            }
        },
        {
            accessorKey: "deliveryStatus",
            header: "Estado Entrega",
            cell: ({ row }) => {
                const status = row.getValue("deliveryStatus") as string
                return (
                     <Badge variant="outline" className={
                                status === 'DELIVERED' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 
                                status === 'SHIPPED' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' : 
                                status === 'PENDING_DELIVERY' ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                                'text-muted-foreground'
                             }>
                                {status==="DELIVERED" ? "Entregada" : status==="SHIPPED" ? "Enviada" : status==="PENDING_DELIVERY" ? "Pendiente" : "Cancelada"}
                             </Badge>
                )
            }
        },
        {
            accessorKey: "paymentType",
            header: "Pago",
            cell: ({ row }) => (
                 <span className="text-xs font-medium text-muted-foreground">{row.getValue("paymentType")=== "CASH" ? "Efectivo" : row.getValue("paymentType")=== "TRANSFER" ? "Transferencia" : row.getValue("paymentType")=== "DEBIT" ? "Tarjeta de Débito" : row.getValue("paymentType")=== "CARD" ? "Tarjeta de Crédito" : row.getValue("paymentType")=== "MERCADO_PAGO" ? "Mercado Pago" : row.getValue("paymentType")=== "CHECK" ? "Cheque" : "Otro"}</span>
            )
        },
        {
            accessorKey: "deliveryType",
            header: "Entrega",
            cell: ({ row }) => (
                 <span className="text-xs font-medium text-muted-foreground">{row.getValue("deliveryType")=== "DELIVERY" ? "Entrega" : row.getValue("deliveryType")=== "PICKUP" ? "Retiro" : "Otro"}</span>
            )
        },
        
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
        state: {
            sorting,
            columnFilters,
        },
    })

    return (
        <div className="space-y-4">
            {!hideSearch && (
                <div className="flex items-center justify-between py-4 px-4">
                    <div className="relative w-full max-w-sm group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary">
                            <Search className="h-4 w-4" />
                        </div>
                        <Input 
                            placeholder="Buscar por ID..." 
                            className="pl-10 pr-4 rounded-full shadow-sm w-full bg-gray-200 border-3 border-gray-400/20"
                            value={(table.getColumn("id")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("id")?.setFilterValue(event.target.value)
                            }
                        />
                    </div>
                </div>
            )}
            
            <div className="sm:rounded-3xl border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-borderH hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card overflow-hidden">
                <div className="overflow-x-auto">
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
                                        className="hover:bg-gray-800/20  hover:rounded-2xl    text-foreground transition-colors cursor-pointer border-border"
                                        onClick={() => onView(row.original)}
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
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"    
                    className="hover:cursor-pointer"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm" 
                    className="hover:cursor-pointer"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    )
}
