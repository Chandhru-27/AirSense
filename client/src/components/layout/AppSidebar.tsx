import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, } from "@/components/ui/sidebar"
import { LayoutDashboard, Map, Bot, LogOut, User as UserIcon, PhoneCall, AlertTriangle } from "lucide-react"
import { useAuthStore } from "../../stores/authStore"
import { useNavigate, useLocation, Link } from "react-router-dom"

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Plan a Trip",
        url: "/plan-trip",
        icon: Map,
    },
    {
        title: "ChatBot",
        url: "/chatbot",
        icon: Bot,
    },
    {
        title: "Report Pollution",
        url: "/report",
        icon: AlertTriangle,
    },
    {
        title: "Helpline",
        url: "/helpline",
        icon: PhoneCall,
    },
    {
        title: "Profile",
        url: "/profile",
        icon: UserIcon,
    },
]

export function AppSidebar() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="flex items-center justify-center py-6">
                <div className="flex items-center gap-3 px-2 text-teal-600 font-bold text-xl">
                    <img src="/logo.png" alt="AirSense Logo" className="size-8 object-contain" />
                    <span className="group-data-[collapsible=icon]:hidden tracking-tight">AirSense</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={location.pathname === item.url} tooltip={item.title}>
                                        <Link to={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="h-12 border-t border-border/50 rounded-none">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                                    <UserIcon className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                    <span className="truncate font-semibold">{user?.name || 'Guest'}</span>
                                    <span className="truncate text-xs text-muted-foreground">{user?.email || ''}</span>
                                </div>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <LogOut />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
