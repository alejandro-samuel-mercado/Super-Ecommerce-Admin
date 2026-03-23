"use client"

import { useSearchParams } from "next/navigation"
import { ProductDetailsClient } from "@/app/management/products/detail/ProductDetailsClient"
import { Suspense } from "react"

function ProductDetailContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    if (!id) {
        return <div className="p-8 text-center">ID de producto no proporcionado.</div>
    }

    return <ProductDetailsClient id={id} />
}

export default function ProductDetailPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ProductDetailContent />
        </Suspense>
    )
}
