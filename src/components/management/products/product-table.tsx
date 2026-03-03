"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Product } from "@/types/schema"
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowUpDown, Boxes, Edit, Search, Settings2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { SkuManager } from "./sku-manager"

interface ProductTableProps {
    data: Product[]
    onEdit: (product: Product) => void
    onDelete: (product: Product) => void
    onSelectionChange?: (selectedIds: number[]) => void
}

export function ProductTable({ data, onEdit, onDelete, onSelectionChange }: ProductTableProps) {
    const router = useRouter()
    const [sorting, setSorting] = useState<any>([])
    const [columnFilters, setColumnFilters] = useState<any>([])
    const [rowSelection, setRowSelection] = useState({})
    
    const columns: ColumnDef<Product>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "images",
            header: "Imagen",
            cell: ({ row }) => {
                const img = row.original.images?.[0]
                return (
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-muted border border-border flex items-center justify-center">
                        {img ? (
                            <img src={img} alt={row.getValue("name")} className="h-full w-full object-cover" />
                        ) : (
                            <div className="text-xs text-muted-foreground">N/A</div>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:cursor-pointer">
                        Producto
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div>
                    <div className="font-bold text-foreground">{row.getValue("name")}</div>
                    <div className="text-xs text-muted-foreground">SKU: {row.original.skus?.[0]?.code || 'N/A'}</div>
                </div>
            )
        },
        {
            accessorKey: "brand",
            header: "Marca/Modelo",
            cell: ({ row }) => (
                <div className="text-sm">
                    <span className="font-medium text-foreground">{row.original.brand || '-'}</span>
                    {row.original.model && <span className="text-muted-foreground ml-1">/ {row.original.model}</span>}
                </div>
            )
        },
        {
            accessorKey: "basePrice",
            header: "Precio Base",
            cell: ({ row }) => <span className="font-medium text-foreground">${row.getValue<number>("basePrice").toLocaleString()}</span>
        },
        {
            accessorKey: "stock",
            header: "Stock",
            cell: ({ row }) => {
               
                const stock = row.original.skus?.reduce((acc, sku) => acc + Number(sku.stock), 0) ?? 0
                const unit = row.original.measurementUnit?.toLowerCase() || 'unid.'
                const displayStock = row.original.allowFractional ? stock.toFixed(3).replace(/\.?0+$/, '') : Math.floor(stock)
                
                return (
                    <Badge variant={stock > 0 ? 'outline' : 'destructive'} className={stock > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                        {displayStock} {unit}
                    </Badge>
                )
            }
        },
         {
            accessorKey: "category",
            header: "Categoría",
            cell: ({ row }) => (
                <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80">
                    {(row.getValue("category") as any)?.name}
                </Badge>
            )
        },
        {
            accessorKey: "isActive",
            header: "Estado",
            cell: ({ row }) => {
                const isActive = row.getValue("isActive")
                return (
                    <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-muted text-muted-foreground'}>
                        {isActive ? 'Publicado' : 'Borrador'}
                    </Badge>
                )
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const product = row.original
                return (
                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:cursor-pointer hover:text-foreground">
                                    <span className="sr-only">Abrir menú</span>
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground shadow-xl z-50 min-w-[200px]">
                                <DropdownMenuLabel className="text-muted-foreground uppercase text-xs font-bold tracking-wider px-4 py-2">Acciones</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => onEdit(product)} className="hover:bg-secondary/5 cursor-pointer p-3 text-sm font-medium transition-colors">
                                    <Edit className="mr-3 h-5 w-5 text-secondary" /> Editar Producto
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    setSelectedSkuProduct(product)
                                    setSkuManagerOpen(true)
                                }} className="hover:bg-secondary/5 cursor-pointer p-3 text-sm font-medium transition-colors">
                                    <Boxes className="mr-3 h-5 w-5 text-secondary" /> Gestionar Variantes
                                </DropdownMenuItem>
                                
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
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
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
    })

    useEffect(() => {
        if (onSelectionChange) {
            const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id);
            onSelectionChange(selectedIds);
        }
    }, [rowSelection, onSelectionChange, table])

    const [skuManagerOpen, setSkuManagerOpen] = useState(false)
    const [selectedSkuProduct, setSelectedSkuProduct] = useState<Product | null>(null)

    return (
        <div className="space-y-4">
             
            
            <div className="flex items-center justify-between px-2">
                <div className="relative w-full max-w-sm group ">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary">
                        <Search className="h-4 w-4" />
                    </div>
                    <Input
                        placeholder="Filtrar por nombre..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="pl-10 pr-4 rounded-full shadow-sm w-full bg-gray-200 border-3 border-gray-400/20"
                    />
                </div>
            </div>
            
            <div className="sm:rounded-3xl rounded-none border-4 border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-borderH hover:ring-4 hover:ring-zinc-500/10 transition-all duration-300 bg-card  overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className=" border-border">
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
                                    onClick={() => router.push(`/management/products/${row.original.id}`)}
                                    className="hover:bg-gray-800/20  hover:rounded-2xl    transition-colors border-border cursor-pointer"
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
                                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500 dark:text-slate-400">
                                    No hay resultados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="border-input text-foreground hover:bg-accent hover:text-accent-foreground hover:cursor-pointer"
                >
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="border-input text-foreground hover:bg-accent hover:text-accent-foreground hover:cursor-pointer"
                >
                    Siguiente
                </Button>
            </div>

            {selectedSkuProduct && (
                 <SkuManager 
                    open={skuManagerOpen} 
                    onOpenChange={setSkuManagerOpen} 
                    product={selectedSkuProduct}
                    onUpdate={() => {
                      
                         router.refresh()
                    }} 
                />
            )}
        </div>
    )
}


