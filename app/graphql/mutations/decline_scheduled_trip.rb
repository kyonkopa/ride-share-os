# frozen_string_literal: true

module Mutations
  class DeclineScheduledTrip < Mutations::BaseMutation
    description "Decline a scheduled trip via secure token"

    argument :token, String, required: true, description: "Decline token"

    field :scheduled_trip, Types::ScheduledTripType, null: true

    def execute(token:)
      scheduled_trip = ScheduledTrip.find_by(decline_token: token)

      if scheduled_trip.nil?
        error!("Invalid or expired token", code: "INVALID_TOKEN", field: "token")
      end

      unless scheduled_trip.can_be_declined?
        error!("Trip cannot be declined in current state", code: "INVALID_STATE", field: "state")
      end

      # Set metadata for audit log
      scheduled_trip.log_state_change(
        reason: "Declined by client via secure link",
        metadata: { token_used: token }
      )

      # Trigger AASM event (will handle audit log and notification)
      begin
        scheduled_trip.decline!
      rescue AASM::InvalidTransition => e
        error!("Failed to decline trip: #{e.message}", code: "TRANSITION_ERROR", field: "state")
        return empty_response
      end

      { scheduled_trip: }
    end
  end
end
