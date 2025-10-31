# frozen_string_literal: true

module Mutations
  class UpdateVehicle < Mutations::BaseMutation
    description "Update vehicle details"

    argument :input, Types::Inputs::UpdateVehicleInput, required: true, description: "Input for updating a vehicle"
    argument :vehicle_id, ID, required: true, description: "ID of the vehicle to update", loads: Types::VehicleType

    field :vehicle, Types::VehicleType, null: true

    def execute(vehicle:, input:)
      update_params = input.to_h.compact

      vehicle.update!(update_params)
      vehicle.reload

      { vehicle: }
    end
  end
end
