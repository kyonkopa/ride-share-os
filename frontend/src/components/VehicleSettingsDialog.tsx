import { useState, useEffect } from "react"
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
import { Button } from "@/components/ui/button"
import { Spinner } from "./ui/spinner"
import { useUpdateVehicle } from "@/features/vehicles/useUpdateVehicle"
import type { VehicleFragmentFragment } from "@/codegen/graphql"

interface VehicleSettingsDialogProps {
  vehicle: VehicleFragmentFragment
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const TELEMATICS_SOURCES = [
  { value: 0, label: "Manual" },
  { value: 1, label: "GPS Tracker" },
  { value: 2, label: "OBD Device" },
  { value: 3, label: "Mobile App" },
]

export function VehicleSettingsDialog({
  vehicle,
  open,
  onOpenChange,
  onSuccess,
}: VehicleSettingsDialogProps) {
  const [formData, setFormData] = useState({
    make: vehicle.make || "",
    model: vehicle.model || "",
    licensePlate: vehicle.licensePlate || "",
    yearOfManufacture: vehicle.yearOfManufacture || new Date().getFullYear(),
    latestOdometer: vehicle.latestOdometer || 0,
    latestRange: vehicle.latestRange || 0,
    telematicsSource: vehicle.telematicsSource || 0,
  })

  useEffect(() => {
    if (open && vehicle) {
      setFormData({
        make: vehicle.make || "",
        model: vehicle.model || "",
        licensePlate: vehicle.licensePlate || "",
        yearOfManufacture:
          vehicle.yearOfManufacture || new Date().getFullYear(),
        latestOdometer: vehicle.latestOdometer || 0,
        latestRange: vehicle.latestRange || 0,
        telematicsSource: vehicle.telematicsSource || 0,
      })
    }
  }, [open, vehicle])

  const { handleUpdate, loading } = useUpdateVehicle({
    onSuccess: () => {
      onSuccess?.()
      onOpenChange(false)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleUpdate({
      id: vehicle.id,
      ...formData,
    })
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vehicle: {vehicle.displayName}</DialogTitle>
          <DialogDescription>
            Update vehicle details and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Make */}
          <div className="space-y-2">
            <Label htmlFor="make">Make *</Label>
            <Input
              id="make"
              type="text"
              value={formData.make}
              onChange={(e) => handleInputChange("make", e.target.value)}
              placeholder="e.g., Toyota"
              required
            />
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              type="text"
              value={formData.model}
              onChange={(e) => handleInputChange("model", e.target.value)}
              placeholder="e.g., Camry"
              required
            />
          </div>

          {/* License Plate */}
          <div className="space-y-2">
            <Label htmlFor="licensePlate">License Plate *</Label>
            <Input
              id="licensePlate"
              type="text"
              value={formData.licensePlate}
              onChange={(e) =>
                handleInputChange("licensePlate", e.target.value)
              }
              placeholder="e.g., ABC-123"
              required
            />
          </div>

          {/* Year of Manufacture */}
          <div className="space-y-2">
            <Label htmlFor="yearOfManufacture">Year of Manufacture *</Label>
            <Input
              id="yearOfManufacture"
              type="number"
              value={formData.yearOfManufacture}
              onChange={(e) =>
                handleInputChange(
                  "yearOfManufacture",
                  parseInt(e.target.value) || 0
                )
              }
              min="1900"
              max={new Date().getFullYear() + 1}
              required
            />
          </div>

          {/* Latest Odometer */}
          <div className="space-y-2">
            <Label htmlFor="latestOdometer">Latest Odometer (km) *</Label>
            <Input
              id="latestOdometer"
              type="number"
              value={formData.latestOdometer}
              onChange={(e) =>
                handleInputChange(
                  "latestOdometer",
                  parseInt(e.target.value) || 0
                )
              }
              min="0"
              required
            />
          </div>

          {/* Latest Range */}
          <div className="space-y-2">
            <Label htmlFor="latestRange">Latest Range (km) *</Label>
            <Input
              id="latestRange"
              type="number"
              value={formData.latestRange}
              onChange={(e) =>
                handleInputChange("latestRange", parseInt(e.target.value) || 0)
              }
              min="0"
              required
            />
          </div>

          {/* Telematics Source */}
          <div className="space-y-2">
            <Label htmlFor="telematicsSource">Telematics Source *</Label>
            <Select
              value={formData.telematicsSource.toString()}
              onValueChange={(value) =>
                handleInputChange("telematicsSource", parseInt(value))
              }
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select telematics source" />
              </SelectTrigger>
              <SelectContent>
                {TELEMATICS_SOURCES.map((source) => (
                  <SelectItem
                    key={source.value}
                    value={source.value.toString()}
                  >
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Updating...
                </>
              ) : (
                "Update Vehicle"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
