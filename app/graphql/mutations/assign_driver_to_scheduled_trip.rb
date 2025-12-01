# frozen_string_literal: true

module Mutations
  class AssignDriverToScheduledTrip < Mutations::BaseMutation
    description "Assign a driver to a pending scheduled trip request"

    argument :input, Types::Inputs::AssignDriverToScheduledTripInput, required: true, description: "Input for assigning a driver"
    argument :scheduled_trip_id, ID, required: true, description: "Global ID of the scheduled trip", loads: Types::ScheduledTripType

    field :scheduled_trip, Types::ScheduledTripType, null: true

    def execute(scheduled_trip:, input:)
      unless current_user&.can?("scheduled_trip_write_access")
        error!("Access denied: Staff permission required", code: "ACCESS_DENIED", field: "base")
        return empty_response
      end

      unless scheduled_trip.pending?
        error!("Only pending trips can have drivers assigned", code: "INVALID_STATE", field: "state")
        return empty_response
      end

      driver = Driver.find_by_global_id(input[:driver_id])

      if driver.nil?
        error!("Driver not found", code: "NOT_FOUND", field: "driver_id")
        return empty_response
      end

      scheduled_trip.update!(driver:)

      scheduled_trip.audit_logs.create!(
        previous_state: scheduled_trip.state,
        new_state: scheduled_trip.state,
        changed_by: current_user,
        change_reason: "Driver assigned",
        metadata: { driver_id: driver.id, driver_name: driver.full_name }
      )

      { scheduled_trip: }
    end
  end
end
