export const Routes = {
  // Public routes
  login: "/login",

  // Protected routes
  home: "/",
  calendar: "/calendar",
  vehicles: "/vehicles",
  revenue: "/revenue",
  expenses: "/expenses",
  payroll: "/payroll",
  settings: "/settings",

  // Admin routes (if needed in the future)
  adminDashboard: "/admin/dashboard",
} as const

export type RouteKey = keyof typeof Routes
