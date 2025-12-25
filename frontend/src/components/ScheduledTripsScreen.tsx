import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useScheduledTrips } from "@/features/scheduled-trips/useScheduledTrips"
import { useDrivers } from "@/features/drivers/useDrivers"
import { PullToRefresh } from "./PullToRefresh"
import { useAssignDriverToScheduledTrip } from "@/features/scheduled-trips/useAssignDriverToScheduledTrip"
import { useCancelScheduledTrip } from "@/features/scheduled-trips/useCancelScheduledTrip"
import { toast } from "sonner"
import { Spinner } from "./ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import {
  AlertCircleIcon,
  CalendarClock,
  PhoneIcon,
  UserPlus,
  UserCheck,
  X,
} from "lucide-react"
import { Button } from "./ui/button"
import { Routes } from "@/routes/routes.utilities"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { Label } from "./ui/label"
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
import {
  parseGraphQLDateTime,
  formatRelativeTime,
  isPast,
} from "@/utils/dateUtils"
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
  onDriverAssigned?: () => void
  scheduledTripsQueryVariables?: {
    filter?: unknown
    pagination: {
      page: number
      perPage: number
    }
  }
}

function ScheduledTripCard({
  trip,
  onDriverAssigned,
  scheduledTripsQueryVariables,
}: ScheduledTripCardProps) {
  const pickupDate = parseGraphQLDateTime(trip.pickupDatetime)
  const isRecurring = !!trip.recurrenceConfig
  const isOverdue = isPast(pickupDate) && trip.state === "pending"
  const [showAssignDriverDialog, setShowAssignDriverDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState<string>("")
  const { drivers, loading: driversLoading } = useDrivers()
  const { handleAssignDriver, loading: assigningDriver } =
    useAssignDriverToScheduledTrip({
      onSuccess: () => {
        toast.success("Driver assigned successfully")
        setShowAssignDriverDialog(false)
        setSelectedDriverId("")
        onDriverAssigned?.()
      },
      onError: (errors) => {
        const error = errors[0]
        toast.error(error?.message || "Failed to assign driver")
      },
      scheduledTripsQueryVariables,
    })
  const { handleCancelTrip, loading: cancellingTrip } = useCancelScheduledTrip({
    onSuccess: () => {
      toast.success("Trip cancelled successfully")
      setShowCancelDialog(false)
      onDriverAssigned?.()
    },
    onError: (errors) => {
      const error = errors[0]
      toast.error(error?.message || "Failed to cancel trip")
    },
    scheduledTripsQueryVariables,
  })

  const handleAssignDriverClick = async () => {
    if (!selectedDriverId) return
    await handleAssignDriver(trip.id, selectedDriverId)
  }

  const handleCancelClick = async () => {
    await handleCancelTrip(trip.id)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{trip.clientName}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2">
              {trip.clientEmail}
              <a
                href={`tel:${trip.clientPhone}`}
                className="flex items-center gap-1 hover:text-primary transition-colors underline"
              >
                <PhoneIcon className="h-4 w-4" /> {trip.clientPhone}
              </a>
            </CardDescription>
          </div>
          <Badge variant={getStateBadgeVariant(trip.state)}>
            {formatState(trip.state)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isOverdue && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2 text-sm text-red-800">
            ⚠️ Pickup time has passed but trip is still pending
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-muted-foreground">Pickup</div>
            <div className="mt-1">{trip.pickupLocation}</div>
            <div className="text-sm mt-1">
              {pickupDate.toFormat("MMM dd, yyyy 'at' h:mm a")}{" "}
              <span
                className={`text-sm ${
                  isOverdue ? "text-red-600 font-semibold" : ""
                }`}
              >
                ({formatRelativeTime(pickupDate)})
              </span>
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
        {trip.driver && (
          <Badge variant="secondary" className="w-fit text-sm">
            <UserCheck className="h-3 w-3" />
            <span>{trip.driver.fullName}</span>
            {trip.driver.phoneNumber && (
              <a
                href={`tel:${trip.driver.phoneNumber}`}
                className="ml-1 hover:text-primary transition-colors underline"
                onClick={(e) => e.stopPropagation()}
              >
                {trip.driver.phoneNumber}
              </a>
            )}
          </Badge>
        )}
        {trip.reviewedBy && (
          <div className="text-xs text-muted-foreground">
            Reviewed by {trip.reviewedBy.firstName} {trip.reviewedBy.lastName}
            {trip.reviewedAt &&
              ` on ${parseGraphQLDateTime(trip.reviewedAt).toFormat("MMM dd, yyyy")}`}
          </div>
        )}
        {(trip.state === "pending" || isOverdue) && (
          <div className="pt-2 space-y-2">
            {trip.state === "pending" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAssignDriverDialog(true)}
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Driver
              </Button>
            )}
            {isOverdue && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                className="w-full"
                disabled={cancellingTrip}
              >
                {cancellingTrip ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel Trip
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Assign Driver Dialog */}
      <Dialog
        open={showAssignDriverDialog}
        onOpenChange={setShowAssignDriverDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>
              Select a driver to assign to this scheduled trip request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="driver-select">Driver</Label>
              <Select
                value={selectedDriverId}
                onValueChange={setSelectedDriverId}
                disabled={driversLoading}
              >
                <SelectTrigger id="driver-select">
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  {driversLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading drivers...
                    </SelectItem>
                  ) : drivers.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No drivers available
                    </SelectItem>
                  ) : (
                    drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.fullName}
                        {driver.phoneNumber && ` • ${driver.phoneNumber}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignDriverDialog(false)
                setSelectedDriverId("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignDriverClick}
              disabled={!selectedDriverId || driversLoading || assigningDriver}
            >
              {assigningDriver ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Assigning...
                </>
              ) : (
                "Assign Driver"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Trip Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Trip</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this trip? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Trip Details:</p>
              <p>Client: {trip.clientName}</p>
              <p>Pickup: {trip.pickupLocation}</p>
              <p>Drop-off: {trip.dropoffLocation}</p>
              <p className="mt-2 text-red-600">
                Pickup time: {pickupDate.toFormat("MMM dd, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancellingTrip}
            >
              Keep Trip
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelClick}
              disabled={cancellingTrip}
            >
              {cancellingTrip ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Cancelling...
                </>
              ) : (
                "Cancel Trip"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const perPage = 20

  const { scheduledTrips, pagination, loading, error, refetch } =
    useScheduledTrips({
      pagination: {
        page,
        perPage,
      },
    })

  const handleRefresh = useCallback(async () => {
    await refetch()
  }, [refetch])

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
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Scheduled Trips</h1>
            <p className="text-muted-foreground">
              View and manage scheduled trip requests
            </p>
          </div>
        </div>

        {/* Schedule a Trip Entry Point */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">Schedule a Trip</h3>
                  <p className="text-sm text-muted-foreground">
                    Request a future or recurring ride
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate(Routes.scheduledTripRequest)}
                variant="default"
              >
                Schedule Trip
              </Button>
            </div>
          </CardContent>
        </Card>

        {scheduledTrips.length === 0 ? (
          <ScheduledTripsEmpty />
        ) : (
          <>
            <div className="grid gap-4">
              {scheduledTrips.map((trip) => (
                <ScheduledTripCard
                  key={trip.id}
                  trip={trip}
                  scheduledTripsQueryVariables={{
                    pagination: {
                      page,
                      perPage,
                    },
                  }}
                  onDriverAssigned={() => {
                    // Refetch is handled by refetchQueries in the mutation hook
                  }}
                />
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
    </PullToRefresh>
  )
}
