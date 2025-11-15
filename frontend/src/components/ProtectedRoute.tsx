import { useEffect } from "react"
import { LoginForm } from "@/features/log-in/LoginForm"
import { useAuthStore } from "@/stores/AuthStore"
import { useCurrentUserQuery } from "@/features/current-user/useCurrentUserQuery"
import { Spinner } from "./ui/spinner"
import type { User } from "@/codegen/graphql"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, updateUserFromQuery, setLoading } =
    useAuthStore()
  const { data, loading: queryLoading, error } = useCurrentUserQuery()

  useEffect(() => {
    if (!queryLoading) {
      setLoading(false)

      if (data?.currentUser) {
        updateUserFromQuery(data.currentUser as User)
      } else if (error || !data?.currentUser) {
        updateUserFromQuery(null)
      }
    }
  }, [data, queryLoading, error, updateUserFromQuery, setLoading])

  if (loading || queryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner />
        <span className="ml-2">Please wait...</span>
      </div>
    )
  }

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
