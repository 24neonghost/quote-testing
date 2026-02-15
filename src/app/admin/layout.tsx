import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const user = session.user

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // 🔥 Only redirect if profile exists and role is wrong
  if (profile && profile.role !== "admin") {
    redirect("/")
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50/50">
        <AdminSidebar />
        <main className="flex-1 min-w-0 overflow-y-auto md:p-8 lg:pl-64 transition-all duration-300">
          {/* 📱 MOBILE ONLY: Header with hamburger (hidden on desktop with md:hidden) */}
          <div className="sticky top-0 z-10 flex items-center gap-2 bg-gray-50/50 px-4 py-3 border-b border-gray-200 md:hidden">
            <SidebarTrigger className="size-9" />
            <h1 className="text-lg font-semibold">Raise Labs Admin</h1>
          </div>
          
          <div className="mx-auto w-full max-w-7xl p-4 md:p-0 pt-16 md:pt-0 lg:pt-0">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
