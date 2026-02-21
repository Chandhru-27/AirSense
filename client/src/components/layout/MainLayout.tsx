import { Outlet } from "react-router-dom"
import { AppSidebar } from "./AppSidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export function MainLayout() {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-slate-50">
                <AppSidebar />
                <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
                    <header className="flex h-16 items-center border-b px-4 bg-white shrink-0 lg:hidden">
                        <SidebarTrigger />
                        <h1 className="ml-4 font-bold text-teal-600 text-lg">AirSense</h1>
                    </header>
                    <div className="flex-1 overflow-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </SidebarProvider>
    )
}
