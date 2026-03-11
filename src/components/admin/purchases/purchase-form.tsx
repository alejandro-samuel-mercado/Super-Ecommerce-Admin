"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"
import { purchaseService } from "@/services/purchase.service"
import { supplierService } from "@/services/supplier.service"
import { useBranchStore } from "@/store/branch.store"
import { Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

interface PurchaseFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function PurchaseForm({ onSuccess, onCancel }: PurchaseFormProps) {
    const { toast } = useToast()
    const { activeBranch } = useBranchStore()
    
    
    const [supplierId, setSupplierId] = useState<string>("")
    const [notes, setNotes] = useState("")
    const [items, setItems] = useState<any[]>([])
    
    
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [supplierSkus, setSupplierSkus] = useState<any[]>([])
    
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadSuppliers()
    }, [])
    
    useEffect(() => {
        if (supplierId) {
            loadSupplierSkus(parseInt(supplierId))
            setItems([]) 
        } else {
            setSupplierSkus([])
        }
    }, [supplierId])

    const loadSuppliers = async () => {
        try {
            const data = await supplierService.getAll({ active: true })
            setSuppliers(data)
        } catch (error) {
        }
    }
    
    const loadSupplierSkus = async (id: number) => {
        try {
            const data = await supplierService.getById(id)
            setSupplierSkus(data.skus || []) 
        } catch (error) {
        }
    }
    
    const addItem = () => {
        setItems([...items, { skuId: "", quantity: 1, unitPrice: 0 }])
    }
    
    const removeItem = (index: number) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        setItems(newItems)
    }
    
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        
        if (field === 'skuId') {
            const catalogItem = supplierSkus.find(s => s.skuId.toString() === value.toString())
            if (catalogItem) {
                newItems[index].unitPrice = catalogItem.precio_compra_base
            }
        }
        
        setItems(newItems)
    }

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    }

    const isFormValid = () => {
        if (!activeBranch || !supplierId || items.length === 0) return false;
        
        return items.every(item => 
            item.skuId && 
            parseFloat(item.quantity) > 0 && 
            parseFloat(item.unitPrice) > 0
        );
    }

    const handleSubmit = async () => {
        if (!activeBranch) {
           toast({ title: "Selecciona una branch primero", variant: "destructive" })
           return
        }
        if (!supplierId || items.length === 0) {
            toast({ title: "Completa los campos requeridos", variant: "destructive" })
            return
        }

        try {
            setLoading(true)
            await purchaseService.create({
                branchId: activeBranch.id,
                supplierId: parseInt(supplierId),
                notes: notes,
                items: items.map(i => ({
                    skuId: parseInt(i.skuId),
                    quantity: parseFloat(i.quantity),
                    unitPrice: parseFloat(i.unitPrice)
                }))
            })
            
            toast({ title: "Orden de compra creada" })
            if (onSuccess) onSuccess()
        } catch (error: any) {
             toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 w-full ">
            <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Nueva Orden de Compra</h1>
                <p className="text-muted-foreground text-sm">Branch: {activeBranch?.name || 'Seleccionar...'}</p>
            </div>
            
            <div className=" bg-card sm:p-6 p-1 shadow-sm space-y-6  ">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Proveedor</Label>
                        <Select value={supplierId} onValueChange={setSupplierId}>
                            <SelectTrigger className="bg-background border-input">
                                <SelectValue placeholder="Seleccionar Proveedor" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {(Array.isArray(suppliers) ? suppliers : []).map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                        {s.tradeName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Notas / Referencia</Label>
                        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Reposición semanal" className="bg-background border-input" />
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                        <h3 className="font-medium text-foreground">Items de la Orden</h3>
                        <Button variant="outline" size="sm" onClick={addItem} disabled={!supplierId} className="hover:cursor-pointer">
                            <Plus className="h-4 w-4 mr-2" /> Agregar Item
                        </Button>
                    </div>
                    
                    {items.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg bg-muted/50">
                            Selecciona un proveedor y agrega items
                        </div>
                    )}
                    
                    {items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-4 items-end bg-muted/50 p-3 rounded-lg border border-border">
                            <div className="col-span-12 md:col-span-5 space-y-1">
                                <Label className="text-xs text-muted-foreground">Producto</Label>
                                <Select 
                                    value={item.skuId.toString()} 
                                    onValueChange={(val) => updateItem(idx, 'skuId', val)}
                                >
                                    <SelectTrigger className="h-9 bg-background border-input">
                                        <SelectValue placeholder="Producto..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                        {(Array.isArray(supplierSkus) ? supplierSkus : []).map(s => {
                                            const variantText = s.sku.variantOptions?.length > 0 
                                                ? ` (${s.sku.variantOptions.map((v: any) => `${v.name}: ${v.value}`).join(', ')})`
                                                : '';
                                            return (
                                                <SelectItem key={s.skuId} value={s.skuId.toString()}>
                                                    {s.sku.code} - {s.sku.product.name}{variantText}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="col-span-4 md:col-span-2 space-y-1">
                                <Label className="text-xs text-muted-foreground">Cantidad</Label>
                                <Input 
                                    type="number" 
                                    className="h-9 bg-background border-input"
                                    min="0.001"
                                    step="0.001"
                                    value={item.quantity} 
                                    onChange={e => updateItem(idx, 'quantity', e.target.value)} 
                                />
                            </div>
                            
                             <div className="col-span-4 md:col-span-3 space-y-1">
                                <Label className="text-xs text-muted-foreground">Precio Unit. ({items[idx].skuId && supplierSkus.find(s => s.skuId == items[idx].skuId)?.moneda})</Label>
                                <Input 
                                    type="number" 
                                    className="h-9 bg-background border-input"
                                    min="0"
                                    step="0.01"
                                    value={item.unitPrice} 
                                    onChange={e => updateItem(idx, 'unitPrice', e.target.value)} 
                                />
                            </div>

                             <div className="col-span-4 md:col-span-2 flex justify-end">
                                 <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="text-destructive hover:text-destructive hover:cursor-pointer hover:bg-destructive/10 h-9 w-9">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    
                    {items.length > 0 && (
                        <div className="flex justify-end pt-4 border-t border-border">
                            <div className="text-right">
                                <span className="text-muted-foreground text-sm">Total Estimado:</span>
                                <div className="text-2xl font-bold text-foreground">{formatCurrency(calculateTotal())}</div>
                            </div>
                        </div>
                    )}
                </div>
                
                 <div className="flex justify-end gap-3 pt-6">
                    <Button variant="ghost" onClick={() => onCancel && onCancel()}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading || !isFormValid()} className="shadow-sm hover:cursor-pointer">
                        {loading ? "Creando..." : "Generar Orden de Compra"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
