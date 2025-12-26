import { useState, useCallback } from "react"
import { StatusBadge } from "@/components/StatusBadge"
import { ClockInForm } from "./ClockInForm"
import { RecentActivity } from "./RecentActivity"
import { CurrentShift } from "@/features/current-shift"
import { useShift } from "../hooks/useShift"
import { useVehicles } from "@/features/clock-in/useVehicles"
import { useRecentShiftEvents } from "@/features/recent-shift-events/useRecentShiftEvents"
import { useAuthStore } from "@/stores/AuthStore"
import { PullToRefresh } from "./PullToRefresh"
import { YesterdayReportCard } from "./YesterdayReportCard"
import { useYesterdayReport } from "@/features/yesterday-report/useYesterdayReport"
import { useAuthorizer } from "@/hooks/useAuthorizer"
import { PermissionEnum } from "@/codegen/graphql"

interface HomeScreenProps {
  children?: React.ReactNode
}

export function HomeScreen({ children }: HomeScreenProps) {
  const { vehicles, refetch: refetchVehicles } = useVehicles()
  const { currentShift, refetchCurrentShift } = useShift()
  const [showClockIn, setShowClockIn] = useState(false)

  const { user } = useAuthStore()
  const { can } = useAuthorizer()

  const { data: recentShiftEventsData, refetch: refetchRecentShiftEvents } =
    useRecentShiftEvents()

  const { refetch: refetchYesterdayReport } = useYesterdayReport()

  const onClockIn = () => setShowClockIn(true)

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchVehicles(),
      refetchCurrentShift(),
      refetchRecentShiftEvents(),
      ...(can(PermissionEnum.ShiftReadAccess)
        ? [refetchYesterdayReport()]
        : []),
    ])
  }, [
    refetchVehicles,
    refetchCurrentShift,
    refetchRecentShiftEvents,
    refetchYesterdayReport,
    can,
  ])

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">
            Hello {user?.fullName || user?.firstName || "there"}
          </h1>
          {user?.driver && <StatusBadge isOnline={!!currentShift} />}

          {user?.driver && (
            <CurrentShift onClockIn={onClockIn} vehicles={vehicles} />
          )}
          {can(PermissionEnum.ShiftReadAccess) && <YesterdayReportCard />}
          <RecentActivity
            events={recentShiftEventsData?.recentShiftEvents?.items}
          />
          {children}
        </div>
      </PullToRefresh>

      {/* Clock In Modal */}
      <ClockInForm
        vehicles={vehicles}
        onClockInSuccess={() => {
          setShowClockIn(false)
        }}
        open={showClockIn}
        onOpenChange={setShowClockIn}
      />
    </>
  )
}
