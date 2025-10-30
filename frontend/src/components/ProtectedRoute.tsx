import { LoginForm } from "@/features/log-in/LoginForm"
import { useAuthStore } from "@/stores/AuthStore"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuthStore()

  if (loading) return <div>Loading...</div>

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
