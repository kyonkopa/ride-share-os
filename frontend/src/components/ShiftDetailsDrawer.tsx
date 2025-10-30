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
import {
  Clock,
  Car,
  Battery,
  MapPin,
  DollarSign,
  FileText,
  AlertTriangle,
  BarChart3,
} from "lucide-react"
import type { Shift } from "@/types/shift"
import type { VehicleFragmentFragment } from "@/codegen/graphql"

interface ShiftDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  shifts: Shift[]
  vehicles: VehicleFragmentFragment[]
}

export function ShiftDetailsDrawer({
  isOpen,
  onClose,
  selectedDate,
  shifts,
  vehicles,
}: ShiftDetailsDrawerProps) {
  if (!selectedDate) return null

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(amount)
  }

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = (endTime || Date.now()) - startTime
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "🟢"
      case "active":
        return "🔵"
      case "cancelled":
        return "🔴"
      default:
        return "⚪️"
    }
  }

  // Filter shifts for the selected date
  const dayShifts = shifts.filter((shift) => {
    const shiftDate = new Date(shift.startTime)
    const selectedDateStart = new Date(selectedDate)
    selectedDateStart.setHours(0, 0, 0, 0)
    const selectedDateEnd = new Date(selectedDate)
    selectedDateEnd.setHours(23, 59, 59, 999)

    return shiftDate >= selectedDateStart && shiftDate <= selectedDateEnd
  })

  const hasShifts = dayShifts.length > 0

  return (
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
              const vehicle = vehicles.find((v) => v.id === shift.vehicleId)

              return (
                <Card key={shift.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {getStatusIcon(shift.status)} Shift #{index + 1}
                      </CardTitle>
                      <Badge className={getStatusColor(shift.status)}>
                        {shift.status.charAt(0).toUpperCase() +
                          shift.status.slice(1)}
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
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Clock-in
                            </p>
                            <p className="font-medium">
                              {formatTime(shift.startTime)}
                            </p>
                          </div>
                        </div>
                        {shift.endTime && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Clock-out
                              </p>
                              <p className="font-medium">
                                {formatTime(shift.endTime)}
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
                            {formatDuration(shift.startTime, shift.endTime)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Battery Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Battery className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Start Range
                          </p>
                          <p className="font-medium">{shift.startRange} km</p>
                        </div>
                      </div>
                      {shift.endRange && (
                        <div className="flex items-center gap-2">
                          <Battery className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              End Range
                            </p>
                            <p className="font-medium">{shift.endRange} km</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Odometer Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Start Odometer
                        </p>
                        <p className="font-medium">
                          {shift.startOdometer.toLocaleString()} km
                        </p>
                      </div>
                      {shift.endOdometer && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            End Odometer
                          </p>
                          <p className="font-medium">
                            {shift.endOdometer.toLocaleString()} km
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Revenue */}
                    {shift.revenue && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Revenue
                          </p>
                          <p className="font-bold text-green-600">
                            {formatCurrency(shift.revenue)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    {shift.startLocation && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Start Location
                          </p>
                          <p className="font-medium text-sm">
                            {shift.startLocation.address ||
                              `${shift.startLocation.latitude.toFixed(
                                4
                              )}, ${shift.startLocation.longitude.toFixed(4)}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {shift.notes && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p className="font-medium text-sm">{shift.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          // TODO: Implement report issue functionality
                          console.log("Report issue for shift:", shift.id)
                        }}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Report Issue
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          // TODO: Implement trip summary functionality
                          console.log("View trip summary for shift:", shift.id)
                        }}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Summary
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
  )
}
