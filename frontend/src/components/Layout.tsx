import { Sidebar } from "./Sidebar"
import { Outlet } from "react-router"

interface LayoutProps {
  currentPath?: string
}

export function Layout({ currentPath }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPath={currentPath} />

      {/* Main Content Area */}
      <div className="md:ml-80 min-h-screen">
        <main className="p-4 md:p-6 max-w-4xl ml-16 md:ml-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
