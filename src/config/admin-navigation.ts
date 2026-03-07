
import {
    Archive,
    ArrowLeftRight,
    Bot,
    Calendar,
    CirclePercent,
    DollarSign,
    FileText,
    Globe,
    LayoutDashboard,
    MessageSquare,
    Package,
    PieChart,
    Settings,
    ShoppingCart,
    Store,
    Tags,
    TicketPercent,
    Truck,
    Users
} from "lucide-react"

export interface NavItem {
    title: string
    href?: string
    icon: any
    active?: boolean
    roles: string[]
    hidden?: boolean
    children?: NavItem[]
}

export const adminNavigation: NavItem[] = [
    {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: "/management",
        roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']
    },
    {
        title: "Reportes",
        icon: PieChart,
        href: "/management/reports",
        roles: ['SUPER_ADMIN', 'ADMIN']  
    },
    {
        title: "Sucursales",
        icon: Store,
        href: "/management/settings/branches",
        roles: ['SUPER_ADMIN'],
    },
    {
        title: "Productos",
        icon: Package,
        href: "/management/products",
        roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']
    },
    {
        title: "Usuarios",
        icon: Users,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
        children: [
            {
                title: "Clientes",
                href: "/management/users?role=CUSTOMER",
                icon: Users,
                roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']
            },
            {
                title: "Empleados",
                href: "/management/users?role=EMPLOYEE",
                icon: Users,
                roles: ['SUPER_ADMIN', 'ADMIN']  
            },
            {
                title: "Administradores",
                href: "/management/users?role=ADMIN",
                icon: Users,
                roles: ['SUPER_ADMIN']
            },
            {
                title: "Super Admins",
                href: "/management/users?role=SUPER_ADMIN",
                icon: Users,
                roles: ['SUPER_ADMIN']
            }
        ]
    },
   
    {
        title: "Stock",
        icon: Archive,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
        children: [
            {
                title: "Control",
                icon: Archive,
                href: "/management/stock-control",
                roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
            },
            {
                title: "Movimientos",
                icon: ArrowLeftRight,
                href: "/management/transfers",
                roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
            },
        ]
    },
    {
        title: "Compras",
        icon: Truck,
        roles: ['SUPER_ADMIN', 'ADMIN'], 
        children: [
            {
                title: "Proveedores",
                icon: Users,
                href: "/management/suppliers",
                roles: ['SUPER_ADMIN'],
            },
             {
                title: "Órdenes de Compra",
                icon: FileText, 
                href: "/management/purchases",
                roles: ['SUPER_ADMIN', 'ADMIN'],
            },
            {
                title: "Pagos a Proveedores",
                icon: DollarSign,
                href: "/management/supplier-payments",
                roles: ['SUPER_ADMIN', 'ADMIN'],
            }
        ]
    },
    {
        title: "Ventas",
        icon: ShoppingCart,
        href: "/management/sales",
        roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']
    },
     {
        title: "Administración",
        icon: Settings, 
        roles: ['SUPER_ADMIN', 'ADMIN'], 
        children: [
            {
                title: "Categorías",
                icon: Tags,
                href: "/management/categories",
                roles: ['SUPER_ADMIN', 'ADMIN']
            },
            {
                title: "Cupones",
                icon: TicketPercent,
                href: "/management/coupons",
                roles: ['SUPER_ADMIN', 'ADMIN'] 
            },
            {
                title: "Descuentos",
                icon: CirclePercent,
                href: "/management/discounts",
                roles: ['SUPER_ADMIN', 'ADMIN']  
            },
          
        ]
    },
      {
                title: "Envíos",
                icon: Truck,
                href: "/management/shipping",
                roles: ['SUPER_ADMIN', 'ADMIN'],
            },
            {
                title: "Pasarelas de Pago",
                icon: DollarSign,
                href: "/management/settings/gateways",
                roles: ['SUPER_ADMIN']
            },
    {
        title: "Comentarios",
        icon: MessageSquare,
        href: "/management/comments",
        roles: ['SUPER_ADMIN', 'ADMIN']  
    },
    {
        title: "Eventos",
        icon: Calendar,
        href: "/management/events",
        roles: ['SUPER_ADMIN', 'ADMIN']  
    },
      {
                title: "Asistente Bot",
                href: "/management/bot",
                icon: Bot,
                roles: ['SUPER_ADMIN', 'ADMIN']
            },
              {
                title: "Blog",
                href: "/management/content/blog",
                icon: FileText,
                roles: ['SUPER_ADMIN', 'ADMIN']
            },
    {
        title: "Contenido Web",
        href: "/management/content",
                icon: Globe,
                roles: ['SUPER_ADMIN', 'ADMIN']
    },
    {
        title: "Configuración",
         href: "/management/settings",
                icon: Settings,
        roles: ['SUPER_ADMIN'],
       
    },
]
