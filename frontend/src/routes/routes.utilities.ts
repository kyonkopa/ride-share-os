export const Routes = {
  // Public routes
  login: "/login",
  scheduledTripAccept: "/scheduled-trips/:token/accept",
  scheduledTripDecline: "/scheduled-trips/:token/decline",

  // Protected routes
  home: "/",
  calendar: "/calendar",
  vehicles: "/vehicles",
  revenue: "/revenue",
  expenses: "/expenses",
  reconcile: "/reconcile",
  payroll: "/payroll",
  myPayroll: "/my-payroll",
  settings: "/settings",
  scheduledTrips: "/scheduled-trips",
  scheduledTripRequest: "/scheduled-trips/request",
  activity: "/activity",

  // Admin routes (if needed in the future)
  adminDashboard: "/admin/dashboard",
} as const

export type RouteKey = keyof typeof Routes
