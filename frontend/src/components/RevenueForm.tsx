import { useState, useEffect, useRef } from "react"
import { Controller, useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { handleImageFileChange } from "@/utils/fileUtils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "./ui/spinner"
import { useRevenueForm } from "@/features/revenue-records/useRevenueForm"
import { useDrivers } from "@/features/drivers/useDrivers"
import { useVehicles } from "@/features/clock-in/useVehicles"
import { Calendar } from "./ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { ChevronDownIcon } from "lucide-react"
import { InlineErrorAlert } from "./ui/inline-error-alert"
import { Checkbox } from "./ui/checkbox"
import type {
  RevenueRecordsQueryQueryVariables,
  GroupedRevenueRecordsQueryQueryVariables,
} from "@/codegen/graphql"

interface RevenueFormProps {
  onOpenChange: (open: boolean) => void
  open: boolean
  onSuccess?: () => void
  revenueRecordsQueryVariables?: RevenueRecordsQueryQueryVariables
  groupedRevenueRecordsQueryVariables?: GroupedRevenueRecordsQueryQueryVariables
}

export function RevenueForm({
  open,
  onOpenChange,
  onSuccess,
  revenueRecordsQueryVariables,
  groupedRevenueRecordsQueryVariables,
}: RevenueFormProps) {
  const { drivers, loading: driversLoading } = useDrivers()
  const { vehicles, loading: vehiclesLoading } = useVehicles()
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    onSubmitForm,
    loading,
    mutationErrors,
  } = useRevenueForm({
    open,
    onSuccess: () => {
      onOpenChange(false)
      onSuccess?.()
    },
    revenueRecordsQueryVariables,
    groupedRevenueRecordsQueryVariables,
  })

  const earningsScreenshot = useWatch({ control, name: "earningsScreenshot" })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset file input when form is closed
  useEffect(() => {
    if (!open) {
      setValue("earningsScreenshot", null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [open, setValue])

  const handleFileChange = async (file: File | null) => {
    await handleImageFileChange(file, (value) => {
      setValue("earningsScreenshot", value)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add Revenue Record
          </DialogTitle>
          <DialogDescription>
            Record a new revenue record with the required information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          {/* Driver */}
          <div className="space-y-2">
            <Label htmlFor="driverId">Driver *</Label>
            <Controller
              name="driverId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={driversLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.length === 0 && !driversLoading && (
                      <SelectItem value="" disabled>
                        No drivers available
                      </SelectItem>
                    )}
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.globalId}>
                        {driver.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.driverId && (
              <p className="text-sm text-red-600">{errors.driverId.message}</p>
            )}
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="date-picker">Date *</Label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date-picker"
                      className="w-full justify-between font-normal"
                      type="button"
                    >
                      {field.value
                        ? new Date(field.value).toLocaleDateString()
                        : "Select date"}
                      <ChevronDownIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      disabled={(date) => date > new Date()}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(date)
                        }
                        setDatePickerOpen(false)
                      }}
                      timeZone="UTC"
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Vehicle */}
          <div className="space-y-2">
            <Label htmlFor="vehicleId">Vehicle</Label>
            <Controller
              name="vehicleId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={(value) => field.onChange(value || undefined)}
                  disabled={vehiclesLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a vehicle *" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.length === 0 && !vehiclesLoading && (
                      <SelectItem value="" disabled>
                        No vehicles available
                      </SelectItem>
                    )}
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.vehicleId && (
              <p className="text-sm text-red-600">{errors.vehicleId.message}</p>
            )}
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Source *</Label>
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bolt">Bolt</SelectItem>
                    <SelectItem value="uber">Uber</SelectItem>
                    <SelectItem value="off_trip">Off trip</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.source && (
              <p className="text-sm text-red-600">{errors.source.message}</p>
            )}
          </div>

          {/* Total Revenue */}
          <div className="space-y-2">
            <Label htmlFor="totalRevenue">Total Revenue (GHS) *</Label>
            <Input
              id="totalRevenue"
              type="text"
              placeholder="Enter total revenue"
              {...register("totalRevenue")}
            />
            {errors.totalRevenue && (
              <p className="text-sm text-red-600">
                {errors.totalRevenue.message}
              </p>
            )}
          </div>

          {/* Earnings Screenshot */}
          <div className="space-y-2">
            <Label htmlFor="earningsScreenshot">Earnings Screenshot *</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                id="earningsScreenshot"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  handleFileChange(file)
                }}
                className="flex-1"
              />
              {earningsScreenshot && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setValue("earningsScreenshot", null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""
                    }
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
            {earningsScreenshot && (
              <p className="text-sm text-muted-foreground">
                Screenshot selected
              </p>
            )}
            {errors.earningsScreenshot && (
              <p className="text-sm text-red-600">
                {errors.earningsScreenshot.message}
              </p>
            )}
          </div>

          {/* Reconciled */}
          <div className="flex items-start gap-3">
            <Controller
              name="reconciled"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="reconciled"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="reconciled">Reconciled</Label>
          </div>

          {/* Error Display */}
          {mutationErrors && mutationErrors.length > 0 && (
            <div className="space-y-2">
              {mutationErrors.map((error, index) => (
                <InlineErrorAlert key={index} message={error.message} />
              ))}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={
              loading || isSubmitting || driversLoading || vehiclesLoading
            }
          >
            {(loading || isSubmitting) && <Spinner className="mr-2" />}
            {loading || isSubmitting ? "Creating..." : "Submit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
