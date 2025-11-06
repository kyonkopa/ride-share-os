import { Sidebar } from "./Sidebar"
import { Outlet, useLocation } from "react-router"

export function Layout() {
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPath={currentPath} />

      {/* Main Content Area */}
      <div className="md:ml-80 min-h-screen">
        <main className="p-4 md:p-6 max-w-4xl md:ml-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
