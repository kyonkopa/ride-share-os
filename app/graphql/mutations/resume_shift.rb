# frozen_string_literal: true

module Mutations
  class ResumeShift < Mutations::BaseMutation
    description "Resume a paused shift assignment"

    field :shift_event, Types::ShiftEventType, null: true

    def execute
      error!("You do not have a driver profile", code: "NO_DRIVER_PROFILE") if current_user.driver.blank?

      shift_assignment = current_user.driver.shift_assignments.paused.first

      if shift_assignment.nil?
        error!("No paused shift found", code: "NO_PAUSED_SHIFT", field: "shift_assignment_id")
        return empty_response
      end

      unless can_resume_shift?(shift_assignment)
        error!("You don't have permission to resume this shift", code: "PERMISSION_DENIED")
        return empty_response
      end

      unless was_paused?(shift_assignment)
        error!("Shift is not paused", code: "NOT_PAUSED")
        return empty_response
      end

      shift_event = shift_assignment.shift_events.create!(
        event_type: :resume
      )

      shift_assignment.update!(status: :active)

      { shift_event: }
    end

    private

    def can_resume_shift?(shift_assignment)
      current_user.driver.present? && current_user.driver.id == shift_assignment.driver.id
    end

    def was_paused?(shift_assignment)
      shift_assignment.status == "paused"
    end
  end
end
