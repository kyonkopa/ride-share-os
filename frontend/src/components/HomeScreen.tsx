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

interface HomeScreenProps {
  children?: React.ReactNode
}

export function HomeScreen({ children }: HomeScreenProps) {
  const { vehicles, refetch: refetchVehicles } = useVehicles()
  const { currentShift, refetchCurrentShift } = useShift()
  const [showClockIn, setShowClockIn] = useState(false)

  const { user } = useAuthStore()

  const { data: recentShiftEventsData, refetch: refetchRecentShiftEvents } =
    useRecentShiftEvents()

  const onClockIn = () => setShowClockIn(true)

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchVehicles(),
      refetchCurrentShift(),
      refetchRecentShiftEvents(),
    ])
  }, [refetchVehicles, refetchCurrentShift, refetchRecentShiftEvents])

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6">
          {user?.driver && <StatusBadge isOnline={!!currentShift} />}

          {user?.driver && (
            <CurrentShift onClockIn={onClockIn} vehicles={vehicles} />
          )}
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
