# frozen_string_literal: true

module Mutations
  class CreateScheduledTripRequest < Mutations::BaseMutation
    description "Create a new scheduled trip request"

    argument :input, Types::Inputs::CreateScheduledTripRequestInput, required: true, description: "Input for creating a scheduled trip request"

    field :scheduled_trip, Types::ScheduledTripType, null: true

    def execute(input:)
      recurrence_config = {}
      if input[:recurrence_config]
        recurrence_config = {
          frequency: input[:recurrence_config][:frequency],
          interval: input[:recurrence_config][:interval] || 1,
          end_date: input[:recurrence_config][:end_date]&.to_s,
          occurrence_count: input[:recurrence_config][:occurrence_count],
          days_of_week: input[:recurrence_config][:days_of_week]
        }.compact
      end

      # Parse pickup_datetime
      pickup_datetime = if input[:pickup_datetime].is_a?(Time) || input[:pickup_datetime].is_a?(DateTime)
                          input[:pickup_datetime]
      else
                          Time.zone.parse(input[:pickup_datetime].to_s)
      end

      scheduled_trip = ScheduledTrip.new(
        client_name: input[:client_name],
        client_email: input[:client_email],
        client_phone: input[:client_phone],
        pickup_location: input[:pickup_location],
        dropoff_location: input[:dropoff_location],
        pickup_datetime:,
        recurrence_config:
      )

      unless scheduled_trip.save
        return validation_error_response(scheduled_trip)
      end

      # Log initial state (AASM sets initial state automatically)
      scheduled_trip.audit_logs.create!(
        previous_state: nil,
        new_state: "pending",
        change_reason: "Trip request created",
        metadata: {}
      )

      { scheduled_trip: }
    end
  end
end
