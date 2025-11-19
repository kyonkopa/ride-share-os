# frozen_string_literal: true

module Mutations
  class ReviewScheduledTrip < Mutations::BaseMutation
    description "Review and confirm a scheduled trip request (staff only)"

    argument :input, Types::Inputs::ReviewScheduledTripInput, required: true, description: "Input for reviewing a scheduled trip"

    field :scheduled_trip, Types::ScheduledTripType, null: true

    def execute(input:)
      unless current_user&.can?("scheduled_trip_review")
        error!("Unauthorized: Staff permission required", code: "UNAUTHORIZED", field: "base")
        return empty_response
      end

      scheduled_trip = ScheduledTrip.find_by_global_id(input[:scheduled_trip_id])

      if scheduled_trip.nil?
        error!("Scheduled trip not found", code: "NOT_FOUND", field: "scheduled_trip_id")
      end

      unless scheduled_trip.pending?
        error!("Only pending trips can be reviewed", code: "INVALID_STATE", field: "state")
      end

      scheduled_trip.update!(
        price: input[:price],
        notes: input[:notes],
        reviewed_by: current_user,
        reviewed_at: Time.current
      )

      # Set metadata for audit log
      scheduled_trip.log_state_change(
        user: current_user,
        reason: "Reviewed and confirmed by staff",
        metadata: { price: input[:price], notes: input[:notes] }
      )

      # Trigger AASM event (will handle audit log and notification)
      scheduled_trip.confirm!

      { scheduled_trip: }
    end
  end
end
