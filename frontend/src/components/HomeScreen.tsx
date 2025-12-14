import { useState } from "react"
import { StatusBadge } from "@/components/StatusBadge"
import { ClockInForm } from "./ClockInForm"
import { RecentActivity } from "./RecentActivity"
import { CurrentShift } from "@/features/current-shift"
import { useShift } from "../hooks/useShift"
import { useVehicles } from "@/features/clock-in/useVehicles"
import { useRecentShiftEvents } from "@/features/recent-shift-events/useRecentShiftEvents"
import { useAuthStore } from "@/stores/AuthStore"
interface HomeScreenProps {
  children?: React.ReactNode
}

export function HomeScreen({ children }: HomeScreenProps) {
  const { vehicles } = useVehicles()
  const { currentShift } = useShift()
  const [showClockIn, setShowClockIn] = useState(false)

  const { user } = useAuthStore()

  const { data: recentShiftEventsData } = useRecentShiftEvents()

  const onClockIn = () => setShowClockIn(true)

  return (
    <>
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
