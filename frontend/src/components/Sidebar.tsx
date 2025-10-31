import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Home,
  Calendar,
  DollarSign,
  MapPin,
  Receipt,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Car,
} from "lucide-react"
import { useAuthStore } from "@/stores/AuthStore"
import { Link } from "react-router-dom"

interface SidebarProps {
  currentPath?: string
}

export function Sidebar({ currentPath = "/" }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)

  const menuItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      path: "/",
      enabled: true,
    },
    {
      id: "calendar",
      label: "My Calendar",
      icon: Calendar,
      path: "/calendar",
      enabled: false,
    },
    {
      id: "earnings",
      label: "Earnings",
      icon: DollarSign,
      path: "/earnings",
      enabled: false,
    },
    {
      id: "charging",
      label: "Charging Stations",
      icon: MapPin,
      path: "/charging",
      enabled: false,
    },
    {
      id: "expenses",
      label: "Expenses",
      icon: Receipt,
      path: "/expenses",
      enabled: false,
    },
    {
      id: "vehicles",
      label: "Vehicles",
      icon: Car,
      path: "/vehicles",
      enabled: true,
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      path: "/profile",
      enabled: false,
    },
  ]

  const bottomItems = [
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/settings",
      enabled: false,
    },
    {
      id: "logout",
      label: "Logout",
      icon: LogOut,
      path: "/logout",
      enabled: true,
    },
  ]

  const { clearStorage } = useAuthStore()

  const handleItemClick = (path: string) => {
    // Collapse sidebar on mobile when an item is clicked
    if (window.innerWidth < 768) {
      setIsCollapsed(true)
    }
    if (path === "/logout") {
      clearStorage()
    }
  }

  const { user } = useAuthStore()

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden w-12 h-12">
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-full"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <Menu className="h-6 w-6" />
          ) : (
            <X className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-card z-40
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "-translate-x-full" : "translate-x-0"}
          md:translate-x-0
          w-80 md:w-80
        `}
      >
        <div className="flex flex-col h-full p-6">
          {/* Top Section - Driver Avatar + Name */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {user?.fullName}
                </h2>
                {user?.driver && (
                  <p className="text-muted-foreground">
                    Driver ID: #{user.driver.id}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Menu */}
          <nav className="flex-1 space-y-2">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPath === item.path

                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className={`
                      w-full justify-start h-12 px-4 rounded-md
                      ${isActive ? "bg-secondary" : ""}
                    `}
                    disabled={!item.enabled}
                    onClick={() => handleItemClick(item.path)}
                  >
                    <Link
                      to={item.path}
                      className="w-full flex items-center justify-start"
                    >
                      <Icon className="h-6 w-6 mr-4" />
                      <span className="text-xl font-medium">{item.label}</span>
                    </Link>
                  </Button>
                )
              })}
            </div>
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-border pt-4 space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPath === item.path

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`
                    w-full justify-start h-14 px-4 rounded-xl
                    ${isActive ? "bg-secondary" : ""}
                    ${
                      item.id === "logout"
                        ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                        : ""
                    }
                  `}
                  onClick={() => handleItemClick(item.path)}
                  disabled={!item.enabled}
                >
                  <Icon className="h-5 w-5 mr-4" />
                  <span className="text-lg font-medium">{item.label}</span>
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  )
}
