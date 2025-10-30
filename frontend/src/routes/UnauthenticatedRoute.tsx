import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../stores/AuthStore"

interface UnauthenticatedRouteProps {
  children: React.ReactNode
}

export default function UnauthenticatedRoute({
  children,
}: UnauthenticatedRouteProps) {
  const { isAuthenticated, loading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/")
    }
  }, [isAuthenticated, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect to home
  }

  return <>{children}</>
}
