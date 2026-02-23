import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, } from "@/components/ui/sidebar"
import { LayoutDashboard, Map, Bot, LogOut, User as UserIcon, PhoneCall, AlertTriangle } from "lucide-react"
import { useAuthStore } from "../../stores/authStore"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useLogout } from "../../lib/hooks"
import { useProfile } from "../../lib/hooks"
import { useQueryClient } from "@tanstack/react-query"

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
    const { mutateAsync: logoutApi } = useLogout()
    const { data: profile } = useProfile()
    const queryClient = useQueryClient()

    // Prefer API full_name, fall back to Zustand username, then 'Guest'
    const displayName = profile?.full_name || user?.name || 'Guest'
    const displayEmail = profile?.email || user?.email || ''

    const handleLogout = async () => {
        // Call backend (blocklists refresh token) + clears localStorage tokens
        try {
            await logoutApi()
        } catch {
            // If API fails, still clear client-side data
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('token')
        }
        // Clear React Query cache so stale user data doesn't persist
        queryClient.clear()
        // Clear Zustand auth state
        logout()
        // Navigate to login (using React Router, not a hard refresh)
        navigate('/login')
    }

    return (
        <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="flex items-center justify-center py-6">
                <div className="flex items-center gap-3 px-2 font-bold text-xl" style={{ color: '#5F7A94' }}>
                    <img src="/airsense_logo-removebg-preview.png" alt="AirSense Logo" className="size-8 object-contain" />
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
                                    <SidebarMenuButton asChild isActive={location.pathname === item.url} tooltip={item.title} className="h-12">
                                        <Link to={item.url} className="flex items-center gap-3 text-base font-medium">
                                            <item.icon className="size-5" />
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-xds" style={{ backgroundColor: '#CFE8FF', color: '#5F7A94' }}>
                                    <UserIcon className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                    <span className="truncate font-semibold">{displayName}</span>
                                    <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
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
