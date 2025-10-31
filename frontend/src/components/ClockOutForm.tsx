import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  MapPin,
  Battery,
  Gauge,
  DollarSign,
  Receipt,
  AlertCircleIcon,
} from "lucide-react"
import type {
  CurrentShiftFragmentFragment,
  ShiftEvent,
} from "@/codegen/graphql"
import { formatDateTime, getShiftDuration } from "@/utils/dateUtils"
import { Spinner } from "./ui/spinner"
import {
  useClockOutForm,
  type ClockOutFormData,
} from "@/features/clock-out/useClockOutForm"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { useNotification } from "@/hooks/useNotification"

interface ClockOutFormProps {
  currentShift: CurrentShiftFragmentFragment
  clockInShiftEvent: ShiftEvent
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClockOutForm({
  currentShift,
  clockInShiftEvent,
  open,
  onOpenChange,
}: ClockOutFormProps) {
  const [formData, setFormData] = useState<ClockOutFormData>({
    odometer: 0,
    gpsLat: 0,
    gpsLon: 0,
    range: 0,
    notes: "",
    revenue: 0,
    earnings: 0,
    shiftAssignmentId: currentShift.id,
  })

  const [location, setLocation] = useState<{
    latitude: number
    longitude: number
    address?: string
  } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Get current location only when modal is opened
  useEffect(() => {
    if (open && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
          setLocationError(null)
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationError(
            "Unable to get your location. Please enable location services."
          )
        }
      )
    } else if (open && !navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.")
    } else if (!open) {
      // Reset location state when modal is closed
      setLocation(null)
      setLocationError(null)
    }
  }, [open])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const { addSuccess } = useNotification()

  const { onSubmit, loading, errors } = useClockOutForm({
    onSuccess: () => {
      addSuccess("Shift clocked out successfully")
      onOpenChange(false)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.odometer || !formData.range) {
      alert("Please fill in all required fields")
      return
    }

    if (!location) {
      alert("Location is required. Please enable location services.")
      return
    }

    await onSubmit(formData)
  }

  const shiftDuration = getShiftDuration(clockInShiftEvent.createdAt)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Clock Out
          </DialogTitle>
          <DialogDescription>
            End your shift and record final metrics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shift Summary */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Current Shift Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-2 font-medium">{shiftDuration}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Start Odometer:</span>
                <span className="ml-2 font-medium">
                  {clockInShiftEvent.odometer} km
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Start Range:</span>
                <span className="ml-2 font-medium">
                  {clockInShiftEvent.vehicleRange} km
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Started:</span>
                <span className="ml-2 font-medium">
                  {formatDateTime(clockInShiftEvent.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* End Odometer */}
            <div className="space-y-2">
              <Label htmlFor="odometer" className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                End Odometer (km) *
              </Label>
              <Input
                id="odometer"
                type="number"
                min={clockInShiftEvent?.odometer ?? 0}
                value={formData.odometer}
                onChange={(e) => handleInputChange("odometer", e.target.value)}
                placeholder="Enter final odometer reading"
                required
              />
              {!!formData.odometer && !!currentShift.vehicle.latestOdometer && (
                <p className="text-sm text-muted-foreground">
                  Distance driven:{" "}
                  {formData.odometer - (clockInShiftEvent?.odometer ?? 0)} km
                </p>
              )}
            </div>

            {/* End Range */}
            <div className="space-y-2">
              <Label htmlFor="range" className="flex items-center gap-2">
                <Battery className="h-4 w-4" />
                End Range (km) *
              </Label>
              <Input
                id="range"
                type="number"
                value={formData.range}
                onChange={(e) => handleInputChange("range", e.target.value)}
                placeholder="Enter final range in km"
                required
              />
            </div>

            {/* Revenue */}
            <div className="space-y-2">
              <Label htmlFor="revenue" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue
              </Label>
              <Input
                id="revenue"
                type="number"
                step="0.01"
                value={formData.revenue}
                onChange={(e) => handleInputChange("revenue", e.target.value)}
                placeholder="Enter total revenue for this shift (GHS)"
              />
            </div>

            {/* Expenses */}
            <div className="space-y-2">
              <Label htmlFor="earnings" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Earnings
              </Label>
              <Input
                id="earnings"
                type="number"
                step="0.01"
                value={formData.earnings}
                onChange={(e) => handleInputChange("earnings", e.target.value)}
                placeholder="Enter earnings as indicated in the app (GHS)"
                required
              />
            </div>

            {/* Location Status */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              {location ? (
                <p className="text-sm text-green-600">
                  ✓ Location captured successfully
                </p>
              ) : locationError ? (
                <p className="text-sm text-red-600">✗ {locationError}</p>
              ) : (
                <p className="text-sm text-yellow-600">
                  ⏳ Getting your location...
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Any additional notes about this shift..."
              />
            </div>

            {errors.map((error) => (
              <Alert variant="destructive" className="mb-4">
                <AlertCircleIcon />
                <AlertTitle>An error occurred</AlertTitle>
                <AlertDescription>
                  <p>{error.message}</p>
                </AlertDescription>
              </Alert>
            ))}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={
                loading ||
                !location ||
                !formData.odometer ||
                !formData.range ||
                !formData.earnings ||
                !formData.revenue
              }
            >
              {loading && <Spinner />}
              Clock Out
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
