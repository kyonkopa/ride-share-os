# frozen_string_literal: true

module Mutations
  class PauseShift < Mutations::BaseMutation
    description "Pause an active shift assignment"

    field :shift_event, Types::ShiftEventType, null: true

    def execute
      error!("You do not have a driver profile", code: "NO_DRIVER_PROFILE") if current_user.driver.blank?

      shift_assignment = current_user.driver.shift_assignments.active.first

      if shift_assignment.nil?
        error!("No active shift found", code: "NO_ACTIVE_SHIFT", field: "shift_assignment_id")
        return empty_response
      end

      unless can_pause_shift?(shift_assignment)
        error!("You don't have permission to pause this shift", code: "PERMISSION_DENIED")
        return empty_response
      end

      if already_paused?(shift_assignment)
        error!("Shift is already paused", code: "ALREADY_PAUSED")
        return empty_response
      end

      shift_event = shift_assignment.shift_events.create!(
        event_type: :pause
      )

      shift_assignment.update!(status: :paused)

      { shift_event: }
    end

    private

    def can_pause_shift?(shift_assignment)
      current_user.driver.present? && current_user.driver.id == shift_assignment.driver.id
    end

    def already_paused?(shift_assignment)
      shift_assignment.status == "paused"
    end
  end
end
