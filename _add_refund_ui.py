import sys

with open('src/components/management/sales/sale-details-dialog.tsx', 'r') as f:
    content = f.read()

# Replace Imports
old_imports = """import { Calendar, CreditCard, Download, FileText, Loader2, MapPin, Package, Printer, Store, User } from "lucide-react"
import { useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"
import { toast } from "sonner"
import { TicketTemplate } from "../../sales/ticket-template"

interface SaleDetailsDialogProps {"""

new_imports = """import { AlertCircle, Calendar, CreditCard, Download, FileText, Loader2, MapPin, Package, Printer, Store, User, XCircle } from "lucide-react"
import { useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"
import { toast } from "sonner"
import { TicketTemplate } from "../../sales/ticket-template"
import { Textarea } from "@/components/ui/textarea"

interface SaleDetailsDialogProps {"""

# Replace State and Handlers
old_state = """    const [isDownloading, setIsDownloading] = useState(false)

    const canEditPayment = ['REJECTED'].includes(sale.paymentStatus)"""

new_state = """    const [isDownloading, setIsDownloading] = useState(false)
    const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
    const [refundReason, setRefundReason] = useState("")
    const [isRefunding, setIsRefunding] = useState(false)

    const handleRefund = async () => {
        if (!refundReason.trim()) {
            toast.error("El motivo de anulación es requerido")
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
            toast.error(error.response?.data?.message || "Error al anular venta")
        } finally {
            setIsRefunding(false)
        }
    }

    const canEditPayment = ['REJECTED'].includes(sale.paymentStatus)"""

old_select = """                                                <SelectItem value="PENDING">PENDIENTE</SelectItem>
                                                <SelectItem value="PAID">PAGADO</SelectItem>
                                                <SelectItem value="CANCELLED">CANCELADO</SelectItem>
                                                <SelectItem value="REJECTED">RECHAZADO</SelectItem>
                                            </SelectContent>
                                        </Select>"""

new_select = """                                                <SelectItem value="PENDING">PENDIENTE</SelectItem>
                                                <SelectItem value="PAID">PAGADO</SelectItem>
                                                <SelectItem value="REJECTED">RECHAZADO</SelectItem>
                                            </SelectContent>
                                        </Select>"""

old_button = """                                {sale.mpPaymentId && (
                                    <div className="pt-2 border-t border-border border-dashed mt-2">
                                        <Label className="text-[10px] uppercase text-amber-600 font-bold">ID Transacción MP</Label>
                                        <p className="text-xs font-mono bg-amber-50 dark:bg-amber-900/10 p-1.5 rounded border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 mt-1 select-all">
                                            {sale.mpPaymentId}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>"""

new_button = """                                {sale.mpPaymentId && (
                                    <div className="pt-2 border-t border-border border-dashed mt-2">
                                        <Label className="text-[10px] uppercase text-amber-600 font-bold">ID Transacción MP</Label>
                                        <p className="text-xs font-mono bg-amber-50 dark:bg-amber-900/10 p-1.5 rounded border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 mt-1 select-all">
                                            {sale.mpPaymentId}
                                        </p>
                                    </div>
                                )}
                                
                                {['PAID', 'SHIPPED', 'DELIVERED'].includes(sale.paymentStatus) && (
                                    <div className="pt-4 mt-2">
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
                        </div>"""

old_return = """    return (
        <Dialog open={open} onOpenChange={(val) => !val && onOpenChange(false)}>"""

new_return = """    return (
        <>
        <Dialog open={open} onOpenChange={(val) => !val && onOpenChange(false)}>"""

old_end = """        </Dialog>
    )
}"""

new_end = """        </Dialog>

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
}"""

content = content.replace(old_imports, new_imports)
content = content.replace(old_state, new_state)
content = content.replace(old_select, new_select)
content = content.replace(old_button, new_button)
content = content.replace(old_return, new_return)
content = content.replace(old_end, new_end)

with open('src/components/management/sales/sale-details-dialog.tsx', 'w') as f:
    f.write(content)
print("SUCCESS: sale-details-dialog.tsx")
