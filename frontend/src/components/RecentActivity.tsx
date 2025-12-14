import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RecentShiftEventsQueryQuery } from "@/codegen/graphql"
import { Link } from "react-router-dom"
import { Routes } from "@/routes/routes.utilities"
import { ActivityEventItem } from "./ActivityEventItem"

interface RecentActivityProps {
  events?: RecentShiftEventsQueryQuery["recentShiftEvents"]["items"]
}

export function RecentActivity({ events }: RecentActivityProps) {
  if (!events || events.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Link
            to={Routes.activity}
            className="text-sm text-primary hover:underline"
          >
            See more
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event) => (
            <ActivityEventItem key={event.id} event={event} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
