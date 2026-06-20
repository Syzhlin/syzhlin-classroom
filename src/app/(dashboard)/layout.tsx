import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{backgroundColor: "var(--sz-bg-pastel)"}}>
      <Sidebar />
      <main className="min-h-screen min-w-0 overflow-x-hidden pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-64">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
