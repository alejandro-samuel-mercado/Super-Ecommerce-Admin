"use client"

import { BannerCarouselManager, ImageField, MarqueeItemManager, SecondaryAdsManager } from '@/components/management/content/web-content-managers'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ConfigAPI } from '@/services/api'
import { BannerSlide, StoreConfig } from '@/types/extended'
import { Layout, Loader2, RefreshCw, Save } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

export default function ContentPage() {
    const [config, setConfig] = useState<Partial<StoreConfig>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { toast } = useToast()



    const loadContent = useCallback(async () => {
        try {
            const data = await ConfigAPI.get()
            if (data) {
                if (typeof data.marqueeText === 'string') {
                    data.marqueeText = [data.marqueeText]
                }
                if (typeof data.bannerImage === 'string') {
                    data.bannerImage = data.bannerImage ? [{ url: data.bannerImage, id: 1 }] : []
                }
                setConfig(data)
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar la configuración de contenido.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadContent()
    }, [loadContent])

    const handleSave = async () => {
        setSaving(true)
        try {
            await ConfigAPI.update(config)
            toast({ title: "Contenido guardado", description: "Los cambios se han aplicado correctamente." })
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar el contenido.", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const isOverridden = config.activeEvent && config.overriddenByEvent;

    return (
        <div className="sm:p-8 pt-2 sm:-ml-2 sm:pl-20 space-y-6 max-w-7xl mx-auto pb-40 sm:pb-20">
             <Breadcrumb className='px-2'>
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/management">Inicio</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Contenido Web</BreadcrumbLink></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex sm:flex-row flex-col gap-3 sm:gap-0 items-center justify-between px-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Layout className="h-6 w-6" />
                        Gestión de Contenido
                    </h1>
                    <p className="text-muted-foreground">Personaliza la apariencia, banners y textos de la tienda.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="hover:cursor-pointer" size="icon" onClick={loadContent} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-secondary hover:bg-secondary/80 text-white shadow-lg shadow-secondary/20 hover:cursor-pointer">
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            {config.activeEvent && (
                <Card className="bg-amber-50 border-amber-200 text-amber-900 border-2">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-amber-100 p-2 rounded-full">
                            <RefreshCw className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-bold underline decoration-amber-300">Evento Activo: {config.activeEvent.name}</p>
                            <p className="text-xs text-amber-700">Algunos contenidos están siendo sobrescritos por el evento actual y no serán visibles en la web aunque los cambies aquí.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
            
            {loading ? (
                 <div className="flex flex-col items-center justify-center h-64 space-y-4">
                     <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                     <p className="text-muted-foreground">Cargando contenido...</p>
                </div>
            ) : (

            <div className="grid gap-6">
                <Card className={isOverridden?.marqueeText ? "opacity-60 grayscale-[0.5]" : ""}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle>Identidad Visual</CardTitle>
                            {isOverridden?.marqueeText && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-amber-200">SOBRESCRITO POR EVENTO</span>}
                        </div>
                        <CardDescription>Logo y elementos globales.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <ImageField 
                                label="Logo URL"
                                value={config.logoUrl || ''}
                                onChange={(val) => setConfig({...config, logoUrl: val})}
                                placeholder="https://..."
                                helpText="Se muestra en el navbar y la factura."
                            />

                            <MarqueeItemManager 
                                items={config.marqueeText as string[] || []}
                                onChange={(items) => setConfig({...config, marqueeText: items})}
                            />
                         </div>
                    </CardContent>
                </Card>

                <Card className={isOverridden?.bannerImage ? "opacity-60 grayscale-[0.5]" : ""}>
                    <CardHeader>
                         <div className="flex justify-between items-start">
                            <CardTitle>Hero Carousel</CardTitle>
                            {isOverridden?.bannerImage && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-amber-200">SOBRESCRITO POR EVENTO</span>}
                        </div>
                        <CardDescription>Configura las imágenes principales de la página de inicio.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BannerCarouselManager 
                            slides={config.bannerImage as BannerSlide[] || []}
                            onChange={(slides) => setConfig({...config, bannerImage: slides})}
                        />
                    </CardContent>
                </Card>

                <Card className={isOverridden?.secondaryAds ? "opacity-60 grayscale-[0.5]" : ""}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle>Anuncios Secundarios</CardTitle>
                            {isOverridden?.secondaryAds && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-amber-200">SOBRESCRITO POR EVENTO</span>}
                        </div>
                        <CardDescription>Banners publicitarios y anuncios rotativos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ImageField 
                                label="Imagen Promo Sidebar"
                                value={config.adImage || ''}
                                onChange={(val) => setConfig({...config, adImage: val})}
                                placeholder="https://..."
                            />
                            
                            <div className="space-y-2">
                                <Label>Texto Promo Sidebar</Label>
                                <Textarea value={config.adText || ''} onChange={(e) => setConfig({...config, adText: e.target.value})} placeholder="Ej: ¡Oferta exclusiva!..." className="resize-none h-[40px] min-h-[90px]" />
                            </div>
                        </div>

                        <Separator />

                        <SecondaryAdsManager 
                            ads={config.secondaryAds as any || []}
                            onChange={(ads) => setConfig({...config, secondaryAds: ads})}
                        />
                    </CardContent>
                </Card>
            </div>
            )}
         </div>
    )
}
