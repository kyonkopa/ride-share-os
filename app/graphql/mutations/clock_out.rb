# frozen_string_literal: true

module Mutations
  class ClockOut < Mutations::BaseMutation
    description "Clock out of a shift assignment"

    argument :input, Types::Inputs::ClockOutInput, required: true, description: "Input for clocking out"

    field :shift_event, Types::ShiftEventType, null: true

    def execute(input:)
      error!("You do not have a driver profile", code: "NO_DRIVER_PROFILE") if current_user.driver.blank?

      shift_assignment = current_user.driver.shift_assignments.active.first

      if shift_assignment.nil?
        error!("Shift assignment not found", code: "SHIFT_ASSIGNMENT_NOT_FOUND", field: "shift_assignment_id")
        return empty_response
      end

      unless can_clock_out_of_shift?(shift_assignment)
        error!("You don't have permission to clock out of this shift", code: "PERMISSION_DENIED")
        return empty_response
      end

      if already_clocked_out?(shift_assignment)
        error!("Already clocked out of this shift", code: "ALREADY_CLOCKED_OUT")
        return empty_response
      end

      unless clocked_in?(shift_assignment)
        error!("Must clock in before clocking out", code: "NOT_CLOCKED_IN")
        return empty_response
      end

      shift_event = shift_assignment.shift_events.create!(
        event_type: :clock_out,
        odometer: input[:odometer],
        vehicle_range: input[:vehicle_range],
        gps_lat: input[:gps_lat],
        gps_lon: input[:gps_lon],
        notes: input[:notes]
      )

      # Create revenue record for Bolt if earnings provided
      if input[:bolt_earnings].present?
        RevenueRecord.create!(
          shift_assignment:,
          driver: current_user.driver,
          total_revenue: input[:bolt_earnings],
          source: :bolt
        )
      end

      # Create revenue record for Uber if earnings provided
      if input[:uber_earnings].present?
        RevenueRecord.create!(
          shift_assignment:,
          driver: current_user.driver,
          total_revenue: input[:uber_earnings],
          source: :uber
        )
      end

      shift_assignment.update!(status: :completed)

      { shift_event: }
    end

    private

    def can_clock_out_of_shift?(shift_assignment)
      current_user.driver.present? && current_user.driver.id == shift_assignment.driver.id
    end

    def already_clocked_out?(shift_assignment)
      shift_assignment.shift_events.exists?(event_type: :clock_out)
    end

    def clocked_in?(shift_assignment)
      shift_assignment.shift_events.exists?(event_type: :clock_in)
    end
  end
end
