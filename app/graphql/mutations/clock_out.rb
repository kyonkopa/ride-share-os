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

      # Use shift assignment start_time date for realized_at
      revenue_realized_at = shift_assignment.start_time.beginning_of_day

      # Create revenue record for Bolt if earnings provided
      if input[:bolt_earnings].present?
        RevenueRecord.create!(
          shift_assignment:,
          driver: current_user.driver,
          vehicle: shift_assignment.vehicle,
          total_revenue: input[:bolt_earnings],
          source: :bolt,
          earnings_screenshot: normalize_base64_image(input[:bolt_earnings_screenshot]),
          realized_at: revenue_realized_at
        )
      end

      # Create revenue record for Uber if earnings provided
      if input[:uber_earnings].present?
        RevenueRecord.create!(
          shift_assignment:,
          driver: current_user.driver,
          vehicle: shift_assignment.vehicle,
          total_revenue: input[:uber_earnings],
          source: :uber,
          earnings_screenshot: normalize_base64_image(input[:uber_earnings_screenshot]),
          realized_at: revenue_realized_at
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

    def normalize_base64_image(base64_image)
      return nil if base64_image.blank?

      # If it's a data URI (data:image/png;base64,...), extract just the base64 part
      # Otherwise, assume it's already just base64
      if base64_image.start_with?("data:")
        base64_image.split(",").last
      else
        base64_image
      end
    end
  end
end
