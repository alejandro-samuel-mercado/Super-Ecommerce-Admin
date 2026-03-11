"use client"

import { useAuthStore } from "@/store/use-auth-store"
import { Loader2, ShieldAlert } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRoles?: string[]
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
    const { isAuthenticated, user} = useAuthStore()
    const router = useRouter()
    const pathname = usePathname()
    const [hydrated, setHydrated] = useState(false)

    useEffect(() => {
        setTimeout(() => setHydrated(true), 0)
    }, [])

    const userRole = user?.role?.name || ''
    const isAuthorized = !requiredRoles || (userRole && requiredRoles.includes(userRole))

    useEffect(() => {
        if (hydrated && !isAuthenticated) {
            const returnUrl = encodeURIComponent(pathname)
            router.replace(`/login?returnUrl=${returnUrl}`)
        }
    }, [isAuthenticated, hydrated, router, pathname])

    // 1. Estado de Carga Inicial (Antes de la Hidratación)
    if (!hydrated) {
         return (
             <div className="fixed inset-0 w-full flex flex-col items-center justify-center bg-background text-foreground gap-4 z-[100] overflow-hidden">
                 <Loader2 className="h-12 w-12 animate-spin text-secondary" />
                 <p className="text-muted-foreground font-medium animate-pulse">Verificando sesión...</p>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null 
    }

    if (!isAuthorized) {
        return (
            <div className="fixed inset-0 w-full flex flex-col items-center justify-center bg-background text-foreground gap-4 z-[100]">
                 <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-2">
                    <ShieldAlert className="w-12 h-12" />
                 </div>
                 <h1 className="text-3xl font-bold">Acceso Denegado</h1>
                 <p className="text-muted-foreground text-center max-w-md">
                     No tienes los permisos necesarios para acceder a esta sección.
                     <br />
                     Rol actual: <span className="font-mono bg-muted px-2 py-1 rounded text-sm mt-1 inline-block">{userRole}</span>
                 </p>
            </div>
        )
    }

    return <>{children}</>
}
