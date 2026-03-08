"use client"

import { CartPreviewDialog } from '@/components/management/users/cart-preview-dialog'
import { UserDetails } from '@/components/management/users/user-details'
import { UserForm } from '@/components/management/users/user-form'
import { UserTable } from '@/components/management/users/user-table'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { UsersAPI } from '@/services/api'
import branchService from '@/services/branch.service'
import { useAuthStore } from '@/store/use-auth-store'
import { Branch, User, UserRole } from '@/types/schema'
import { Filter, Loader2, RefreshCw, UsersIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

export default function UsersPage() {
    const searchParams = useSearchParams()
    const roleFilter = searchParams.get('role')

    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [cartUserId, setCartUserId] = useState<number | null>(null)
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined)
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

  
    const { user } = useAuthStore()
    const currentUserRole = (user?.role?.name || 'EMPLOYEE') as UserRole
    const [branches, setBranches] = useState<Branch[]>([])
    const [selectedBranchId, setSelectedBranchId] = useState<string>("all")

    const [users, setUsers] = useState<User[]>([])

    const loadBranches = useCallback(async () => {
        try {
            const data = await branchService.getAll()
            setBranches(data)
        } catch (error) {
        }
    }, [])

    const loadUsers = useCallback(async () => {
        setLoading(true)
        try {
            const response = await UsersAPI.getAll()
            setUsers(response.data || [])
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los usuarios.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadUsers()
        loadBranches()
    }, [loadUsers, loadBranches])

    const filteredUsers = useMemo(() => {
        let result = users

        if (roleFilter) {
            result = result.filter(u => u.role?.name === roleFilter)
        }

        if (selectedBranchId && selectedBranchId !== "all") {
            const sId = parseInt(selectedBranchId)
            result = result.filter(u => {
               
                if (u.role?.name === 'SUPER_ADMIN' && (!u.adminBranches || u.adminBranches.length === 0)) return true;

               
                if (u.branchId === sId) return true
                
                if (u.adminBranches?.some((as: any) => as.branchId === sId)) return true
                
             
                if (u.role?.name === 'CUSTOMER' && u.sales?.some(s => s.branchId === sId)) return true

                return false
            })
        }

        return result
    }, [users, roleFilter, selectedBranchId])

    const handleView = (user: User) => {
        setSelectedUser(user)
        setIsDetailsOpen(true)
    }

    const handleEdit = (user: User) => {
        setEditingUser(user && user.id ? user : undefined) 
        setIsFormOpen(true)
    }

    const handleViewCart = (user: User) => {
        setCartUserId(user.id)
        setIsCartOpen(true)
    }

    const handleDelete = async (user: User) => {
        if(confirm(`¿Estás seguro de eliminar a ${user.name}?`)) {
            try {
                await UsersAPI.delete(user.id)
                toast({ title: "Usuario eliminado", description: `El usuario ${user.name} ha sido eliminado.` })
                loadUsers()
            } catch (error: any) {
                const message = error.response?.data?.message || "Error al eliminar usuario"
                toast({ title: "Error", description: message, variant: "destructive" })
            }
        }
    }

    const handleSaveUser = async (data: Partial<User>) => {
        try {
            if (editingUser) {
                 await UsersAPI.update(editingUser.id, data)
                 toast({ title: "Usuario actualizado", description: "Cambios guardados." })
            } else {
                 await UsersAPI.create(data)
                 toast({ title: "Usuario creado", description: "Usuario registrado con éxito." })
            }
            setIsFormOpen(false)
            loadUsers()
        } catch (error: any) {
             const message = error.response?.data?.message || "Error al guardar usuario"
             toast({ title: "Error", description: message, variant: "destructive" })
        }
    }

    const headerInfo = useMemo(() => {
        switch(roleFilter) {
            case 'CUSTOMER':
                return { title: 'Gestión de Clientes', description: 'Administra la base de datos de clientes y sus compras.' }
            case 'EMPLOYEE':
                return { title: 'Gestión de Empleados', description: 'Administra el personal y sus permisos.' }
            case 'ADMIN':
                 return { title: 'Gestión de Administradores', description: 'Administra los usuarios con privilegios elevados.' }
            case 'SUPER_ADMIN':
                 return { title: 'Gestión de Super Admins', description: 'Administra los usuarios con acceso total.' }
            default:
                return { title: 'Gestión de Usuarios', description: 'Administra clientes, empleados y administradores.' }
        }
    }, [roleFilter])

    return (
             <div className="sm:p-8 p-0 pt-2 space-y-6 sm:pb-20 pb-40">
                 {/* Breadcrumbs */}
                 <Breadcrumb className='px-2 '>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/management">Inicio</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                         <BreadcrumbItem>
                            <BreadcrumbLink>{headerInfo.title}</BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
                             <UsersIcon className="h-6 w-6" />
                             {headerInfo.title}
                        </h1>
                        <p className="text-muted-foreground">{headerInfo.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                            <SelectTrigger className="w-full md:w-[250px] bg-background border-input text-foreground">
                                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Filtrar por Branch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las Branches</SelectItem>
                                {branches.map(branch => (
                                    <SelectItem key={branch.id} value={branch.id.toString()}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="outline" onClick={loadUsers} disabled={loading} title="Recargar" className="bg-background hover:bg-muted border-input text-foreground hover:cursor-pointer">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                        <p className="text-muted-foreground">Cargando usuarios...</p>
                    </div>
                ) : (
                    <UserTable 
                        data={filteredUsers}
                        currentUserRole={currentUserRole}
                        currentFilter={roleFilter}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onViewCart={handleViewCart}
                    />
                )}

         
                <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <SheetContent className="w-screen max-w-none sm:max-w-none h-full bg-white p-0" side="right">
                        <SheetTitle className="sr-only">Detalles del Usuario</SheetTitle>
                        {selectedUser && <UserDetails user={selectedUser} onClose={() => setIsDetailsOpen(false)} />}
                    </SheetContent>
                </Sheet>

              
                <UserForm 
                    open={isFormOpen} 
                    onOpenChange={setIsFormOpen} 
                    user={editingUser}
                    currentUserRole={currentUserRole}
                    onSave={handleSaveUser}
                />

                <CartPreviewDialog 
                    userId={cartUserId}
                    open={isCartOpen}
                    onOpenChange={setIsCartOpen}
                />
             </div>
    )
}
