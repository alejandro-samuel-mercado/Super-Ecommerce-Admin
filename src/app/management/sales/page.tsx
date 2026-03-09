"use client"

import { SaleDetailsDialog } from '@/components/management/sales/sale-details-dialog'
import { SalesTable } from '@/components/management/sales/sales-table'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { exportToCSV } from '@/lib/export-utils'
import { SalesAPI } from '@/services/api'
import { useBranchStore } from '@/store/branch.store'
import { useAuthStore } from '@/store/use-auth-store'
import { Sale } from '@/types/schema'
import { format } from 'date-fns'
import { Banknote, Download, Loader2, Plus, RefreshCw } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'

export default function SalesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center italic opacity-50">Cargando módulo de ventas...</div>}>
            <SalesPageContent />
        </Suspense>
    )
}

function SalesPageContent() {
    const searchParams = useSearchParams()
    const saleIdParam = searchParams.get('saleId')
    const { user } = useAuthStore()
    const { activeBranch } = useBranchStore()
    const userRole = user?.role?.name || ''
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
    const [sales, setSales] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    const [currentTab, setCurrentTab] = useState('real')

    const loadSales = useCallback(async () => {
        if (!activeBranch) return
        
        setLoading(true)
        try {
            const params: any = { branchId: activeBranch.id }
            if (currentTab === 'abandoned') {
                params.isAbandoned = 'true'
            } else if (currentTab === 'pending') {
                params.isPendingPayment = 'true'
            } else if (currentTab === 'cancelled') {
                params.isCancelled = 'true'
            } else {
                params.isAbandoned = 'false'
            }
            
            const response = await SalesAPI.getAll(params)
            setSales(response.data || [])
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar las ventas.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [activeBranch, currentTab, toast])

    useEffect(() => {
        loadSales()
    }, [loadSales])

    useEffect(() => {
        if (saleIdParam && activeBranch) {
            const fetchOne = async () => {
                try {
                    const id = parseInt(saleIdParam)
                    if (isNaN(id)) return
                    const sale = await SalesAPI.getOne(id)
                    if (sale) {
                        setSelectedSale(sale)
                        // Limpiar el parámetro de la URL sin recargar para que no se reabra si se cierra
                        const url = new URL(window.location.href)
                        url.searchParams.delete('saleId')
                        window.history.replaceState({}, '', url)
                    }
                } catch (error) {
                   
                }
            }
            fetchOne()
        }
    }, [saleIdParam, activeBranch])

    const handleView = (sale: Sale) => {
        setSelectedSale(sale)
    }

    const handleExport = () => {
        const dataToExport = sales.map(sale => ({
            ID: sale.id,
            Fecha: format(new Date(sale.createdAt || new Date()), "dd/MM/yyyy HH:mm"),
            Cliente: (sale as any).user?.name || "Desconocido",
            Total: `${sale.currencyCode || ''} ${Number(sale.total).toLocaleString()}`,
            Metodo_Pago: sale.paymentType,
            Estado_Pago: sale.paymentStatus,
            Tipo_Entrega: sale.deliveryType,
            Articulos: (sale as any).items?.length || 0
        }))

        exportToCSV(dataToExport, "ventas")

        toast({
            title: "Exportación exitosa",
            description: `Se han exportado ${sales.length} ventas.`
        })
    }

    return (
        <div className="sm:p-8 pt-2 space-y-6 pb-40 sm:pb-20">
             <Breadcrumb className="px-2">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/management">Inicio</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                     <BreadcrumbItem>
                        <BreadcrumbLink>Ventas</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col sm:flex-row gap-6 sm:gap-0 items-center justify-between px-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Banknote className="h-6 w-6" />
                        Gestión de Ventas
                    </h1>
                    <p className="text-muted-foreground">Administra el historial de ventas y transacciones.</p>
                </div>
                <div className="flex items-center gap-2">
                     <Button 
                        variant="outline" 
                        onClick={handleExport} 
                        disabled={loading || sales.length === 0}
                        className="rounded-xl border-slate-300 dark:border-zinc-800 hover:cursor-pointer"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Exportar CSV</span>
                    </Button>
                     <Button 
                        variant="outline" 
                        onClick={loadSales} 
                        disabled={loading} 
                        title="Recargar Ventas"
                        className="rounded-xl border-slate-300 dark:border-zinc-800 hover:cursor-pointer"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="ml-2 hidden sm:inline">Actualizar</span>
                    </Button>
                     {userRole !== 'EMPLOYEE' && (
                        <Button onClick={() => window.location.href = '/sales'} className="bg-secondary hover:bg-secondary/90 shadow-sm text-secondary-foreground hover:cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" /> Nueva Venta
                        </Button>
                     )}
                </div>
            </div>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full  ">
                <TabsList className="grid w-full sm:grid-cols-4 grid-cols-1 sm:max-w-[800px] max-w-[300px] mx-auto sm:mx-0 rounded-xl gap-4 mb-48 sm:mb-0">
                    <TabsTrigger value="real" className="border-2 border-gray-300 data-[state=active]:bg-secondary/30 data-[state=active]:border-secondary/70 rounded-lg">Confirmadas</TabsTrigger>
                    <TabsTrigger value="pending" className="border-2 border-gray-300 data-[state=active]:bg-secondary/30 data-[state=active]:border-secondary/70 rounded-lg px-4">Pendientes Pago</TabsTrigger>
                    <TabsTrigger value="abandoned" className="border-2 border-gray-300 data-[state=active]:bg-secondary/30 data-[state=active]:border-secondary/70 rounded-lg px-4">Abandonadas</TabsTrigger>
                    <TabsTrigger value="cancelled" className="border-2 border-gray-300 data-[state=active]:bg-secondary/30 data-[state=active]:border-secondary/70 rounded-lg">Canceladas</TabsTrigger>
                </TabsList>

                <TabsContent value="real" className="mt-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                            <p className="text-muted-foreground">Cargando ventas...</p>
                        </div>
                    ) : (
                        <SalesTable 
                            data={sales}
                            onView={handleView}
                        />
                    )}
                </TabsContent>

                <TabsContent value="pending" className="mt-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                            <p className="text-muted-foreground">Cargando pendientes de pago...</p>
                        </div>
                    ) : (
                        <SalesTable 
                            data={sales}
                            onView={handleView}
                        />
                    )}
                </TabsContent>

                <TabsContent value="abandoned" className="mt-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                            <p className="text-muted-foreground">Buscando abandonos...</p>
                        </div>
                    ) : (
                        <SalesTable 
                            data={sales}
                            onView={handleView}
                        />
                    )}
                </TabsContent>

                <TabsContent value="cancelled" className="mt-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                            <p className="text-muted-foreground">Cargando canceladas...</p>
                        </div>
                    ) : (
                        <SalesTable 
                            data={sales}
                            onView={handleView}
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/*  Modal de Detalles de Venta */}
            {selectedSale && (
                <SaleDetailsDialog 
                    sale={selectedSale} 
                    open={!!selectedSale} 
                    onOpenChange={(open) => !open && setSelectedSale(null)} 
                    onSaleUpdated={loadSales}
                />
            )}
        </div>
    )
}
