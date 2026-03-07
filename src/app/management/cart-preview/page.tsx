"use client"

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import api from '@/services/api'
import { Loader2, ShoppingCart, User as UserIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CartPreviewPage() {
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')
    const [cart, setCart] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        if (!userId) return

        const fetchCart = async () => {
            try {
                const response = await api.get(`/cart/user/${userId}`)
                setCart(response.data)
            } catch (error) {
                toast({ 
                    title: "Error", 
                    description: "No se pudo cargar el carrito del usuario.", 
                    variant: "destructive" 
                })
            } finally {
                setLoading(false)
            }
        }

        fetchCart()
    }, [userId, toast])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-secondary" />
                <p className="text-muted-foreground text-lg">Cargando carrito...</p>
            </div>
        )
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <ShoppingCart className="h-16 w-16 text-muted-foreground opacity-20" />
                <h2 className="text-2xl font-semibold text-muted-foreground">El carrito está vacío</h2>
            </div>
        )
    }

    const total = cart.items.reduce((acc: number, item: any) => 
        acc + (parseFloat(item.sku.price) * parseFloat(item.quantity)), 0
    )

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-secondary/10 rounded-2xl">
                        <ShoppingCart className="h-8 w-8 text-secondary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Carrito del Cliente</h1>
                        <p className="text-muted-foreground flex items-center gap-1">
                            <UserIcon className="h-4 w-4" /> ID de Usuario: {userId}
                        </p>
                    </div>
                </div>
            </div>

            <Card className="border-2 border-zinc-200 shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-zinc-50 border-b">
                    <CardTitle className="text-xl">Productos Seleccionados</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50/50">
                                <TableHead className="font-bold">Producto</TableHead>
                                <TableHead className="font-bold text-center">Cantidad</TableHead>
                                <TableHead className="font-bold text-right">Precio Unitario</TableHead>
                                <TableHead className="font-bold text-right">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cart.items.map((item: any) => (
                                <TableRow key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <TableCell>
                                        <div className="font-medium">{item.sku.product.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{item.sku.code}</div>
                                        {item.sku.variantOptions?.map((opt: any) => (
                                            <Badge key={opt.id} variant="outline" className="mr-1 mt-1 text-[10px]">
                                                {opt.name}: {opt.value}
                                            </Badge>
                                        ))}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold">
                                        {parseFloat(item.quantity)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        ${parseFloat(item.sku.price).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-secondary">
                                        ${(parseFloat(item.sku.price) * parseFloat(item.quantity)).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Card className="w-full max-w-[300px] border-4 border-secondary/20 shadow-2xl rounded-3xl bg-secondary/5">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium uppercase tracking-wider text-xs">Total Estimado</span>
                            <span className="text-3xl font-black text-secondary">${total.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
