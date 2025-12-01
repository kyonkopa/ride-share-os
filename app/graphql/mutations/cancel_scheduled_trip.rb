# frozen_string_literal: true

module Mutations
  class CancelScheduledTrip < Mutations::BaseMutation
    description "Cancel a scheduled trip request (staff only)"

    argument :reason, String, required: false, description: "Optional reason for cancellation"
    argument :scheduled_trip_id, ID, required: true, description: "Global ID of the scheduled trip", loads: Types::ScheduledTripType

    field :scheduled_trip, Types::ScheduledTripType, null: true

    def execute(scheduled_trip:, reason: nil)
      unless current_user&.can?("scheduled_trip_write_access")
        error!("Unauthorized: Staff permission required", code: "UNAUTHORIZED", field: "base")
      end

      unless scheduled_trip.can_be_declined?
        error!("Trip cannot be cancelled in current state", code: "INVALID_STATE", field: "state")
      end

      cancel_reason = reason.presence || "Cancelled by staff"

      # Set metadata for audit log
      scheduled_trip.log_state_change(
        user: current_user,
        reason: cancel_reason,
        metadata: { cancelled_by: current_user.id, cancelled_at: Time.current }
      )

      begin
        scheduled_trip.decline!
      rescue AASM::InvalidTransition => e
        error!("Failed to cancel trip: #{e.message}", code: "TRANSITION_ERROR", field: "state")
      end

      { scheduled_trip: }
    end
  end
end
