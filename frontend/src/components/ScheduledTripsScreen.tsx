import { useState } from "react"
import { useScheduledTrips } from "@/features/scheduled-trips/useScheduledTrips"
import { Spinner } from "./ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { AlertCircleIcon, CalendarClock } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Badge } from "./ui/badge"
import { parseGraphQLDateTime } from "@/utils/dateUtils"
import { Paginator } from "./pagination/paginator"
import type { ScheduledTrip } from "@/codegen/graphql"

function getStateBadgeVariant(state: string) {
  switch (state) {
    case "confirmed":
      return "default"
    case "accepted":
      return "default"
    case "pending":
      return "secondary"
    case "declined":
    case "auto_declined":
      return "destructive"
    default:
      return "outline"
  }
}

function formatState(state: string): string {
  return state
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

interface ScheduledTripCardProps {
  trip: ScheduledTrip
}

function ScheduledTripCard({ trip }: ScheduledTripCardProps) {
  const pickupDate = parseGraphQLDateTime(trip.pickupDatetime)
  const isRecurring = !!trip.recurrenceConfig

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{trip.clientName}</CardTitle>
            <CardDescription className="mt-1">
              {trip.clientEmail} • {trip.clientPhone}
            </CardDescription>
          </div>
          <Badge variant={getStateBadgeVariant(trip.state)}>
            {formatState(trip.state)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-muted-foreground">Pickup</div>
            <div className="mt-1">{trip.pickupLocation}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {pickupDate.toFormat("MMM dd, yyyy 'at' h:mm a")}
            </div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Drop-off</div>
            <div className="mt-1">{trip.dropoffLocation}</div>
          </div>
        </div>
        {trip.price && (
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">Price: </span>
            <span className="font-semibold">GHS {trip.price.toFixed(2)}</span>
          </div>
        )}
        {isRecurring && (
          <Badge variant="outline" className="w-fit">
            Recurring
          </Badge>
        )}
        {trip.notes && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Notes: </span>
            {trip.notes}
          </div>
        )}
        {trip.reviewedBy && (
          <div className="text-xs text-muted-foreground">
            Reviewed by {trip.reviewedBy.firstName} {trip.reviewedBy.lastName}
            {trip.reviewedAt &&
              ` on ${parseGraphQLDateTime(trip.reviewedAt).toFormat("MMM dd, yyyy")}`}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ScheduledTripsEmpty() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarClock />
        </EmptyMedia>
        <EmptyTitle>No scheduled trips found</EmptyTitle>
        <EmptyDescription>
          There are no scheduled trips matching your filters.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function ScheduledTripsScreen() {
  const [page, setPage] = useState(1)
  const perPage = 20

  const { scheduledTrips, pagination, loading, error } = useScheduledTrips({
    pagination: {
      page,
      perPage,
    },
  })

  if (loading && !scheduledTrips.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
        <span className="ml-2">Loading scheduled trips...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || "Failed to load scheduled trips"}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scheduled Trips</h1>
          <p className="text-muted-foreground">
            View and manage scheduled trip requests
          </p>
        </div>
      </div>

      {scheduledTrips.length === 0 ? (
        <ScheduledTripsEmpty />
      ) : (
        <>
          <div className="grid gap-4">
            {scheduledTrips.map((trip) => (
              <ScheduledTripCard key={trip.id} trip={trip} />
            ))}
          </div>

          {pagination &&
            pagination.pageCount != null &&
            pagination.pageCount > 1 && (
              <Paginator
                currentPage={pagination.currentPage}
                totalPages={pagination.pageCount}
                onPageChange={setPage}
              />
            )}
        </>
      )}
    </div>
  )
}
