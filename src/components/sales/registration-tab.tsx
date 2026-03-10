"use client"

import { cn } from "@/lib/utils"
import { ConfigAPI, CouponsAPI, ProductsAPI, PromosAPI, SalesAPI, ShippingAPI, UsersAPI } from "@/services/api"
import { useBranchStore } from "@/store/branch.store"
import { useCartStore } from "@/store/cart-store"
import { useDataStore } from "@/store/sync-store"
import { Product, SKU } from "@/types/schema"
import Fuse from "fuse.js"
import { Printer, RefreshCcw } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Award, CreditCard, FileText, Loader2, Minus, Plus, Search, Tag, Trash2, Truck, User as UserIcon, UserPlus } from "lucide-react"
import { useReactToPrint } from "react-to-print"
import { toast } from "sonner"
import { Badge } from "../ui/badge"
import { Switch } from "../ui/switch"
import { TicketTemplate } from "./ticket-template"

export function RegistrationTab() {
    const isFractional = (p: Product) => p.allowFractional ?? false;

    const { products, users } = useDataStore()
    const { activeBranch } = useBranchStore()
    

    const { 
        items, addItem, removeItem, updateQuantity, 
        client, setClient, 
        deliveryType, setDeliveryType,
        paymentType, setPaymentType,
        discount, setDiscount,
        shippingCost, setShippingCost, clearCart,
        
 
        storeConfig, setStoreConfig,
        activeEvents, setActiveEvents,
        activeDiscounts, setActiveDiscounts,
        shippingZones, setShippingZones,
        selectedZoneId, setSelectedZoneId,
        
        pointsToUse, setPointsToUse,
        isProcessing, setIsProcessing
    } = useCartStore()

    const [productQuery, setProductQuery] = useState("")
    const [clientQuery, setClientQuery] = useState("")
    const [isQuickSale, setIsQuickSale] = useState(false)
    const [manualTotal, setManualTotal] = useState("")
    const [manualDiscount, setManualDiscount] = useState<number>(0)
    const [couponCode, setCouponCode] = useState("")
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
    const [observations, setObservations] = useState("")
    
    // Estado del Formulario de Usuario Rápido
    const [quickUserOpen, setQuickUserOpen] = useState(false)
    const [quickUserName, setQuickUserName] = useState("")
    const [quickUserPhone, setQuickUserPhone] = useState("")
    const [quickUserDni, setQuickUserDni] = useState("")
    
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)


    const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null)
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false) 
    const [isDelivered, setIsDelivered] = useState(true) 
    const [deliveryAddress, setDeliveryAddress] = useState("")
    const [completedSale, setCompletedSale] = useState<any>(null) 

    const ticketRef = useRef<HTMLDivElement>(null);
    const handlePrintTicket = useReactToPrint({
        contentRef: ticketRef,
    });

   
    const loadPOSData = async () => {
         setIsLoading(true)
         setError(null)
         try {
             const [config, eventsData, discountsData, zonesData, productsData, usersData] = await Promise.all([
                 ConfigAPI.get(),
                 PromosAPI.getEvents(),
                 PromosAPI.getDiscounts(),
                 ShippingAPI.getZones(),
                 ProductsAPI.getAll(),
                 UsersAPI.getAll()
             ]);

             
         
             setStoreConfig(config);
             
           
             if (eventsData?.data) {
                 setActiveEvents(eventsData.data.filter((e: any) => e.active));
             }

        
             if (discountsData?.data) {
                 
                 const validDiscounts = discountsData.data.filter((d: any) => d.active);
                 useCartStore.getState().setActiveDiscounts(validDiscounts);
             } else if (Array.isArray(discountsData)) {
                 useCartStore.getState().setActiveDiscounts(discountsData.filter((d: any) => d.active));
             }
             
            
             if (zonesData) {
                 setShippingZones(zonesData.filter((z: any) => z.active));
             }

             
             if (productsData?.data?.data && Array.isArray(productsData.data.data)) {
                 useDataStore.getState().setProducts(productsData.data.data);
             } 
            
             else if (productsData?.data && Array.isArray(productsData.data)) {
                 useDataStore.getState().setProducts(productsData.data);
             } 
           
             else if (Array.isArray(productsData)) {
                  useDataStore.getState().setProducts(productsData as any);
             }

             if (usersData) {
                 const users = Array.isArray(usersData) ? usersData : (usersData as any).data || [];
                 if (Array.isArray(users)) {
                    useDataStore.getState().setUsers(users);
                 }
             }

         } catch (err: any) {
             setError(err.message || "Error de conexión con el servidor");
         } finally {
             setIsLoading(false)
         }
    }

    // 1. Obtener Configuración Global y Datos al Montar
    useEffect(() => {
        const state = useDataStore.getState();
        if (!Array.isArray(state.products)) {
             useDataStore.setState({ products: [] });
        }
        if (!Array.isArray(state.users)) {
             useDataStore.setState({ users: [] });
        }
        
        loadPOSData();
    }, []);

    // --- LÓGICA DEL ESCÁNER DE CÓDIGO DE BARRAS ---
    useEffect(() => {
        let buffer = "";
        let lastKeyTime = Date.now();

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const currentTime = Date.now();
            const target = e.target as HTMLElement;

           
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

           
            if (currentTime - lastKeyTime > 100) {
                buffer = "";
            }
            lastKeyTime = currentTime;

            if (e.key === 'Enter') {
                if (buffer.length > 0) {
                    handleBarcodeScan(buffer);
                    buffer = "";
                }
            } else if (e.key.length === 1) {
                buffer += e.key;
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    
    }, [products, items]);

    const handleBarcodeScan = (code: string) => {
        
    
        const allSkus: any[] = [];
        if (Array.isArray(products)) {
            products.forEach(p => {
                if (p.skus) {
                    p.skus.forEach(s => allSkus.push({...s, product: p})); 
                }
            });
        }

        const foundSku = allSkus.find(s => s.barcode === code || s.code === code); 

        if (foundSku) {
            toast.success(`🔫 ${foundSku.product.name}`, { duration: 1000 });
           
            handleAddProduct(foundSku.product, foundSku);
        } else {
            toast.error(`Código no encontrado: ${code}`);
          
        }
    };


    const productFuse = useMemo(() => new Fuse(Array.isArray(products) ? products : [], {
        keys: ["name", "skus.code", "brand"],
        threshold: 0.3,
    }), [products])

    const filteredProducts = useMemo(() => {
        if (!products || !Array.isArray(products)) return []
        if (!productQuery) return products.slice(0, 12) 
        return productFuse.search(productQuery).map(r => r.item)
    }, [productQuery, products, productFuse])

    const filteredUsers = useMemo(() => {
        if (!users || !Array.isArray(users)) return []
        if (!clientQuery) return []
        return users.filter(u => 
            u.name.toLowerCase().includes(clientQuery.toLowerCase()) || 
            (u.email && u.email.includes(clientQuery)) ||
            (u.dni && u.dni.includes(clientQuery))
        ).slice(0, 5)
    }, [clientQuery, users])

    const handleCreateQuickUser = async () => {
         if(!quickUserName || !quickUserPhone) {
             toast.error("Por favor completa Nombre y Teléfono");
             return;
         }
         
         const identifier = quickUserDni || quickUserPhone;
         const tempEmail = `cliente.${identifier}@local.pos`; 
         
         const existingLocal = Array.isArray(users) ? users.find(u => u.email === tempEmail || (u.dni && quickUserDni && u.dni === quickUserDni)) : null;
         
         if (existingLocal) {
             setClient(existingLocal);
             setQuickUserOpen(false);
           
             setQuickUserName("");
             setQuickUserPhone("");
             setQuickUserDni("");
             toast(`Cliente existente encontrado: ${existingLocal.name}`);
             return;
         }

         try {
             const res = await UsersAPI.create({
                 name: quickUserName,
                 email: tempEmail,
                 password: identifier, 
                 role: 'CLIENT',
                 phone: quickUserPhone,
                 dni: quickUserDni
             });
             

             // Manejar estructuras típicas de respuesta de express
             // 1. El objeto raíz es el usuario (res.id)
             // 2. res.data es el usuario (res.data.id)
             // 3. res.data.data es el usuario (res.data.data.id) - común en APIs paginadas/envueltas
             
             let newUser = res;
             if (res.data) {
                 newUser = res.data;
                 if (newUser.data) newUser = newUser.data;
             }

             if (!newUser || !newUser.id) {
                 toast.error("Error: El servidor no devolvió un usuario válido.");
                 return;
             }

             // 3. Actualizar Store y Seleccionar
             const currentUsers = useDataStore.getState().users || [];
             useDataStore.getState().setUsers([...currentUsers, newUser]);
             
             setClient(newUser);
             setQuickUserOpen(false);
             toast.success(`Cliente creado y seleccionado: ${newUser.name}`);
         }
       catch (error) {
         toast.error("Error creando usuario: Verifique si ya existe.");
       }
    } 

    const handleSaleSubmit = async () => {
        if (items.length === 0 && !isQuickSale) return;
        
        if (!client && !isQuickSale) {
            toast.error("REGISTRO DENEGADO", { description: "Debes asignar un Cliente a interactuar antes de proceder con la venta." });
            return;
        }

        if (!paymentType) {
            toast.error("MÉTODO DE PAGO REQUERIDO", { description: "Debes seleccionar un método de pago antes de registrar la venta." });
            return;
        }

      
        const zeroItems = items.filter(i => i.quantity <= 0);
        if (zeroItems.length > 0 && !isQuickSale) {
            toast.error("CANTIDADES INVÁLIDAS", { 
                description: `El producto "${zeroItems[0].productName}" tiene cantidad 0. Ajusta la cantidad o quítalo del carrito.` 
            });
            return;
        }
        
        setIsProcessing(true);
        
        // Calcular envío efectivo (manejando la lógica de envío gratis)
        let finalShipping = shippingCost;
        if (deliveryType === 'DELIVERY' && storeConfig?.enableShipping) {
            if (storeConfig.freeShippingThreshold && getSubtotal() >= storeConfig.freeShippingThreshold) {
                finalShipping = 0;
            }
             
             const eventFreeShip = activeEvents.some(e => e.shippingConfig?.type === 'FREE');
             if(eventFreeShip) finalShipping = 0;
        } else if (deliveryType !== 'DELIVERY') {
             finalShipping = 0;
        }

        // Preparar Payload
        const saleData = {
             total: getTotal(),
             subtotal: getSubtotal(),
             discount,
             shippingCost: finalShipping,
             
             items: items.map(i => ({
                 skuId: i.skuId,
                 quantity: i.quantity,
                 unitPrice: i.unitPrice,
                 subtotal: i.subtotal
             })),
             
             clientId: client?.id || null, 
             paymentType,
             deliveryType,
             deliveryAddress: deliveryType === 'DELIVERY' ? deliveryAddress : null,
             shippingZoneId: selectedZoneId || null,
             observations,
             
             // Descuentos
             couponCode: appliedCoupon?.code || null, 
             
          
             manualDiscount: (() => {
                 const { getItemDiscount } = useCartStore.getState();
                 let netItemsTotal = 0;
                 items.forEach(item => {
                     const { amount } = getItemDiscount(item);
                     netItemsTotal += Math.max(0, (item.unitPrice * item.quantity) - amount);
                 });
              
                 let baseForManual = netItemsTotal;
                 if (appliedCoupon) {
                     const couponValue = Number(appliedCoupon.value) || 0;
                     if (appliedCoupon.type === 'PERCENTAGE') baseForManual -= (netItemsTotal * (couponValue / 100));
                     else baseForManual -= couponValue;
                 }
                 return manualDiscount > 0 ? parseFloat((baseForManual * (manualDiscount / 100)).toFixed(2)) : 0;
             })(),
             
             pointsToUse: pointsToUse || 0, 
             
             branchId: activeBranch?.id || 1, 
             
         
             paymentStatus: 'PAID', 
             deliveryStatus: isDelivered ? 'DELIVERED' : 'PENDING_DELIVERY'
        }
        try {
           
              const clientName = client?.name || 'N/A';
              
              const response = await SalesAPI.create(saleData);
         
              let rawData = response?.data || response;
              const saleInfo = rawData.sale ? rawData.sale : rawData;
              
           
              setCompletedSale({ ...saleInfo, clientName });
            
              
              clearCart();
              setObservations("");
              setManualTotal("");
              setIsQuickSale(false);
              setManualDiscount(0);
              setAppliedCoupon(null);
              setCouponCode("");
              setIsDelivered(true);
              setCouponCode("");
              setIsDelivered(true);
              setDeliveryAddress("");
              setPointsToUse(0); 
              await loadPOSData();
        } catch (error: any) {
              
              const errorMessage = error?.response?.data?.message || error?.message || "Error al registrar venta.";
              toast.error(errorMessage);

            
              await loadPOSData();
        } finally {
             setIsProcessing(false);
        }
    }

    const handleAddProduct = (product: Product, sku: SKU) => {

        const existing = items.find(i => i.skuCode === sku.code);
        const currentQty = existing ? existing.quantity : 0;
        const increment = isFractional(product) ? 0 : 1;
        if (currentQty + increment > sku.stock) {
            toast.error(`Stock insuficiente. Disponible: ${Number(sku.stock).toFixed(isFractional(product) ? 3 : 0)}`);
            return;
        }

     
        const realPrice = Number(sku.price);

        addItem({
            productName: product.name,
            skuCode: sku.code,
            unitPrice: realPrice,
            quantity: product.allowFractional ? 0 : 1, 
            subtotal: product.allowFractional ? 0 : realPrice,
            skuId: sku.id,
            tempId: crypto.randomUUID(),
            maxStock: sku.stock,
            categoryId: product.categoryId, 
            productId: product.id,
            brand: product.brand,
            pointsReward: product.pointsReward || 0,
            allowFractional: product.allowFractional,
            measurementUnit: product.measurementUnit
        })
    }

    const getSubtotal = () => {
        const { getItemDiscount } = useCartStore.getState();
        const total = items.reduce((acc, item) => {
            const { amount } = getItemDiscount(item);
            return acc + Math.max(0, (item.unitPrice * item.quantity) - amount);
        }, 0);
        return total;
    }


    const getTotal = () => {
        // 1. Subtotal Bruto de Ítems (sin descuentos - como lo calcula el backend)
        const { getItemDiscount } = useCartStore.getState();
        let grossSubtotal = 0;
        let totalItemEventDiscounts = 0;
        
        items.forEach(item => {
            const itemGross = item.unitPrice * item.quantity;
            const { amount } = getItemDiscount(item);
            grossSubtotal += itemGross;
            totalItemEventDiscounts += amount;
        });

       
        const netItemsTotal = Math.max(0, grossSubtotal - totalItemEventDiscounts);

        // 2. Cálculo de Envío
        let effectiveShipping = 0;
        if (deliveryType === 'DELIVERY' && storeConfig?.enableShipping) {
            effectiveShipping = shippingCost;
            
          
            const threshold = Number(storeConfig.freeShippingThreshold);
            if (threshold > 0 && netItemsTotal >= threshold) {
                 effectiveShipping = 0;
            }
           
             const eventFreeShip = activeEvents.some(e => e.shippingConfig?.type === 'FREE');
             if(eventFreeShip) effectiveShipping = 0;
        }

        // 3. Cupón (Aplicado ÚNICAMENTE sobre el total neto de ítems, no sobre el envío)
        let couponDiscount = 0;
        if (appliedCoupon) {
            const couponValue = Number(appliedCoupon.value) || 0;
            if (appliedCoupon.type === 'PERCENTAGE') {
                couponDiscount = (netItemsTotal * (couponValue / 100));
            } else {
                couponDiscount = Math.min(couponValue, netItemsTotal);
            }
        }

        // 4. Descuento Manual (sobre base posterior a cupón, solo ítems)
        const afterCoupon = Math.max(0, netItemsTotal - couponDiscount);
        const manualDiscountAmount = manualDiscount > 0 ? parseFloat((afterCoupon * (manualDiscount / 100)).toFixed(2)) : 0;

        // 5. Impuestos — misma base que el backend:
        // tax = (grossSubtotal - allDiscounts) * rate
        // "allDiscounts" = itemEventDiscounts + couponDiscount + manualDiscountAmount
        let taxAmount = 0;
        if (storeConfig?.taxRate && Number(storeConfig.taxRate) > 0) {
            const pointsDiscountAmount = (pointsToUse > 0 && storeConfig?.enablePointsRedemption) ? (pointsToUse * (Number(storeConfig.moneyPerPoint) || 0)) : 0;
            const totalAllDiscounts = totalItemEventDiscounts + couponDiscount + manualDiscountAmount + pointsDiscountAmount;
            const taxBase = Math.max(0, grossSubtotal - totalAllDiscounts);
            taxAmount = parseFloat((taxBase * (Number(storeConfig.taxRate) / 100)).toFixed(2));
        }

        let final = afterCoupon - manualDiscountAmount;
        final += effectiveShipping + taxAmount;

        // 6. Canje de Puntos (Se resta del total final con impuestos)
        if (pointsToUse > 0 && storeConfig?.enablePointsRedemption) {
            const moneyPerPoint = Number(storeConfig.moneyPerPoint) || 0;
            const pointsValue = pointsToUse * moneyPerPoint;
            final = Math.max(0, final - pointsValue);
        }

        return Math.max(0, final);
    }

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsValidatingCoupon(true);
        try {
            const res = await CouponsAPI.validate(couponCode, getSubtotal(), client?.id);
            if (res.success) {
                setAppliedCoupon(res.data);
                toast.success(`✅ Cupón "${couponCode}" aplicado con éxito`);
            } else {
                toast.error(res.message || "Cupón inválido");
                setAppliedCoupon(null);
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || "Cupón inválido o expirado";
            toast.error(errorMessage);
            setAppliedCoupon(null);
        } finally {
            setIsValidatingCoupon(false);
        }
    };
    
    const handleRefreshProducts = async () => {
        setIsLoading(true);
        try {
            const productsData = await ProductsAPI.getAll();
            
            // 1. Paginado
            if (productsData?.data?.data && Array.isArray(productsData.data.data)) {
                 useDataStore.getState().setProducts(productsData.data.data);
            } 
            // 2. Simple
            else if (productsData?.data && Array.isArray(productsData.data)) {
                 useDataStore.getState().setProducts(productsData.data);
            } 
            // 3. Directo
            else if (Array.isArray(productsData)) {
                 useDataStore.getState().setProducts(productsData as any);
            } 
        } catch (err) {
            setError("Error al actualizar catálogo");
        } finally {
            setIsLoading(false);
        }
    };

    // Estado de UI Derivado
    const allowedPaymentMethods = ((storeConfig && Array.isArray(storeConfig.enabledPaymentMethods) && storeConfig.enabledPaymentMethods.length > 0) 
        ? storeConfig.enabledPaymentMethods 
        : ['CASH', 'CARD', 'DEBIT', 'TRANSFER', 'MERCADO_PAGO']).filter((m: string) => !['STRIPE', 'PAYPAL'].includes(m.toUpperCase()));
    const shippingEnabled = storeConfig?.enableShipping ?? true;

    const total = isQuickSale && manualTotal ? parseFloat(manualTotal) : getTotal();


    return (
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-screen bg-background ">
            {/* COL IZQUIERDA: Productos y Búsqueda  */}
            <div className="flex flex-col gap-4  h-auto lg:h-[80%]  ">
                <Card className="flex flex-col overflow-hidden border-2 border-border shadow-xl bg-card rounded-xl h-full">
                    <CardHeader className="p-4 py-3 border-b-2 border-border bg-muted/50 rounded-t-xl">
                        <div className="flex justify-between items-center mb-2">
                             <CardTitle className="text-base font-bold text-card-foreground uppercase tracking-tight">Catálogo</CardTitle>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 hover:cursor-pointer"
                                onClick={handleRefreshProducts}
                                title="Actualizar Productos"
                             >
                                <RefreshCcw className={cn("h-4 w-4", isLoading ? "animate-spin" : "")} />
                             </Button>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <Input 
                                placeholder="BUSCAR PRODUCTO..." 
                                className="pl-10 pr-4 font-medium rounded-full shadow-sm transition-all bg-gray-200 border-3 border-gray-400/20"
                                value={productQuery}
                                onChange={(e) => setProductQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-3 bg-muted/30">
                        {isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary z-10000"></div>
                                <p className="text-xs font-bold animate-pulse">CARGANDO SISTEMA...</p>
                            </div>
                        ) : error ? (
                             <div className="h-full flex flex-col items-center justify-center text-red-500 space-y-4 p-4 text-center">
                                <AlertCircle className="w-10 h-10" />
                                <div>
                                    <p className="font-black text-sm uppercase">Error de Conexión</p>
                                    <p className="text-xs text-red-400 mt-1">{error}</p>
                                </div>
                                <Button variant="outline" size="sm" className="border-red-200 hover:bg-red-50 text-red-600 hover:text-black font-bold hover:cursor-pointer" onClick={() => window.location.reload()}>
                                    REINTENTAR
                                </Button>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center p-8 text-zinc-400 text-sm font-medium">
                                {products && products.length > 0 ? "NO SE ENCONTRARON PRODUCTOS" : "CATÁLOGO VACÍO"}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {filteredProducts.map(product => {
                                    const totalStock = product.skus?.reduce((acc, s) => acc + Number(s.stock), 0) || 0;
                                    const hasSkus = product.skus && product.skus.length > 0;
                                    const minPrice = product.skus?.reduce((min, s) => {
                                        return Number(s.price) < min ? Number(s.price) : min;
                                    }, Infinity) || 0;
                                    
                                    if (!hasSkus) return null; 
                                    return (
                                        <div 
                                            key={product.id} 
                                            className="flex flex-col sm:flex-row bg-card p-3 rounded-lg border-2 border-border shadow-sm cursor-pointer hover:border-secondary hover:shadow-lg transition-all group relative overflow-hidden active:scale-[0.98]"
                                            onClick={() => {
                                                if (product.skus && product.skus.length === 1) {
                                                    handleAddProduct(product, product.skus[0]);
                                                } else {
                                                    setSelectedProductForVariants(product);
                                                }
                                            }}
                                        >
                                            {/* Linea de Stock */}
                                            <div className={cn("absolute left-0 top-0 bottom-0 w-2", totalStock > 0 ? "bg-emerald-600" : "bg-red-600")} />
                                            
                                            <div className="flex-1 pl-4">
                                                <h4 className="font-bold text-sm leading-tight text-card-foreground uppercase">{product.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                     {product.brand && <span className="text-[10px] text-muted-foreground font-bold uppercase">{product.brand}</span>}
                                                     <Badge variant="outline" className="text-[10px] h-5 px-1 bg-muted text-muted-foreground border-border font-bold">
                                                        {product.skus!.length > 1 ? `${product.skus!.length} Variantes` : `SKU: ${product.skus![0].code}`}
                                                     </Badge>
                                                     {product.pointsReward > 0 && (
                                                        <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-amber-100 text-amber-700 border-amber-200 font-bold flex gap-1 items-center">
                                                            <Award className="w-3 h-3" /> +{product.pointsReward} Pts
                                                        </Badge>
                                                     )}
                                                </div>
                                            </div>

                                            <div className="text-right pl-4 flex flex-col items-end">
                                                {product.skus!.length === 1 ? (() => {
                                                    const { getItemDiscount } = useCartStore.getState();
                                                    const { amount } = getItemDiscount({ 
                                                        productId: product.id, 
                                                        categoryId: product.categoryId,
                                                        brand: product.brand,
                                                        quantity: 1, 
                                                        subtotal: minPrice 
                                                    } as any);

                                                    if (amount > 0) {
                                                        return (
                                                            <div className="flex flex-col items-end leading-tight">
                                                                <span className="text-[10px] text-muted-foreground line-through decoration-red-500/50">${Number(minPrice).toLocaleString()}</span>
                                                                <span className="font-black text-lg text-emerald-600">${Number(minPrice - amount).toLocaleString()}</span>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <p className="font-black text-lg text-foreground">
                                                            ${Number(minPrice).toLocaleString()}
                                                        </p>
                                                    );
                                                })() : (
                                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Ver precios →</span>
                                                )}
                                                {product.skus!.length === 1 && product.allowFractional && product.measurementUnit && product.measurementUnit !== 'UNIDAD' && (
                                                    <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                                                        /{product.measurementUnit === 'KG' ? 'kg' : product.measurementUnit === 'LITRO' ? 'L' : product.measurementUnit === 'METRO' ? 'm' : product.measurementUnit.toLowerCase()}
                                                    </span>
                                                )}
                                                <p className={cn("text-[10px] font-bold uppercase mt-0.5", totalStock > 0 ? "text-emerald-600" : "text-red-500")}>
                                                    {totalStock > 0 ? `${Number(totalStock).toFixed(isFractional(product) ? 3 : 0)} ${product.measurementUnit === 'KG' ? 'kg' : product.measurementUnit === 'LITRO' ? 'L' : product.measurementUnit === 'METRO' ? 'm' : 'u'} Disp.` : "Sin Stock"}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* COL CENTRAL: Formulario y Configuración */}
            <div className="flex flex-col gap-4 h-auto lg:h-full ">
                {/* Cliente */}
                <Card className="border-2 border-border shadow-md bg-card rounded-xl">
                    <CardHeader className="p-3 py-2 bg-muted/50 border-b-2 border-border flex flex-row items-center justify-between rounded-t-xl">
                        <h3 className="font-bold text-sm flex items-center gap-2 text-foreground uppercase">
                            <UserIcon className="w-5 h-5 text-blue-600" /> Cliente
                        </h3>
                        {client && <Badge variant="default" className="text-xs bg-emerald-600 hover:bg-emerald-700 font-bold">OK</Badge>}
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {!client ? (
                             <div className="relative space-y-3">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    <Input 
                                        placeholder="BUSCAR CLIENTE (DNI, TEL, NOMBRE)..." 
                                        value={clientQuery}
                                        onChange={(e) => setClientQuery(e.target.value)}
                                        className="pl-10 pr-4 h-10 font-medium rounded-full shadow-sm transition-all bg-gray-200 border-3 border-gray-400/20"
                                    />
                                    {/* RESULTADOS DESPLEGABLES */}
                                    {filteredUsers.length > 0 && (
                                        <div className="absolute z-50 w-full bg-popover border-2 border-border rounded-md shadow-xl mt-1 max-h-60 overflow-y-auto">
                                            {filteredUsers.map(u => (
                                                <div 
                                                    key={u.id}
                                                    className="p-3 border-b border-border last:border-0 hover:bg-muted cursor-pointer transition-colors"
                                                    onClick={() => { setClient(u); setClientQuery("") }}
                                                >
                                                    <p className="font-bold text-sm text-foreground">{u.name}</p>
                                                    <p className="text-xs text-muted-foreground flex justify-between font-mono">
                                                        <span>{u.email}</span>
                                                        <span>{u.dni}</span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                     <span className="text-xs text-zinc-500 font-bold">O</span>
                                    <Dialog open={quickUserOpen} onOpenChange={setQuickUserOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="w-full border-2 border-dashed border-blue-400 text-blue-600 hover:bg-blue-50 hover:border-blue-500 font-bold hover:cursor-pointer">
                                                <UserPlus className="w-4 h-4 mr-2" /> NUEVO CLIENTE RÁPIDO
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px] border-2 border-border bg-background shadow-2xl z-50">
                                            <DialogHeader>
                                                <DialogTitle>Nuevo Cliente Rápido</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="name" className="font-bold">Nombre Completo</Label>
                                                    <Input id="name" className="border-2 border-zinc-300" value={quickUserName} onChange={e => setQuickUserName(e.target.value)} placeholder="Ej: Juan Perez" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="phone" className="font-bold">Teléfono (Celular)</Label>
                                                        <Input id="phone" inputMode="tel" className="border-2 border-zinc-300" value={quickUserPhone} onChange={e => setQuickUserPhone(e.target.value)} placeholder="Ej: 1122334455" />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="dni" className="font-bold">DNI (Opcional)</Label>
                                                        <Input id="dni" inputMode="numeric" className="border-2 border-zinc-300" value={quickUserDni} onChange={e => setQuickUserDni(e.target.value)} placeholder="Ej: 30123456" />
                                                    </div>
                                                </div>
                                                <div className="text-xs text-zinc-500 bg-zinc-100 p-3 rounded border border-zinc-200">
                                                    <strong>Credenciales Automáticas:</strong> <br/>
                                                    Email: cliente.[tel/dni]@local.pos <br/>
                                                    Pass: [tel/dni]
                                                </div>
                                                <Button onClick={handleCreateQuickUser} className="w-full font-bold hover:cursor-pointer">Crear y Asignar</Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 dark:border-emerald-700 rounded-lg flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="font-black text-base text-emerald-900 dark:text-emerald-100 uppercase">{client.name}</p>
                                    <p className="text-xs text-emerald-800 dark:text-emerald-400 font-mono mt-1 font-bold">{client.email}</p>
                                    {client.dni && <Badge variant="outline" className="mt-2 text-[10px] border-emerald-600 text-emerald-800 bg-white/50 font-bold">DNI: {client.dni}</Badge>}
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setClient(null)} className="text-red-600 hover:text-red-700 hover:bg-red-100 font-bold border border-red-200 hover:cursor-pointer">QUITAR</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Entrega y Pago */}
                <Card className="border-2 border-border shadow-md bg-card rounded-xl">
                    <CardHeader className="p-3 py-2 bg-muted/50 border-b-2 border-border rounded-t-xl">
                         <h3 className="font-bold text-sm flex items-center gap-2 text-foreground uppercase">
                            <Truck className="w-5 h-5 text-blue-600" /> Venta / Entrega
                        </h3>
                    </CardHeader>
                    <CardContent className="p-4 space-y-6">
                        {/* Selector de Tipo de Entrega */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-zinc-500">Tipo de Entrega</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Button 
                                    variant="outline"
                                    className={cn("h-12 border-2 font-bold hover:cursor-pointer", deliveryType === 'PICKUP' ? "bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/90" : "border-input text-muted-foreground hover:bg-muted")}
                                    onClick={() => {
                                        setDeliveryType('PICKUP');
                                        setShippingCost(0);
                                    }}
                                >
                                    RETIRO LOCAL
                                </Button>
                                {storeConfig?.enableShipping && (
                                    <Button 
                                        variant="outline"
                                        className={cn("h-12 border-2 font-bold hover:cursor-pointer", deliveryType === 'DELIVERY' ? "bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/90" : "border-input text-muted-foreground hover:bg-muted")}
                                        onClick={() => {
                                            setDeliveryType('DELIVERY');
                                            if (selectedZoneId) {
                                                const zone = shippingZones.find(z => z.id == selectedZoneId);
                                                if (zone) setShippingCost(Number(zone.cost));
                                            }
                                        }}
                                    >
                                        ENVÍO DOMICILIO
                                    </Button>
                                )}
                            </div>
                            
                          
                        </div>
                        
                        {/* Detalles de Envío */}
                        {deliveryType === 'DELIVERY' && (
                            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border-2 border-orange-200 dark:border-orange-900/50 space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-orange-900 dark:text-orange-200">ZONA DE ENVÍO</Label>
                                    {shippingZones.length > 0 ? (
                                        <Select 
                                            onValueChange={(val) => setSelectedZoneId(Number(val))} 
                                            value={selectedZoneId?.toString()}
                                        >
                                            <SelectTrigger className="bg-background border-2 border-orange-200 dark:border-orange-800 text-orange-900 font-medium">
                                                <SelectValue placeholder="SELECCIONAR ZONA" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {shippingZones.map(z => (
                                                    <SelectItem key={z.id} value={z.id.toString()}>
                                                        <span className="font-bold">{z.city || z.province || "Zona General"}</span>
                                                        <span className="ml-2 text-zinc-500 font-mono">- ${Number(z.cost)}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="text-xs text-amber-600 flex items-center gap-1 font-bold">
                                            <AlertCircle className="w-3 h-3" /> Sin zonas configuradas
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-orange-900 dark:text-orange-200">DIRECCIÓN EXACTA</Label>
                                    <Input 
                                        value={deliveryAddress}
                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                        placeholder="Calle, Número, Piso..." 
                                        className="bg-background border-2 border-orange-200 dark:border-orange-800 h-9 text-sm font-medium" 
                                    />
                                </div>
                                
                                <div className="flex gap-3 items-end">
                                    <div className="flex-1 space-y-1">
                                         <Label className="text-xs font-bold text-orange-900">COSTO ENVÍO</Label>
                                         <Input 
                                            type="number" 
                                            inputMode="decimal"
                                            value={shippingCost}
                                            onChange={(e) => setShippingCost(Number(e.target.value))}
                                            className="bg-background font-mono font-black border-2 border-orange-200 text-orange-900"
                                        />
                                    </div>
                                    <div className="pb-2 text-xs text-orange-600 font-bold">
                                        {storeConfig?.freeShippingThreshold ? (
                                            getSubtotal() >= storeConfig.freeShippingThreshold 
                                            ? "¡ENVÍO GRATIS!" 
                                            : " "
                                        ) : ''}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Método de Pago */}
                        <div className="space-y-2 pt-2 border-t-2 border-border pt-4">
                             <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                                <CreditCard className="w-4 h-4"/> Forma de Pago
                             </Label>
                             <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {allowedPaymentMethods.map((type: string) => (
                                    <div 
                                        key={type}
                                        className={cn(
                                            "border-2 rounded-lg p-2 text-center text-[10px] md:text-xs cursor-pointer transition-all h-20 flex flex-col items-center justify-center gap-1 font-bold uppercase",
                                            paymentType === type 
                                                ? "border-secondary bg-secondary/10 text-secondary shadow-md scale-105 z-10" 
                                                : "border-border bg-card hover:bg-muted text-muted-foreground hover:border-input"
                                        )}
                                        onClick={() => setPaymentType(type as any)}
                                    >
                                        {(type=='DEBIT' && 'Débito') ||(type=='CASH' && 'Efectivo')||(type=='CARD' && 'Tarjeta') ||(type===  'TRANSFER' &&'Transferencia')|| (type === 'MERCADO_PAGO' ? 'Mercado Pago' : type.replace(/_/g, ' ')) }
                                    </div>
                                ))}
                             </div>
                        </div>
  {/* Switch de Estado de Entrega */}
                            <div className="flex items-center justify-between pt-3 px-1">
                                <Label htmlFor="delivered-switch" className={cn("text-xs font-bold cursor-pointer flex items-center gap-2", isDelivered ? "text-emerald-600" : "text-muted-foreground")}>
                                    <Truck className="w-4 h-4" />
                                    MARCAR COMO ENTREGADO
                                </Label>
                                <Switch 
                                    id="delivered-switch"
                                    checked={isDelivered}
                                    onCheckedChange={setIsDelivered}
                                    className="data-[state=checked]:bg-emerald-500"
                                />
                            </div>
                        {/* Observaciones */}
                        <div className="space-y-2 pt-4 border-t-2 border-border">
                            <Label className="text-xs font-bold text-muted-foreground">OBSERVACIONES</Label>
                           <textarea
  value={observations}
  onChange={(e) => setObservations(e.target.value)}
  placeholder="Nota interna..."
  className="h-25 w-full text-sm bg-muted/50 border-2 border-input p-2 resize-none text-start align-top"
 />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* COL DERECHA: Carrito  */}
           <div className="flex flex-col gap-4 h-auto lg:h-full pb-60 ">
                <Card className="bg-card text-card-foreground shadow-2xl relative overflow-hidden border-4 border-border rounded-xl z-20">
                    {/* Banner de Evento Activo */}
                     {activeEvents.map(event => (
                          <div key={event.id} className="bg-gradient-to-r from-pink-600 to-purple-600 p-3 text-center shadow-lg relative z-10">
                              <p className="text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2">
                                 <Tag className="w-4 h-4 animate-pulse" /> {event.name}
                              </p>
                          </div>
                     ))}
                    
                    <CardContent className="p-6 relative">
                        <div className="space-y-4">
                             {/* Subtotal */}
                             <div className="flex justify-between items-center text-muted-foreground">
                                <span className="text-xs font-bold uppercase">Subtotal</span>
                                <span className="font-mono text-sm">${getSubtotal().toLocaleString()}</span>
                             </div>
                             
                             {/* Envío */}
                             <div className="flex justify-between items-center text-muted-foreground">
                                <span className="text-xs font-bold uppercase">Envío</span>
                                {shippingCost === 0 && deliveryType === 'DELIVERY' ? (
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold border-0">GRATIS</Badge>
                                ) : (
                                    <span className="font-mono text-foreground">${shippingCost.toLocaleString()}</span>
                                )}
                             </div>

                             {/* Impuestos */}
                             {storeConfig?.taxRate && Number(storeConfig.taxRate) > 0 && (
                                 <div className="flex justify-between items-center text-muted-foreground">
                                    <span className="text-xs font-bold uppercase">Impuestos ({storeConfig.taxRate}%)</span>
                                    <span className="font-mono text-foreground">
                                        +${( 
                                            (() => {
                                                const { getItemDiscount } = useCartStore.getState();
                                                let netItemsTotal = 0;
                                                items.forEach(item => {
                                                    const { amount } = getItemDiscount(item);
                                                    netItemsTotal += Math.max(0, item.unitPrice * item.quantity - amount);
                                                });
                                                                                                let finalPreTax = netItemsTotal;
                                                
                                                if (appliedCoupon) {
                                                    const couponValue = Number(appliedCoupon.value) || 0;
                                                    if (appliedCoupon.type === 'PERCENTAGE') finalPreTax -= (netItemsTotal * (couponValue / 100));
                                                    else finalPreTax -= couponValue;
                                                }
                                                 if (manualDiscount > 0) finalPreTax -= (finalPreTax * (manualDiscount / 100));
                                                 const pointsDiscountAmount = (pointsToUse > 0 && storeConfig?.enablePointsRedemption) ? (pointsToUse * (Number(storeConfig.moneyPerPoint) || 0)) : 0;
                                                 finalPreTax -= pointsDiscountAmount;
                                                 
                                                 return Math.max(0, finalPreTax) * (Number(storeConfig.taxRate) / 100);
                                             })()
                                        ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                 </div>
                             )}

                            <div className="space-y-4 pt-4 border-t border-border">
                                {/* ENTRADA DE CUPÓN */}
                                {storeConfig?.enableCoupons !== false && (
                                    <div className="flex gap-2">
                                        <Input 
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="CÓDIGO CUPÓN"
                                            className="bg-input border-input text-foreground uppercase font-bold placeholder:text-muted-foreground h-8 text-xs"
                                            disabled={!!appliedCoupon || isValidatingCoupon || isProcessing}
                                        />
                                        {appliedCoupon ? (
                                            <Button variant="destructive" size="sm" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} disabled={isProcessing} className="hover:cursor-pointer">
                                                X
                                            </Button>
                                        ) : (
                                            <Button 
                                                size="sm" 
                                                onClick={handleApplyCoupon} 
                                                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold h-8 text-xs hover:cursor-pointer"
                                                disabled={isValidatingCoupon || isProcessing || !couponCode}
                                            >
                                                {isValidatingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : "APLICAR"}
                                            </Button>
                                        )}
                                    </div>
                                )}
                                {/* Detalles de Descuentos */}
                                {(activeEvents.length > 0 || appliedCoupon || manualDiscount > 0) && (
                                    <div className="space-y-1 text-xs text-muted-foreground bg-muted p-2 rounded">
                                        {activeEvents.map(e => (
                                            <div key={e.id} className="flex justify-between text-pink-400">
                                                <span>★ {e.name}</span>
                                                <span className="font-bold">EVENTO ACTIVO</span>
                                            </div>
                                        ))}
                                        {appliedCoupon && (
                                            <div className="flex justify-between text-emerald-400">
                                                <span>🎫 CUPÓN: {appliedCoupon.code}</span>
                                                <span>-{appliedCoupon.type === 'PERCENTAGE' ? `${Number(appliedCoupon.value)}%` : `$${Number(appliedCoupon.value)}`}</span>
                                            </div>
                                        )}
                                       
                                    </div>
                                )}
                            
                            {/* CANJE DE PUNTOS */}
                            {client && storeConfig?.enablePoints && (
                                <div className="space-y-3 pt-4 border-t border-border">
                                    <div className="flex justify-between items-center">
                                        <Label className={cn("text-xs font-bold uppercase flex items-center gap-1", storeConfig?.enablePointsRedemption ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground")}>
                                            <Award className="w-3 h-3" /> Puntos Disponibles
                                        </Label>
                                        <span className={cn("font-mono text-sm font-bold", storeConfig?.enablePointsRedemption ? "text-indigo-500 dark:text-indigo-300" : "text-muted-foreground")}>{client.points || 0} pts</span>
                                    </div>
                                    
                                    {storeConfig?.enablePointsRedemption ? (
                                        <div className="flex gap-2 items-end">
                                            <div className="flex-1 space-y-1">
                                                 <Input 
                                                     type="number"
                                                     inputMode="numeric"
                                                     value={pointsToUse > 0 ? pointsToUse : ''}
                                                     onChange={(e) => {
                                                         const val = parseInt(e.target.value) || 0;
                                                       
                                                         const max = client.points || 0;
                                                         setPointsToUse(Math.min(val, max));
                                                     }}
                                                     placeholder="Canjear Puntos..."
                                                     className="bg-input border-input text-foreground font-bold placeholder:text-muted-foreground h-8 text-xs focus-visible:ring-indigo-500"
                                                     disabled={!client.points || client.points <= 0 || isValidatingCoupon || isProcessing}
                                                 />
                                            </div>
                                            <div className="pb-1">
                                                 {pointsToUse > 0 ? (
                                                     <Badge variant="outline" className="text-xs border-indigo-500 text-indigo-400 font-mono">
                                                         -${(pointsToUse * (Number(storeConfig.moneyPerPoint) || 0)).toFixed(2)}
                                                     </Badge>
                                                 ) : (
                                                     <span className="text-[10px] text-muted-foreground">Valor: ${Number(storeConfig?.moneyPerPoint || 0)}/pt</span>
                                                 )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-zinc-600 italic">El canje de puntos está desactivado en la configuración.</p>
                                    )}
                                </div>
                            )}

                            </div>

                        

                             {/* TOTAL FINAL */}
                             <div className="flex justify-between items-end border-t border-border pt-4">
                                <div className="space-y-1 ">
                                    <span className="text-2xl font-bold text-muted-foreground uppercase block ">Total Final</span>
                                   
                                </div>
                                <span className="font-black text-4xl tracking-tighter text-foreground">
                                    ${total.toLocaleString()}
                                </span>
                             </div>
                        </div>
                    </CardContent>
                                        <div className="p-4 bg-muted/50 border-t border-border space-y-3">
                          {storeConfig?.enablePoints && (
                             <div className="flex justify-between items-center text-amber-500 font-bold text-xs px-2">
                                <span className="flex items-center gap-1"><Award className="w-3 h-3" /> PUNTOS A GANAR:</span>
                                <span>+{items.reduce((acc, item) => acc + ((item.pointsReward || 0) * item.quantity), 0)} pts</span>
                             </div>
                          )}
                         <Button 
                            className="w-full font-black text-lg h-14 shadow-orange-500/20 shadow-lg hover:shadow-orange-500/40 hover:scale-[1.02] transition-all bg-orange-600 hover:bg-orange-500 text-white rounded-lg uppercase tracking-wide hover:cursor-pointer" 
                            size="lg" 
                            disabled={items.length === 0 && !isQuickSale}
                            onClick={handleSaleSubmit}
                        >
                            CONFIRMAR VENTA
                        </Button>
                    </div>
                </Card>

                {/* LISTA DEL CARRITO */}
                <Card className="flex-1 flex flex-col overflow-hidden border-2 border-border shadow-lg bg-card rounded-xl min-h-[600px] 2xl:min-h-0">
                     <CardHeader className="p-3 py-2 bg-muted/50 border-b-2 border-border flex flex-row justify-between items-center rounded-t-xl">
                        <h3 className="font-black text-sm text-foreground uppercase tracking-tight">Carrito</h3>
                        <Button variant="ghost" className="h-6 px-2 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-100 font-bold uppercase hover:cursor-pointer" onClick={clearCart}>VACIAR CARRO</Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                        {items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
                                <div className="bg-muted p-6 rounded-full border-2 border-border">
                                    <FileText className="w-10 h-10 text-muted-foreground/50" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-sm text-muted-foreground uppercase">Carrito Vacío</p>
                                    <p className="text-xs text-muted-foreground/80">Escanea o busca productos</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {items.map(item => (
                                    <div key={item.tempId} className="p-3 hover:bg-muted/50 transition-colors group relative pr-10">
                                        <div className="flex justify-between text-sm font-bold text-foreground">
                                            <span className="line-clamp-2 leading-tight flex-1 mr-2">{item.productName}</span>
                                            
                                            {/* Visualización de Precio */}
                                            {(() => {
                                                const { amount } = useCartStore.getState().getItemDiscount(item);
                                                const unitPrice = item.unitPrice;
                                             
                                                const unitDiscount = amount / item.quantity;
                                                const finalUnitPrice = unitPrice - unitDiscount;

                                                if (amount > 0) {
                                                    return (
                                                        <div className="text-right flex flex-col">
                                                            <span className="text-xs text-muted-foreground line-through Decoration-red-500 decoration-2">${(unitPrice * item.quantity).toLocaleString()}</span>
                                                            <span className="font-mono text-lg text-emerald-600">${(finalUnitPrice * item.quantity).toLocaleString()}</span>
                                                        </div>
                                                    )
                                                }
                                                return (
                                                    <div className="text-right flex flex-col items-end">
                                                        <span className="font-mono text-lg">${(unitPrice * item.quantity).toLocaleString()}</span>
                                                        {item.allowFractional && item.measurementUnit && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                ${unitPrice.toLocaleString()}/{item.measurementUnit === 'KG' ? 'kg' : item.measurementUnit === 'LITRO' ? 'L' : item.measurementUnit === 'METRO' ? 'm' : item.measurementUnit.toLowerCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex flex-col items-start gap-1">
                                                 <Badge variant="secondary" className="text-[10px] h-5 bg-muted text-muted-foreground border border-border font-mono">{item.skuCode}</Badge>
                                                 {(() => {
                                                     const { amount, label } = useCartStore.getState().getItemDiscount(item);
                                                     if (amount > 0) return (
                                                         <Badge variant="default" className="text-[10px] h-5 bg-green-600/90 hover:bg-green-600 text-white border-0 flex items-center gap-1">
                                                             <Tag className="w-3 h-3" /> {label || 'Descuento'} (-${amount.toLocaleString()})
                                                         </Badge>
                                                     )
                                                 })()}
                                            </div>
                                            {item.allowFractional ? (
                                                <div className="flex items-center gap-1 bg-background border-2 border-border rounded-md shadow-sm px-2 py-1">
                                                    <Input
                                                        type="number"
                                                        inputMode="decimal"
                                                        value={item.quantity === 0 ? "" : item.quantity}
                                                        onChange={(e) => {
                                                            const raw = e.target.value;
                                                           
                                                            if (raw === '' || raw === '.') return;
                                                            const val = parseFloat(raw);
                                                            if (!isNaN(val) && val >= 0) {
                                                                updateQuantity(item.skuCode, val);
                                                            }
                                                        }}
                                                        placeholder="0.000"
                                                        step="0.001"
                                                        min="0"
                                                        className="h-7 w-20 text-xs font-bold font-mono border-none focus-visible:ring-0 p-0 text-center"
                                                    />
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                        {item.measurementUnit === 'KG' ? 'kg' : item.measurementUnit === 'LITRO' ? 'L' : item.measurementUnit === 'METRO' ? 'm' : item.measurementUnit?.toLowerCase() || 'u'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-0.5 bg-background border-2 border-border rounded-md shadow-sm overflow-hidden">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-none text-muted-foreground hover:bg-muted hover:cursor-pointer" onClick={() => updateQuantity(item.skuCode, item.quantity - 1)}><Minus className="w-3 h-3"/></Button>
                                                    <span className="text-xs w-8 text-center font-bold font-mono bg-muted py-1.5">{item.quantity}</span>
                                                    <Button 
                                                        size="icon" 
                                                        variant="ghost" 
                                                        className="h-7 w-7 rounded-none text-muted-foreground hover:bg-muted hover:cursor-pointer disabled:opacity-30" 
                                                        onClick={() => updateQuantity(item.skuCode, item.quantity + 1)}
                                                        disabled={item.quantity >= item.maxStock}
                                                    >
                                                        <Plus className="w-3 h-3"/>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Botón de Quitar */}
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:cursor-pointer"
                                            onClick={() => removeItem(item.skuCode)}
                                            title="Quitar producto"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    
                </Card>
            </div>
            {/* Diálogo de Selección de Variantes */}
            <Dialog open={!!selectedProductForVariants} onOpenChange={(open) => !open && setSelectedProductForVariants(null)}>
                <DialogContent className="sm:max-w-[600px] bg-background border-2 border-border">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">{selectedProductForVariants?.name}</DialogTitle>
                        <p className="text-muted-foreground text-sm font-medium">Selecciona una variante para agregar al carrito</p>
                    </DialogHeader>

                    <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto">
                        {selectedProductForVariants?.skus?.map(sku => (
                            <div 
                                key={sku.id}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer",
                                    sku.stock > 0 
                                        ? "border-border hover:border-secondary hover:bg-muted"
                                        : "border-destructive/20 bg-destructive/10 opacity-60 cursor-not-allowed"
                                )}
                                onClick={() => {
                                    if (sku.stock > 0) {
                                        handleAddProduct(selectedProductForVariants, sku);
                                        setSelectedProductForVariants(null);
                                    }
                                }}
                            >
                                <div>
                                    <div className="font-bold text-sm flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono bg-muted text-muted-foreground border-border">{sku.code}</Badge>
                                        <span className="uppercase text-foreground">
                                            {sku.variantOptions?.map(a => `${a.name}: ${a.value}`).join(' | ') || 'Estándar'}
                                        </span>
                                    </div>
                                    <p className={cn("text-xs font-bold mt-1", sku.stock > 0 ? "text-emerald-600" : "text-red-500")}>
                                        {sku.stock > 0 ? `${Number(sku.stock).toFixed(selectedProductForVariants?.allowFractional ? 3 : 0)} ${selectedProductForVariants?.measurementUnit === 'KG' ? 'kg' : selectedProductForVariants?.measurementUnit === 'LITRO' ? 'L' : selectedProductForVariants?.measurementUnit === 'METRO' ? 'm' : 'unidades'} disponibles` : "AGOTADO"}
                                    </p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    {(() => {
                                        const realSkuPrice = Number(sku.price);
                                        const { getItemDiscount } = useCartStore.getState();
                                        const { amount } = getItemDiscount({ 
                                            productId: selectedProductForVariants.id, 
                                            categoryId: selectedProductForVariants.categoryId,
                                            brand: selectedProductForVariants.brand,
                                            skuCode: sku.code,
                                            quantity: 1, 
                                            subtotal: realSkuPrice 
                                        } as any);

                                        if (amount > 0) {
                                            return (
                                                <div className="flex flex-col items-end leading-tight mb-1">
                                                    <span className="text-[10px] text-muted-foreground line-through decoration-red-500/50">${realSkuPrice.toLocaleString()}</span>
                                                    <span className="font-black text-lg text-emerald-600">${(realSkuPrice - amount).toLocaleString()}</span>
                                                </div>
                                            );
                                        }
                                        return (
                                            <p className="font-black text-lg text-foreground">
                                                ${realSkuPrice.toLocaleString()}
                                            </p>
                                        );
                                    })()}
                                    {selectedProductForVariants?.allowFractional && selectedProductForVariants?.measurementUnit && selectedProductForVariants?.measurementUnit !== 'UNIDAD' && (
                                        <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                                            /{selectedProductForVariants.measurementUnit === 'KG' ? 'kg' : selectedProductForVariants.measurementUnit === 'LITRO' ? 'L' : selectedProductForVariants.measurementUnit === 'METRO' ? 'm' : selectedProductForVariants.measurementUnit.toLowerCase()}
                                        </span>
                                    )}
                                    <Button size="sm" variant="ghost" className="h-8 text-[10px] bg-secondary/80  font-bold uppercase text-white hover:bg-secondary hover:text-white mt-1 hover:cursor-pointer" disabled={sku.stock <= 0}>
                                        Seleccionar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* SUPERPOSICIÓN DE PROCESAMIENTO */}
            {isProcessing && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <Card className="w-[400px] border-4 border-secondary shadow-2xl bg-background animate-in zoom-in-95 duration-300">
                        <CardContent className="flex flex-col items-center justify-center p-10 space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                                <Loader2 className="w-16 h-16 text-blue-600 animate-spin relative z-10" />
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-black uppercase text-foreground tracking-tight">Procesando Pago</h2>
                                <p className="text-muted-foreground font-bold text-sm">Por favor espere, no cierre la ventana...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Diálogo de Éxito de Venta */}
            <Dialog open={!!completedSale} onOpenChange={(open) => !open && setCompletedSale(null)}>
                <DialogContent className="sm:max-w-md border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-emerald-700 dark:text-emerald-400 text-xl font-black uppercase flex flex-col items-center gap-2">
                             <div className="p-3 bg-emerald-200 dark:bg-emerald-900 rounded-full">
                                <Award className="w-8 h-8 text-emerald-700 dark:text-emerald-400" />
                             </div>
                             ¡Venta Registrada!
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 text-center">
                        <div className="space-y-1">
                             <p className="text-sm font-bold text-muted-foreground uppercase">Cliente</p>
                             <p className="text-lg font-black text-foreground">{completedSale?.clientName || "Consumidor Final"}</p>
                        </div>
                        <div className="space-y-1">
                             <p className="text-sm font-bold text-muted-foreground uppercase">Total Cobrado</p>
                             <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">${Number(completedSale?.total || 0).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                             <p className="text-sm font-bold text-muted-foreground uppercase">Ticket</p>
                             <p className="text-lg font-mono text-foreground">{completedSale?.ticketNumber || completedSale?.receipt?.ticketNumber || "GENERANDO..."}</p>
                        </div>
                        
                        {/* Plantilla de Ticket Oculta para Impresión */}
                        <div className="hidden">
                            {completedSale && (
                                <TicketTemplate 
                                    ref={ticketRef} 
                                    sale={completedSale} 
                                    branch={activeBranch} 
                                />
                            )}
                        </div>

                        <div className="flex gap-3 justify-center mt-4">
                            <Button variant="outline" onClick={() => setCompletedSale(null)} className="font-bold border-2 hover:cursor-pointer">
                                Nueva Venta
                            </Button>
                            <Button onClick={handlePrintTicket} className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-none hover:cursor-pointer">
                                <Printer className="w-4 h-4 mr-2" /> IMPRIMIR TICKET
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
