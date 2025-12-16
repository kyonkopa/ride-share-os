import { useEffect, useState } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Battery, Gauge, Receipt, Image } from "lucide-react"
import type {
  CurrentShiftFragmentFragment,
  ShiftEvent,
} from "@/codegen/graphql"
import { formatDateTime, getShiftDuration } from "@/utils/dateUtils"
import { Spinner } from "./ui/spinner"
import { useClockOutForm } from "@/features/clock-out/useClockOutForm"
import { useNotification } from "@/hooks/useNotification"

const DAILY_REVENUE_TARGET = 500 // GHS

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
  const { addSuccess } = useNotification()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors: formErrors },
    onSubmitForm,
    loading,
  } = useClockOutForm({
    open,
    shiftAssignmentId: currentShift.id,
    onSuccess: () => {
      addSuccess("Shift clocked out successfully")
      onOpenChange(false)
    },
  })

  const [location, setLocation] = useState<{
    latitude: number
    longitude: number
    address?: string
  } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Watch form values
  const boltEarnings = watch("boltEarnings")
  const uberEarnings = watch("uberEarnings")
  const boltEarningsScreenshot = watch("boltEarningsScreenshot")
  const uberEarningsScreenshot = watch("uberEarningsScreenshot")
  const odometer = watch("odometer")

  // Get current location only when modal is opened
  useEffect(() => {
    if (open && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          setLocation({
            latitude: lat,
            longitude: lon,
          })
          setValue("gpsLat", lat)
          setValue("gpsLon", lon)
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
  }, [open, setValue])

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Return as data URI format (data:image/png;base64,...)
        resolve(result)
      }
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (
    field: "boltEarningsScreenshot" | "uberEarningsScreenshot",
    file: File | null
  ) => {
    if (!file) {
      setValue(field, null)
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB")
      return
    }

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file)
      setValue(field, base64)
    } catch (error) {
      console.error("Error converting file to base64:", error)
      alert("Failed to process image. Please try again.")
    }
  }

  const onSubmit = async (data: Parameters<typeof onSubmitForm>[0]) => {
    if (!location) {
      alert("Location is required. Please enable location services.")
      return
    }
    await onSubmitForm(data)
  }

  const shiftDuration = getShiftDuration(clockInShiftEvent.createdAt)
  const totalRevenue = (Number(boltEarnings) || 0) + (Number(uberEarnings) || 0)
  const hasHitTarget = totalRevenue >= DAILY_REVENUE_TARGET

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                {...register("odometer", {
                  valueAsNumber: true,
                  setValueAs: (value) => (value === "" ? null : Number(value)),
                })}
                placeholder="Enter final odometer reading"
              />
              {formErrors.odometer && (
                <p className="text-sm text-red-600">
                  {formErrors.odometer.message}
                </p>
              )}
              {odometer !== null && !!currentShift?.vehicle?.latestOdometer && (
                <p className="text-sm text-muted-foreground">
                  Distance driven:{" "}
                  {odometer - (clockInShiftEvent?.odometer ?? 0)} km
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
                {...register("range", {
                  valueAsNumber: true,
                  setValueAs: (value) => (value === "" ? null : Number(value)),
                })}
                placeholder="Enter final range in km"
              />
              {formErrors.range && (
                <p className="text-sm text-red-600">
                  {formErrors.range.message}
                </p>
              )}
            </div>

            {/* Earnings Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Earnings</h3>

              {/* Bolt Card */}
              <Card className="border-dashed shadow-none gap-3">
                <CardHeader>
                  <CardTitle className="text-lg text-[#00D200]">Bolt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="bolt_earnings"
                      className="flex items-center gap-2"
                    >
                      <Receipt className="h-4 w-4" />
                      Earnings (GHS)
                    </Label>
                    <Input
                      id="bolt_earnings"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("boltEarnings", {
                        valueAsNumber: true,
                        setValueAs: (value) =>
                          value === "" ? null : Number(value),
                      })}
                      placeholder="Enter Bolt earnings as indicated in the app"
                    />
                    {formErrors.boltEarnings && (
                      <p className="text-sm text-red-600">
                        {formErrors.boltEarnings.message}
                      </p>
                    )}
                  </div>
                  {boltEarnings && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="bolt_earnings_screenshot"
                        className="flex items-center gap-2"
                      >
                        <Image className="h-4 w-4" />
                        Screenshot of earnings *
                      </Label>
                      <Input
                        id="bolt_earnings_screenshot"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileChange(
                            "boltEarningsScreenshot",
                            e.target.files?.[0] || null
                          )
                        }
                      />
                      {boltEarningsScreenshot && (
                        <p className="text-sm text-green-600">
                          ✓ Screenshot uploaded
                        </p>
                      )}
                      {formErrors.boltEarningsScreenshot && (
                        <p className="text-sm text-red-600">
                          {formErrors.boltEarningsScreenshot.message}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Uber Card */}
              <Card className="border-dashed shadow-none gap-2">
                <CardHeader>
                  <CardTitle className="text-lg">Uber</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid space-y-5">
                    <div>
                      <Label
                        htmlFor="uber_earnings"
                        className="flex items-center gap-2 mb-2"
                      >
                        <Receipt className="h-4 w-4" />
                        Earnings (GHS)
                      </Label>
                      <Input
                        id="uber_earnings"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("uberEarnings", {
                          valueAsNumber: true,
                          setValueAs: (value) =>
                            value === "" ? null : Number(value),
                        })}
                        placeholder="Enter Uber earnings as indicated in the app"
                      />
                      {formErrors.uberEarnings && (
                        <p className="text-sm text-red-600">
                          {formErrors.uberEarnings.message}
                        </p>
                      )}
                    </div>
                    {uberEarnings && (
                      <div>
                        <Label
                          htmlFor="uber_earnings_screenshot"
                          className="flex items-center gap-2 mb-2"
                        >
                          <Image className="h-4 w-4" />
                          Screenshot of earnings *
                        </Label>
                        <Input
                          id="uber_earnings_screenshot"
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileChange(
                              "uberEarningsScreenshot",
                              e.target.files?.[0] || null
                            )
                          }
                        />
                        {uberEarningsScreenshot && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ Screenshot uploaded
                          </p>
                        )}
                        {formErrors.uberEarningsScreenshot && (
                          <p className="text-sm text-red-600 mt-1">
                            {formErrors.uberEarningsScreenshot.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Target Achievement */}
            {hasHitTarget && (
              <div className="text-sm text-green-600">
                <span className="text-base">🏆</span>
                <span className="ml-2">
                  Congratulations! You've hit your daily revenue target of GHS{" "}
                  {DAILY_REVENUE_TARGET}
                </span>
              </div>
            )}

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
              ) : formErrors.gpsLat || formErrors.gpsLon ? (
                <p className="text-sm text-red-600">
                  ✗ {formErrors.gpsLat?.message || formErrors.gpsLon?.message}
                </p>
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
                {...register("notes")}
                placeholder="Any additional notes about this shift..."
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !location}
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
