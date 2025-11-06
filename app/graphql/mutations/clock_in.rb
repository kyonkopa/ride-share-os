# frozen_string_literal: true

module Mutations
  class ClockIn < Mutations::BaseMutation
    description "Clock in to a shift assignment"

    argument :input, Types::Inputs::ClockInInput, required: true, description: "Input for clocking in"
    argument :vehicle_id, ID, required: true, description: "ID of the vehicle to clock in to", loads: Types::VehicleType

    field :shift_event, Types::ShiftEventType, null: true

    def execute(vehicle:, input:)
      error!("You do not have a driver profile", code: "NO_DRIVER_PROFILE") if current_user.driver.blank?

      shift_assignment = if input[:shift_assignment_id]
         ShiftAssignment.find_by(id: input[:shift_assignment_id])
      else
        current_user.driver.shift_assignments.scheduled_today.first
      end

      if shift_assignment.nil?
        error!("You do not have a shift assignment for today, please check your schedule or contact your manager", code: "NO_SHIFT_ASSIGNMENT_FOR_TODAY", field: "shift_assignment_id")
        return empty_response
      end

      unless can_clock_into_shift?(shift_assignment)
        error!("You don't have permission to clock into this shift", code: "PERMISSION_DENIED")
        return empty_response
      end

      if already_clocked_in?(shift_assignment)
        error!("Already clocked in to this shift", code: "ALREADY_CLOCKED_IN")
        return empty_response
      end

      if vehicle_in_use?(vehicle)
        error!("Vehicle is already in use", code: "VEHICLE_IN_USE")
        return empty_response
      end

      shift_event = shift_assignment.shift_events.create!(
        event_type: :clock_in,
        odometer: input[:odometer],
        vehicle_range: input[:vehicle_range],
        gps_lat: input[:gps_lat],
        gps_lon: input[:gps_lon],
        notes: input[:notes]
      )

      shift_assignment.update!(status: :active, vehicle:)
      vehicle_updates = { latest_odometer: input[:odometer] }
      vehicle_updates[:latest_range] = input[:vehicle_range] if input[:vehicle_range].present?
      vehicle.update!(vehicle_updates)

      { shift_event: }
    end

    private

    def can_clock_into_shift?(shift_assignment)
      current_user.driver.present? && current_user.driver.id == shift_assignment.driver.id
    end

    def already_clocked_in?(shift_assignment)
      shift_assignment.shift_events.exists?(event_type: :clock_in)
    end

    def vehicle_in_use?(vehicle)
      vehicle.in_use?
    end
  end
end
