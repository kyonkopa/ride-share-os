import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Car, DollarSign, FileText, Activity } from "lucide-react"
import { DateTime } from "luxon"
import type {
  ShiftAssignment,
  VehicleFragmentFragment,
} from "@/codegen/graphql"
import { ShiftEventTypeEnum, ShiftStatusEnum } from "@/codegen/graphql"
import { formatDate } from "@/utils/dateUtils"

interface ShiftDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  shifts: ShiftAssignment[]
  vehicles: VehicleFragmentFragment[]
}

export function ShiftDetailsDrawer({
  isOpen,
  onClose,
  selectedDate,
  shifts,
  vehicles,
}: ShiftDetailsDrawerProps) {
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null)

  if (!selectedDate) return null

  const formatTime = (dateTime: string) => {
    return DateTime.fromISO(dateTime).toLocaleString({
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(amount)
  }

  const formatDuration = (startTime: string, endTime?: string | null) => {
    const start = DateTime.fromISO(startTime)
    const end = endTime ? DateTime.fromISO(endTime) : DateTime.now()
    const duration = end.diff(start, ["hours", "minutes"])
    return `${Math.floor(duration.hours)}h ${Math.floor(duration.minutes)}m`
  }

  const getStatusColor = (status: ShiftStatusEnum) => {
    switch (status) {
      case ShiftStatusEnum.Completed:
        return "bg-green-100 text-green-800 border-green-200"
      case ShiftStatusEnum.Active:
      case ShiftStatusEnum.Paused:
        return "bg-blue-100 text-blue-800 border-blue-200"
      case ShiftStatusEnum.Missed:
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: ShiftStatusEnum) => {
    switch (status) {
      case ShiftStatusEnum.Completed:
        return "🟢"
      case ShiftStatusEnum.Active:
      case ShiftStatusEnum.Paused:
        return "🔵"
      case ShiftStatusEnum.Missed:
        return "🔴"
      default:
        return "⚪️"
    }
  }

  const getStatusLabel = (status: ShiftStatusEnum) => {
    switch (status) {
      case ShiftStatusEnum.Scheduled:
        return "Scheduled"
      case ShiftStatusEnum.Active:
        return "Active"
      case ShiftStatusEnum.Completed:
        return "Completed"
      case ShiftStatusEnum.Missed:
        return "Missed"
      case ShiftStatusEnum.Paused:
        return "Paused"
      default:
        return "Unknown"
    }
  }

  const getEventTypeLabel = (eventType: ShiftEventTypeEnum) => {
    switch (eventType) {
      case ShiftEventTypeEnum.ClockIn:
        return "Clock In"
      case ShiftEventTypeEnum.ClockOut:
        return "Clock Out"
      case ShiftEventTypeEnum.Pause:
        return "Pause"
      case ShiftEventTypeEnum.Resume:
        return "Resume"
      case ShiftEventTypeEnum.TelemetrySnapshot:
        return "Telemetry Snapshot"
      default:
        return "Unknown"
    }
  }

  const getEventTypeColor = (eventType: ShiftEventTypeEnum) => {
    switch (eventType) {
      case ShiftEventTypeEnum.ClockIn:
        return "bg-green-100 text-green-800 border-green-200"
      case ShiftEventTypeEnum.ClockOut:
        return "bg-red-100 text-red-800 border-red-200"
      case ShiftEventTypeEnum.Pause:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case ShiftEventTypeEnum.Resume:
        return "bg-blue-100 text-blue-800 border-blue-200"
      case ShiftEventTypeEnum.TelemetrySnapshot:
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Filter shifts for the selected date
  const dayShifts = shifts.filter((shift) => {
    const shiftDate = DateTime.fromISO(shift.startTime)
    const selectedDateStart = DateTime.fromJSDate(selectedDate).startOf("day")
    const selectedDateEnd = DateTime.fromJSDate(selectedDate).endOf("day")

    return shiftDate >= selectedDateStart && shiftDate <= selectedDateEnd
  })

  const hasShifts = dayShifts.length > 0

  const selectedShift = selectedShiftId
    ? dayShifts.find((shift) => shift.id === selectedShiftId)
    : null

  const sortedEvents = selectedShift?.shiftEvents
    ? [...selectedShift.shiftEvents].sort((a, b) => {
        const dateA = DateTime.fromISO(a.createdAt)
        const dateB = DateTime.fromISO(b.createdAt)
        return dateA.toMillis() - dateB.toMillis()
      })
    : []

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {formatDate(selectedDate)}
            </DialogTitle>
            <DialogDescription>
              {hasShifts
                ? `${dayShifts.length} shift${
                    dayShifts.length > 1 ? "s" : ""
                  } on this day`
                : "No shifts scheduled for this day"}
            </DialogDescription>
          </DialogHeader>

          {hasShifts ? (
            <div className="space-y-4">
              {dayShifts.map((shift, index) => {
                const vehicle = shift.vehicle
                  ? vehicles.find((v) => v.id === shift.vehicle!.id)
                  : undefined
                const clockInEvent = shift.shiftEvents?.find(
                  (event) => event.eventType === ShiftEventTypeEnum.ClockIn
                )
                const clockOutEvent = shift.shiftEvents?.find(
                  (event) => event.eventType === ShiftEventTypeEnum.ClockOut
                )
                const revenue = shift.revenueRecords?.reduce(
                  (sum, record) => sum + (record.totalRevenue || 0),
                  0
                )

                return (
                  <Card key={shift.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {getStatusIcon(shift.status)} Shift #{index + 1}
                        </CardTitle>
                        <Badge className={getStatusColor(shift.status)}>
                          {getStatusLabel(shift.status)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Vehicle Information */}
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Car className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {vehicle?.make} {vehicle?.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle?.licensePlate}
                          </p>
                        </div>
                      </div>

                      {/* Time Information */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Clock-in
                              </p>
                              <p className="font-medium">
                                {formatTime(
                                  shift.actualStartTime || shift.startTime
                                )}
                              </p>
                            </div>
                          </div>
                          {shift.actualEndTime && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Clock-out
                                </p>
                                <p className="font-medium">
                                  {formatTime(shift.actualEndTime)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Duration
                            </p>
                            <p className="font-medium">
                              {formatDuration(
                                shift.actualStartTime || shift.startTime,
                                shift.actualEndTime || shift.endTime
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Odometer Information */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Start Odometer
                          </p>
                          <p className="font-medium">
                            {(
                              clockInEvent?.odometer ||
                              vehicle?.latestOdometer ||
                              0
                            ).toLocaleString()}{" "}
                            km
                          </p>
                        </div>
                        {clockOutEvent?.odometer && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              End Odometer
                            </p>
                            <p className="font-medium">
                              {clockOutEvent?.odometer.toLocaleString()} km
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Revenue */}
                      {!!revenue && revenue > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Revenue
                            </p>
                            <p className="font-bold text-green-600">
                              {formatCurrency(revenue)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      {clockInEvent &&
                        (clockInEvent.gpsLat || clockInEvent.gpsLon) && (
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Start Location
                              </p>
                              <p className="font-medium text-sm">
                                {clockInEvent.gpsLat?.toFixed(4)},{" "}
                                {clockInEvent.gpsLon?.toFixed(4)}
                              </p>
                            </div>
                          </div>
                        )}

                      {/* Notes */}
                      {clockOutEvent?.notes && (
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Notes
                            </p>
                            <p className="font-medium text-sm">
                              {clockOutEvent.notes}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedShiftId(shift.id)}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          View activities
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Shifts</h3>
              <p className="text-muted-foreground">
                No shifts were scheduled for this day.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activities Dialog */}
      <Dialog
        open={selectedShiftId !== null}
        onOpenChange={(open) => !open && setSelectedShiftId(null)}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Shift Activities
            </DialogTitle>
            <DialogDescription>
              {selectedShift && (
                <>
                  Activities for shift on {formatDate(selectedShift.startTime)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {sortedEvents.length > 0 ? (
            <div className="space-y-3">
              {sortedEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getEventTypeColor(event.eventType)}>
                          {getEventTypeLabel(event.eventType)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(event.createdAt)}
                      </div>
                    </div>

                    <div className="space-y-2 mt-3">
                      {event.odometer !== null &&
                        event.odometer !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              Odometer:
                            </span>
                            <span className="font-medium">
                              {event.odometer.toLocaleString()} km
                            </span>
                          </div>
                        )}

                      {event.vehicleRange !== null &&
                        event.vehicleRange !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              Range:
                            </span>
                            <span className="font-medium">
                              {event.vehicleRange} km
                            </span>
                          </div>
                        )}

                      {(event.gpsLat !== null || event.gpsLon !== null) && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">
                            Location:
                          </span>
                          <span className="font-medium">
                            {event.gpsLat?.toFixed(4)},{" "}
                            {event.gpsLon?.toFixed(4)}
                          </span>
                        </div>
                      )}

                      {event.notes && (
                        <div className="flex items-start gap-2 text-sm mt-2 pt-2 border-t">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="text-muted-foreground">
                              Notes:{" "}
                            </span>
                            <span className="font-medium">{event.notes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Activities</h3>
              <p className="text-muted-foreground">
                No activities recorded for this shift.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setSelectedShiftId(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
