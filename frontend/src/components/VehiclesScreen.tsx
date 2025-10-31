import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useVehicles } from "@/features/clock-in/useVehicles"
import { Spinner } from "./ui/spinner"
import { Settings, Car, AlertCircleIcon } from "lucide-react"
import type { VehicleFragmentFragment } from "@/codegen/graphql"
import { VehicleSettingsDialog } from "./VehicleSettingsDialog"
import {
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty"
import { EmptyHeader } from "./ui/empty"
import { Empty } from "./ui/empty"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Badge } from "./ui/badge"

export function EmptyState() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Car />
        </EmptyMedia>
        <EmptyTitle>No vehicles found</EmptyTitle>
        <EmptyDescription>Add a vehicle to get started.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          Add Vehicle
        </Button>
      </EmptyContent>
    </Empty>
  )
}

export function VehiclesScreen() {
  const { vehicles, loading, error, refetch } = useVehicles()
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleFragmentFragment | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSettingsClick = (vehicle: VehicleFragmentFragment) => {
    setSelectedVehicle(vehicle)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedVehicle(null)
    // Refetch vehicles after update
    refetch()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Error loading vehicles.</AlertTitle>
        <AlertDescription>
          <p>Error: {error.message}</p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-sm text-muted-foreground">
            Manage your vehicle fleet
          </p>
        </div>
      </div>

      {/* Vehicle Cards Grid */}
      {vehicles.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    {vehicle.displayName}
                    {vehicle.inUse && (
                      <Badge className="ml-2 bg-blue-500">In use</Badge>
                    )}
                  </CardTitle>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleSettingsClick(vehicle)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Vehicle Image */}
                  {vehicle.vehicleImageUrl ? (
                    <div className="w-full lg:w-64 lg:flex-shrink-0 h-48 lg:h-auto lg:min-h-[200px] rounded-lg overflow-hidden bg-muted">
                      <img
                        src={vehicle.vehicleImageUrl}
                        alt={vehicle.displayName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-full lg:w-64 lg:flex-shrink-0 h-48 lg:h-auto lg:min-h-[200px] rounded-lg bg-muted flex items-center justify-center">
                      <Car className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}

                  {/* Vehicle Details */}
                  <div className="space-y-2 text-sm flex-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Make:</span>
                      <span className="font-medium">{vehicle.make}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-medium">{vehicle.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Year:</span>
                      <span className="font-medium">
                        {vehicle.yearOfManufacture}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        License Plate:
                      </span>
                      <span className="font-medium">
                        {vehicle.licensePlate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Odometer:</span>
                      <span className="font-medium">
                        {vehicle.latestOdometer.toLocaleString()} km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Range:</span>
                      <span className="font-medium">
                        {vehicle.latestRange} km
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Settings Dialog */}
      {selectedVehicle && (
        <VehicleSettingsDialog
          vehicle={selectedVehicle}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={handleDialogClose}
        />
      )}
    </div>
  )
}
