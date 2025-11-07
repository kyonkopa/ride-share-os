import { Suspense, lazy } from "react"
import { Outlet, type RouteObject } from "react-router"
import { Routes } from "./routes.utilities"
import SuspenseFallback from "./SuspenseFallback"
import { ProtectedRoute } from "../components/ProtectedRoute"
import UnauthenticatedRoute from "./UnauthenticatedRoute"
import { Layout } from "@/components/Layout"

// Lazy load components for better performance
const LoginPage = lazy(() => import("../pages/LoginPage"))
const HomeScreenWrapper = lazy(() => import("../pages/HomeScreenPage"))
const CalendarScreenWrapper = lazy(
  () => import("../components/CalendarScreenWrapper")
)
const VehiclesScreenPage = lazy(() => import("../pages/VehiclesScreenPage"))
const RevenueScreenPage = lazy(() => import("../pages/RevenueScreenPage"))
const ExpenseScreenPage = lazy(() => import("../pages/ExpenseScreenPage"))
const SettingsPage = lazy(() => import("../pages/SettingsPage"))

export const routes: RouteObject[] = [
  {
    element: <Outlet />,
    children: [
      // Public routes
      {
        path: Routes.login,
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <UnauthenticatedRoute>
              <LoginPage />
            </UnauthenticatedRoute>
          </Suspense>
        ),
      },
      // Protected routes
      {
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          </Suspense>
        ),
        children: [
          {
            path: Routes.home,
            element: <HomeScreenWrapper />,
          },
          {
            path: Routes.calendar,
            element: <CalendarScreenWrapper />,
          },
          {
            path: Routes.vehicles,
            element: <VehiclesScreenPage />,
          },
          {
            path: Routes.revenue,
            element: <RevenueScreenPage />,
          },
          {
            path: Routes.expenses,
            element: <ExpenseScreenPage />,
          },
          {
            path: Routes.settings,
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
]
