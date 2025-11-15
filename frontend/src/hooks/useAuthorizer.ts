import { useMemo } from "react"
import { useAuthStore } from "@/stores/AuthStore"
import { PermissionEnum } from "@/codegen/graphql"

export type PermissionType = PermissionEnum

/**
 * Hook for checking user permissions
 * Checks the provided permission against the user's list of attached permissions
 * @returns An object with a `can` method to check if the user has a specific permission
 */
export function useAuthorizer() {
  const { user } = useAuthStore()

  // Create a Set of permission slugs for O(1) lookup
  // User permissions come with slugs (e.g., "driver_read_access")
  const userPermissionSlugs = useMemo(() => {
    if (!user?.permissions) {
      return new Set<string>()
    }
    return new Set(user.permissions.map((permission) => permission.slug))
  }, [user?.permissions])

  /**
   * Check if the user has a specific permission
   * @param permission - The permission enum value (e.g., PermissionEnum.DriverReadAccess or "DRIVER_READ_ACCESS") or slug (e.g., "driver_read_access")
   * @returns true if the user has the permission, false otherwise
   */
  const can = (permission: PermissionType): boolean => {
    if (!user) return false

    return userPermissionSlugs.has(permission)
  }

  return {
    can,
  }
}
