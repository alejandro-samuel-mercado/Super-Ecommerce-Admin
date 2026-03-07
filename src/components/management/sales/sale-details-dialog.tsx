"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { SalesAPI } from "@/services/api"
import { useBranchStore } from "@/store/branch.store"
import { Sale } from "@/types/schema"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AlertCircle, Calendar, CreditCard, Download, ExternalLink, Eye, FileText, Loader2, MapPin, Package, Printer, Store, User, XCircle } from "lucide-react"
import Link from "next/link"
import { useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"
import { toast } from "sonner"
import { TicketTemplate } from "../../sales/ticket-template"

interface SaleDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sale: Sale
    onSaleUpdated: () => void
}

export function SaleDetailsDialog({ open, onOpenChange, sale, onSaleUpdated }: SaleDetailsDialogProps) {
    const { activeBranch } = useBranchStore()
    const [loading, setLoading] = useState(false)
    const [paymentStatus, setPaymentStatus] = useState(sale.paymentStatus)
    const [paymentType, setPaymentType] = useState(sale.paymentType)
    const [deliveryStatus, setDeliveryStatus] = useState(sale.deliveryStatus)
    const [deliveryType, setDeliveryType] = useState(sale.deliveryType)

    const ticketRef = useRef<HTMLDivElement>(null);
    const handlePrintTicket = useReactToPrint({
        contentRef: ticketRef,
    });

    const [isDownloading, setIsDownloading] = useState(false)
    const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
    const [refundReason, setRefundReason] = useState("")
    const [isRefunding, setIsRefunding] = useState(false)

    const handleRefund = async () => {
        if (!refundReason.trim()) {
            toast.error("El motivo de anulación es requerido")
            return
        }
        if (!sale.id) {
            toast.error("Venta inválida")
            return
        }
        setIsRefunding(true)
        try {
            await SalesAPI.refund(sale.id, { reason: refundReason })
            toast.success("Venta anulada correctamente. Stock y puntos revertidos.")
            setIsRefundDialogOpen(false)
            setRefundReason("")
            onSaleUpdated()
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Error al anular venta")
        } finally {
            setIsRefunding(false)
        }
    }

    const isAbandoned = sale.paymentStatus === 'PENDING' && 
                        sale.paymentType === 'MERCADO_PAGO' && 
                        !sale.mpPaymentId;

    const canEditPaymentStatus = !isAbandoned && ['REJECTED', 'PENDING'].includes(sale.paymentStatus);
    const canEditPaymentType = !isAbandoned && sale.paymentStatus === 'REJECTED';
    
    const canEditDelivery = !isAbandoned && 
                            sale.deliveryStatus !== 'DELIVERED' && 
                            !['CANCELLED', 'REJECTED'].includes(sale.paymentStatus) &&
                            (sale.paymentStatus === 'PAID' || sale.paymentStatus === 'PENDING' || sale.paymentStatus === 'SHIPPED');

    const handleSave = async () => {
        setLoading(true)
        try {
            const updates: any = {}
            if (paymentStatus !== sale.paymentStatus) updates.paymentStatus = paymentStatus
            if (paymentType !== sale.paymentType) updates.paymentType = paymentType
            if (deliveryStatus !== sale.deliveryStatus) updates.deliveryStatus = deliveryStatus
            if (deliveryType !== sale.deliveryType) updates.deliveryType = deliveryType

            if (Object.keys(updates).length > 0 && sale.id) {
                await SalesAPI.update(sale.id, updates)
                toast.success("Venta actualizada correctamente")
                onSaleUpdated()
                onOpenChange(false)
            } else {
                onOpenChange(false)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al actualizar venta")
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadInvoice = async () => {
        setIsDownloading(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${baseUrl}/api/sales/${sale.id}/invoice`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (!response.ok) throw new Error("Failed to download invoice");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `factura-${sale.uuid || sale.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Factura descargada");
        } catch (error) {
            toast.error("Error al descargar factura");
        } finally {
            setIsDownloading(false);
        }
    };


    return (
        <>
        <Dialog open={open} onOpenChange={(val) => !val && onOpenChange(false)}>
            <DialogContent className="sm:max-w-[800px]  border-4 border-secondary/60 shadow-2xl  text-card-foreground max-h-[90vh] overflow-y-auto  p-4 gap-0">
                
                {/* Header */}
                <div className="bg-muted/30 p-6 border-b border-border">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="sr-only">Detalles de la Venta #{sale.id}</DialogTitle>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Orden</span>
                                    <Badge variant="outline" className="border-border text-foreground font-bold bg-background text-base px-3">
                                        #{sale.id}
                                    </Badge>
                                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                                        {sale.uuid?.substring(0, 13)}...
                                    </span>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground bg-background px-3 py-1 rounded-full border border-border shadow-sm">
                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground/70" />
                                    {sale.createdAt ? format(new Date(sale.createdAt), "dd MMM yyyy, HH:mm", { locale: es }) : "Fecha desconocida"}
                                </div>
                            </div>
                            
                            {/* Employee Info - Prominently displayed */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border border-dashed">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vendedor:</span>
                                    <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                        {sale.employee?.name || 'Venta Web / Anónimo'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Payment Card */}
                        <div className="bg-card p-4 rounded-lg border border-border shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                                <CreditCard size={64} />
                             </div>
                             <div className="flex items-center justify-between mb-3 relative z-10">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <CreditCard size={14} /> Información de Pago
                                </h3>
                                 {(!canEditPaymentStatus && !canEditPaymentType) && <Badge variant="secondary" className="text-[10px] h-5">Bloqueado</Badge>}
                             </div>
                             
                            <div className="space-y-3 relative z-10">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground/70">Estado</Label>
                                         <Select disabled={!canEditPaymentStatus} value={paymentStatus} onValueChange={(v: any) => setPaymentStatus(v)}>
                                            <SelectTrigger className="h-8 text-xs bg-muted/50 border-input">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PENDING">PENDIENTE</SelectItem>
                                                <SelectItem value="PAID">PAGADO</SelectItem>
                                                <SelectItem value="REJECTED">RECHAZADO</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground/70">Método</Label>
                                         <Select disabled={!canEditPaymentType} value={paymentType} onValueChange={(v: any) => setPaymentType(v)}>
                                            <SelectTrigger className="h-8 text-xs bg-muted/50 border-input">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CASH">EFECTIVO</SelectItem>
                                                <SelectItem value="CARD">TARJETA</SelectItem>
                                                <SelectItem value="DEBIT">DEBITO</SelectItem>
                                                <SelectItem value="MERCADO_PAGO">MERCADO PAGO</SelectItem>
                                                <SelectItem value="POINTS">PUNTOS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                
                                { /* Aviso de reembolso manual para estados de cancelación */ }
                                { (paymentStatus === 'CANCELLED' || paymentStatus === 'REJECTED') && (
                                    <div className="mt-2 text-xs p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded flex gap-2 items-start text-amber-800 dark:text-amber-300">
                                        <div className="mt-0.5"> </div>
                                        <div>
                                            <p className="font-semibold uppercase text-[10px] mb-0.5">Cancelación sin reintegro monetario</p>
                                            <p className="opacity-90 leading-tight">Esta acción devolverá el stock y puntos usados, pero <strong className="font-semibold">no reembolsará el dinero automáticamente</strong>. Debes hacerlo manualmente en la pasarela de pagos.</p>
                                        </div>
                                    </div>
                                )}

                                {sale.mpPaymentId && (
                                    <div className="pt-2 border-t border-border border-dashed mt-2">
                                        <Label className="text-[10px] uppercase text-amber-600 font-bold">ID Transacción MP</Label>
                                        <p className="text-xs font-mono bg-amber-50 dark:bg-amber-900/10 p-1.5 rounded border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 mt-1 select-all">
                                            {sale.mpPaymentId}
                                        </p>
                                    </div>
                                )}
                                
                                {['PAID', 'SHIPPED', 'DELIVERED'].includes(sale.paymentStatus) && (
                                    <div className="pt-4 mt-2 hover:cursor-pointer">
                                        <Button 
                                            variant="destructive" 
                                            className="w-full font-bold uppercase py-6 flex items-center gap-2 shadow-lg shadow-red-900/20"
                                            onClick={() => setIsRefundDialogOpen(true)}
                                            type="button"
                                        >
                                            <XCircle size={20} /> Devolución / Anular Venta
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Delivery Card */}
                        <div className="bg-card p-4 rounded-lg border border-border shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                                {deliveryType === 'DELIVERY' ? <MapPin size={64} /> : <Store size={64} />}
                             </div>
                             <div className="flex items-center justify-between mb-3 relative z-10">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    {deliveryType === 'DELIVERY' ? <MapPin size={14} /> : <Store size={14} />} Información de Entrega
                                </h3>
                                {!canEditDelivery && <Badge variant="secondary" className="text-[10px] h-5">Bloqueado</Badge>}
                             </div>
                             
                            <div className="space-y-3 relative z-10">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground/70">Estado</Label>
                                         <Select disabled={!canEditDelivery} value={deliveryStatus} onValueChange={(v: any) => setDeliveryStatus(v)}>
                                            <SelectTrigger className="h-8 text-xs bg-muted/50 border-input">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PENDING_DELIVERY">PENDIENTE</SelectItem>
                                                <SelectItem value="SHIPPED">EN CAMINO</SelectItem>
                                                <SelectItem value="DELIVERED">ENTREGADO</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground/70">Método</Label>
                                         <Select disabled={!canEditDelivery} value={deliveryType} onValueChange={(v: any) => setDeliveryType(v)}>
                                            <SelectTrigger className="h-8 text-xs bg-muted/50 border-input">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PICKUP">RETIRO LOCAL</SelectItem>
                                                <SelectItem value="DELIVERY">ENVIO DOMICILIO</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Payment Proof Card (Admin View) */}
                    {sale.paymentProofUrl && (
                        <div className="bg-card p-4 rounded-lg border border-border shadow-sm mt-4">
                            <div className="flex items-center justify-between mb-3 text-muted-foreground uppercase tracking-wider text-[10px] font-black">
                                <h3 className="flex items-center gap-2">
                                    <FileText size={14} /> Comprobante de Pago
                                </h3>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                                    Recibido
                                </Badge>
                            </div>
                            <div className="space-y-4">
                                <div className="aspect-video relative rounded-md border-2 border-dashed border-border overflow-hidden bg-muted group">
                                    <img 
                                        src={sale.paymentProofUrl} 
                                        alt="Comprobante de pago" 
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            className="font-bold flex gap-2"
                                            onClick={() => window.open(sale.paymentProofUrl!, '_blank')}
                                        >
                                            <Eye size={14} /> Ampliar
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center italic">
                                    Subido el {sale.paymentProofUploadedAt ? format(new Date(sale.paymentProofUploadedAt), "dd/MM/yyyy HH:mm", { locale: es }) : 'desconocido'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 space-y-8">
                     {/* Customer & Address */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                             <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                <User size={14} /> Cliente
                            </h3>
                            <div className="bg-muted/30 p-4 rounded-lg border border-border text-sm">
                                {sale.user ? (
                                    <>
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-bold text-foreground text-base">{sale.user.name}</p>
                                            <Link 
                                                href={`/management/users?search=${sale.user.email}`}
                                                className="text-secondary hover:text-secondary/80 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                                                onClick={() => onOpenChange(false)}
                                            >
                                                Ver Perfil <ExternalLink size={10} />
                                            </Link>
                                        </div>
                                        <p className="text-muted-foreground">{sale.user.email}</p>
                                        <p className="text-muted-foreground mt-2">{sale.user.phone || 'Teléfono no registrado'}</p>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground italic">Consumidor Final / Anónimo</p>
                                )}
                            </div>
                        </div>

                        {sale.deliveryType === 'DELIVERY' && (
                            <div>
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <MapPin size={14} /> Dirección de Envío
                                </h3>
                                <div className="bg-muted/30 p-4 rounded-lg border border-border text-sm">
                                    <p className="font-medium text-foreground mb-1">{sale.deliveryAddress || 'Sin dirección especificada'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Observations */}
                    {sale.observations && (
                        <div className="mt-6">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                <FileText size={14} /> Observaciones
                            </h3>
                            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900/50 text-sm">
                                <p className="text-zinc-700 dark:text-zinc-300 italic">{sale.observations}</p>
                            </div>
                        </div>
                    )}
                    
                    <Separator className="my-6" />

                    {/* Items Table */}
                    <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Package size={14} /> Productos
                        </h3>
                         <div className="rounded-lg border border-border overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-xs uppercase">Producto</th>
                                        <th className="px-4 py-3 font-medium text-center text-xs uppercase">Cant.</th>
                                        <th className="px-4 py-3 font-medium text-right text-xs uppercase">Precio Unit.</th>
                                        <th className="px-4 py-3 font-medium text-right text-xs uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {sale.items?.map((item: any, index: number) => (
                                        <tr key={index} className="hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <Link 
                                                    href={`/management/inventory?search=${item.productName}`}
                                                    className="font-medium text-foreground text-sm hover:text-secondary hover:underline transition-colors flex items-center gap-2 group"
                                                    onClick={() => onOpenChange(false)}
                                                >
                                                    {item.productName}
                                                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                                {item.skuCode && <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono border border-border mt-1">SKU: {item.skuCode}</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center text-muted-foreground">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">{sale.currencyCode} {Number(item.unitPrice).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-bold text-foreground border-l border-border bg-muted/20">{sale.currencyCode} {Number(item.subtotal).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals Breakdown */}
                    <div className="flex flex-col gap-2 ml-auto w-full md:w-1/2">
                        <div className="flex justify-between text-zinc-500 text-sm">
                            <span>Subtotal Productos</span>
                             <span>{sale.currencyCode} {(Number(sale.subtotal) || 0).toLocaleString()}</span>
                        </div>
                        
                        {/* Discount */}
                        {(Number(sale.discount) > 0 || (sale.coupon && sale.coupon !== null)) ? (
                            <div className="flex justify-between text-emerald-600 text-sm font-medium bg-emerald-50 px-2 py-1 rounded">
                                <span>
                                    Descuento {sale.coupon ? `(Cupón: ${sale.coupon.code})` : ''}
                                </span>
                                 <span>-{sale.currencyCode} {Number(sale.discount).toLocaleString()}</span>
                            </div>
                        ) : null}

                         {/* Shipping */}
                         {Number(sale.shippingCost) > 0 ? (
                            <div className="flex justify-between text-zinc-600 dark:text-zinc-400 text-sm bg-zinc-50 px-2 py-1 rounded">
                                <span>Costo de Envío</span>
                                 <span>+{sale.currencyCode} {Number(sale.shippingCost).toLocaleString()}</span>
                            </div>
                        ) : null}
                        
                        <div className="flex justify-between text-2xl font-bold  dark:text-zinc-100 border-t border-zinc-200 dark:border-zinc-800 pt-3 mt-2">
                            <span>Total Final</span>
                             <span>{sale.currencyCode} {(Number(sale.total) || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-muted/30 border-t border-border p-4 flex sm:justify-between items-center w-full">
                    <div className="flex sm:gap-2 gap-12">
                        <Button 
                            variant="outline" 
                            onClick={handlePrintTicket}
                            className="text-muted-foreground hover:bg-background flex gap-2 font-bold border-2 border-secondary/50 hover:cursor-pointer hover:bg-secondary hover:text-white"
                        >
                            <Printer size={16} /> Ticket
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={handleDownloadInvoice}
                            disabled={isDownloading}
                            className="text-secondary hover:bg-secondary hover:text-white  flex gap-2 font-bold border-2 border-secondary/50  hover:cursor-pointer "
                        >
                            {isDownloading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            Factura PDF
                        </Button>
                    </div>
                    <div className="hidden">
                        <TicketTemplate ref={ticketRef} sale={sale} branch={sale.branch || activeBranch} />
                    </div>
                    <div className="flex  hidden sm:block">
                        <Button variant="ghost" className=" text-muted-foreground hover:bg-background flex w-full mb-2  font-bold border-2 border-secondary/50 hover:cursor-pointer hover:bg-secondary hover:text-white" onClick={() => onOpenChange(false)}>Cerrar</Button>
                        {(canEditPaymentStatus || canEditPaymentType || canEditDelivery) && (
                            <Button onClick={handleSave} disabled={loading} className="w-full bg-secondary hover:bg-secondary/90 hover:cursor-pointer  text-white shadow-md">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Guardar Cambios
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Anular Venta #{sale.id}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-foreground">
                        Esta acción cancelará la venta, retornará el stock físico al inventario de la sucursal y revertirá los puntos de fidelidad involucrados en la orden.
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-900/50">
                        <p className="text-xs text-amber-800 dark:text-amber-400 font-bold uppercase mb-1">  Atención Administrativa</p>
                        <p className="text-xs text-amber-700 dark:text-amber-500">
                            El bloqueo de stock se deshará instantáneamente. El dinero deberá ser devuelto manualmente al cliente mediante el portal de cobro pertinente.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-xs uppercase font-bold text-muted-foreground">Motivo de Anulación (Requerido)</Label>
                        <Textarea
                            id="reason"
                            placeholder="Ej. Devolución de producto por garantía, Arrepentimiento de compra..."
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            className="resize-none"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)} disabled={isRefunding}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleRefund} disabled={isRefunding || !refundReason.trim()}>
                        {isRefunding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                        Confirmar Anulación
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}
