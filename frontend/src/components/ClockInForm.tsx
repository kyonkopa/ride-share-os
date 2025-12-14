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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin, Gauge } from "lucide-react"
import {
  useClockInMutation,
  type ClockInFormData,
} from "@/features/clock-in/useClockInMutation"
import { Spinner } from "./ui/spinner"
import { useNotification } from "@/hooks/useNotification"
import type { VehicleFragmentFragment } from "@/codegen/graphql"
import { InlineErrorAlert } from "./ui/inline-error-alert"

interface ClockInFormProps {
  vehicles: VehicleFragmentFragment[]
  onClockInSuccess?: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClockInForm({
  vehicles,
  onClockInSuccess,
  open,
  onOpenChange,
}: ClockInFormProps) {
  const { addSuccess } = useNotification()
  const {
    handleClockIn,
    errors,
    loading,
    shiftAssignmentNotFoundError,
    permissionDeniedError,
    alreadyClockeInError,
    validationErrors,
  } = useClockInMutation({
    onSuccess: () => {
      setFormData({
        vehicleId: "",
        odometer: "",
        notes: "",
      })
      addSuccess("Shift clocked in successfully")
      onOpenChange(false)
      onClockInSuccess?.()
    },
  })

  const [formData, setFormData] = useState({
    vehicleId: "",
    odometer: "",
    notes: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.vehicleId || !formData.odometer) {
      alert("Please fill in all required fields")
      return
    }

    if (!location) {
      alert("Location is required. Please enable location services.")
      return
    }

    const clockInData: ClockInFormData = {
      vehicleId: formData.vehicleId,
      odometer: parseFloat(formData.odometer),
      location: {
        ...location,
        timestamp: Date.now(),
      },
      notes: formData.notes || undefined,
    }

    await handleClockIn(clockInData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Clock In
          </DialogTitle>
          <DialogDescription>
            Start your shift by confirming your vehicle and current status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vehicle Selection */}
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle *</Label>
              <Select
                value={formData.vehicleId}
                onValueChange={(value) => handleInputChange("vehicleId", value)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Odometer */}
            <div className="space-y-2">
              <Label htmlFor="odometer" className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Start Odometer (km) *
              </Label>
              <Input
                id="odometer"
                type="number"
                value={formData.odometer}
                onChange={(e) => handleInputChange("odometer", e.target.value)}
                placeholder="Enter current odometer reading"
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
                placeholder="Any additional notes..."
              />
            </div>

            {/* Error Display */}
            {errors.length > 0 && (
              <div className="space-y-2">
                {shiftAssignmentNotFoundError && (
                  <InlineErrorAlert
                    message={shiftAssignmentNotFoundError.message}
                  />
                )}
                {permissionDeniedError && (
                  <InlineErrorAlert message={permissionDeniedError.message} />
                )}
                {alreadyClockeInError && (
                  <InlineErrorAlert
                    message={alreadyClockeInError.message}
                    variant="warning"
                  />
                )}
                {validationErrors.map((error, index) => (
                  <InlineErrorAlert key={index} message={error.message} />
                ))}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={
                loading ||
                !location ||
                !formData.vehicleId ||
                !formData.odometer
              }
            >
              {loading && <Spinner />}
              {loading ? "Clocking In..." : "Clock In"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
