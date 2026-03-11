"use client"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { CurrenciesAPI } from '@/services/api'
import { PaymentGatewaysAPI } from '@/services/payment.service'
import { GatewayCurrencySupport, PaymentGateway } from '@/types/payment'
import { CreditCard, Globe, Loader2, RefreshCw, Settings2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

export default function GatewayManagementPage() {
    const [gateways, setGateways] = useState<PaymentGateway[]>([])
    const [currencySupport, setCurrencySupport] = useState<GatewayCurrencySupport[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null)
    const [configString, setConfigString] = useState('')
    const { toast } = useToast()

    const [availableCurrencies, setAvailableCurrencies] = useState<any[]>([])
    const currencies = availableCurrencies.map(c => c.code)



    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [gwData, csData, currData] = await Promise.all([
                PaymentGatewaysAPI.getAll(),
                PaymentGatewaysAPI.getCurrencySupport(),
                CurrenciesAPI.getAll(true)
            ])
            setGateways(gwData)
            setCurrencySupport(csData)
            setAvailableCurrencies(currData)
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los datos de pagos.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadData()
    }, [loadData])

    const toggleGateway = async (id: number, isActive: boolean) => {
        try {
            await PaymentGatewaysAPI.update(id, { isActive })
            setGateways(prev => prev.map(g => g.id === id ? { ...g, isActive } : g))
            toast({ title: "Actualizado", description: `Pasarela ${isActive ? 'activada' : 'desactivada'}.` })
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" })
        }
    }

    const handleEditConfig = (gateway: PaymentGateway) => {
        setEditingGateway(gateway)
        setConfigString(JSON.stringify(gateway.config || {}, null, 4))
    }

    const saveConfig = async () => {
        if (!editingGateway) return
        setSaving(true)
        try {
            const config = JSON.parse(configString)
            await PaymentGatewaysAPI.update(editingGateway.id, { config })
            setGateways(prev => prev.map(g => g.id === editingGateway.id ? { ...g, config } : g))
            toast({ title: "Guardado", description: "Configuración actualizada correctamente." })
            setEditingGateway(null)
        } catch (error: any) {
            toast({ 
                title: "Error de Formato", 
                description: "Asegúrate de que el JSON sea válido.", 
                variant: "destructive" 
            })
        } finally {
            setSaving(false)
        }
    }

    const handlePrimaryChange = async (currency: string, gatewayId: string) => {
        try {
            await PaymentGatewaysAPI.updateCurrencySupport({
                currencyCode: currency,
                gatewayId: parseInt(gatewayId)
            })
            
            const csData = await PaymentGatewaysAPI.getCurrencySupport()
            setCurrencySupport(csData)
            
            toast({ title: "Actualizado", description: `Pasarela principal para ${currency} actualizada.` })
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar la configuración de moneda.", variant: "destructive" })
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="sm:p-8 pt-2 space-y-8  pb-40 sm:pb-20">
             <Breadcrumb className="px-2">
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/management">Inicio</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink href="/management/settings">Configuración</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Pasarelas de Pago</BreadcrumbLink></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-0 items-center justify-between top-0  z-10 py-4 px-4 ">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <CreditCard className="h-6 w-6" />
                        Gestión de Pasarelas
                    </h1>
                    <p className="text-muted-foreground">Administra proveedores de pago y monedas soportadas.</p>
                </div>
                <Button onClick={loadData} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4 hover:cursor-pointer" /> Recargar
                </Button>
            </div>

            <Tabs defaultValue="gateways" className="w-full">
                <TabsList className="grid sm:w-full w-[80%] mx-auto sm:mx-0 sm:grid-cols-2 grid-cols-1 mb-6 max-w-md gap-3 sm_mb-0">
                    <TabsTrigger className="border-2 border-secondary/40 hover:border-secondary/40 data-[state=active]:border-secondary/80 data-[state=active]:bg-secondary/30" value="gateways">Pasarelas Disponibles</TabsTrigger>
                    <TabsTrigger className="border-2 border-secondary/40 hover:border-secondary/40 data-[state=active]:border-secondary/80 data-[state=active]:bg-secondary/30" value="currencies">Configuración por Moneda</TabsTrigger>
                </TabsList>

                {/* TAB 1: lista de pasarelas */}
                <TabsContent value="gateways" className="space-y-6">
                    <Card className="rounded-none sm:rounded-3xl">
                        <CardHeader>
                            <CardTitle>Proveedores de Pago</CardTitle>
                            <CardDescription>Activa o desactiva pasarelas globalmente.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                        <TableHead className="text-right">Configuración</TableHead>
                                        <TableHead className="text-right">Activación</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gateways.map(gateway => (
                                        <TableRow key={gateway.id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                {gateway.name}
                                                {gateway.isGlobalFallback && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Principal (Local)</span>}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-xs">{gateway.slug}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${gateway.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {gateway.isActive ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" className="cursor-pointer"
                                                    size="sm" 
                                                    onClick={() => handleEditConfig(gateway)}
                                                >
                                                    <Settings2 className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Switch 
                                                    checked={gateway.isActive}
                                                    onCheckedChange={(c) => toggleGateway(gateway.id, c)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: MATRIZ DE MONEDAS */}
                <TabsContent value="currencies" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" /> Matriz de Monedas
                            </CardTitle>
                            <CardDescription>Define qué pasarela es la PRINCIPAL para cada moneda.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currencies.map(currency => {
                                  
                                    const primarySupport = currencySupport.find(cs => cs.currencyCode === currency && cs.isPrimary);
                                    
                                    return (
                                        <div key={currency} className="p-4 border rounded-xl bg-card shadow-sm space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary">
                                                        {currency.substring(0, 1)}
                                                    </div>
                                                    <span className="font-bold text-lg">{currency}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground uppercase">Pasarela Principal</Label>
                                                <Select 
                                                    value={primarySupport?.gatewayId.toString() || ''} 
                                                    onValueChange={(val) => handlePrimaryChange(currency, val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {gateways.filter(g => g.isActive).map(g => (
                                                            <SelectItem key={g.id} value={g.id.toString()}>
                                                                {g.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            
                                            <div className="text-xs text-muted-foreground">
                                                <p>Los clientes fuera del país del negocio verán las pasarelas Internacionales.</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* CONFIG MODAL */}
            <Dialog open={!!editingGateway} onOpenChange={(open) => !open && setEditingGateway(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Configurar {editingGateway?.name}</DialogTitle>
                        <DialogDescription>
                            Edita las credenciales y parámetros técnicos en formato JSON.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="config-json">Parámetros (JSON)</Label>
                            <Textarea 
                                id="config-json"
                                value={configString}
                                onChange={(e) => setConfigString(e.target.value)}
                                className="font-mono text-sm min-h-[300px]"
                                placeholder='{ "publicKey": "...", "accessToken": "..." }'
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" className="hover:cursor-pointer" onClick={() => setEditingGateway(null)}>Cancelar</Button>
                        <Button onClick={saveConfig} disabled={saving} className="hover:cursor-pointer">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
