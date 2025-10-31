import { useMutation } from "@apollo/client/react"
import { UpdateVehicleMutationDocument } from "@/codegen/graphql"
import { useNotification } from "@/hooks/useNotification"

interface UpdateVehicleInput {
  id: string
  make?: string
  model?: string
  licensePlate?: string
  yearOfManufacture?: number
  latestOdometer?: number
  latestRange?: number
  telematicsSource?: number
}

interface UseUpdateVehicleOptions {
  onSuccess?: () => void
}

export function useUpdateVehicle({ onSuccess }: UseUpdateVehicleOptions = {}) {
  const { addSuccess, addError } = useNotification()
  const [updateVehicle, { loading, error }] = useMutation(
    UpdateVehicleMutationDocument
  )

  const handleUpdate = async (input: UpdateVehicleInput) => {
    try {
      const result = await updateVehicle({
        variables: {
          vehicleId: input.id,
          input: {
            make: input.make,
            model: input.model,
            licensePlate: input.licensePlate,
            yearOfManufacture: input.yearOfManufacture,
            latestOdometer: input.latestOdometer,
            latestRange: input.latestRange,
            telematicsSource: input.telematicsSource,
          },
        },
      })

      const errors = result.data?.updateVehicle?.errors || []

      if (errors.length > 0) {
        errors.forEach((err) => {
          addError(err.message || "Failed to update vehicle")
        })
        return
      }

      if (result.data?.updateVehicle?.vehicle) {
        addSuccess("Vehicle updated successfully")
        onSuccess?.()
      }
    } catch (err) {
      addError(err instanceof Error ? err.message : "Failed to update vehicle")
    }
  }

  return {
    handleUpdate,
    loading,
    error,
  }
}
