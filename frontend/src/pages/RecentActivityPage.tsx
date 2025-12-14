import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useRecentShiftEvents } from "@/features/recent-shift-events/useRecentShiftEvents"
import { ActivityEventItem } from "@/components/ActivityEventItem"
import { parseGraphQLDateTime } from "@/utils/dateUtils"
import { Paginator } from "@/components/pagination/paginator"

export default function RecentActivityPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 20

  const { data, loading, error, pagination } = useRecentShiftEvents({
    pagination: {
      page: currentPage,
      perPage,
    },
  })

  const events = useMemo(
    () => data?.recentShiftEvents?.items || [],
    [data?.recentShiftEvents?.items]
  )

  // Group events by day
  const groupedEvents = useMemo(() => {
    const groups: Record<string, { label: string; events: typeof events }> = {}

    events.forEach((event) => {
      const dateTime = parseGraphQLDateTime(event.createdAt)
      const dayKey = dateTime.toFormat("yyyy-MM-dd")
      const dayLabel = dateTime.toFormat("EEEE, MMMM d, yyyy")

      if (!groups[dayKey]) {
        groups[dayKey] = {
          label: dayLabel,
          events: [],
        }
      }
      groups[dayKey].events.push(event)
    })

    // Sort by date (most recent first)
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, value]) => ({
        key,
        ...value,
      }))
  }, [events])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading activities...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              Error loading activities. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">No activities found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container space-y-6">
      <h1 className="text-2xl font-bold">Recent Activity</h1>

      {groupedEvents.map((group) => (
        <div key={group.key}>
          <h2 className="font-semibold mb-3">{group.label}</h2>
          <div className="space-y-3">
            {group.events.map((event) => (
              <ActivityEventItem key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}

      {pagination && (
        <div className="flex justify-center mt-6">
          <Paginator
            currentPage={pagination.currentPage}
            totalPages={pagination.pageCount || 1}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  )
}
