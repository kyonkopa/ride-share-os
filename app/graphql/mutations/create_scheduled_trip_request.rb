# frozen_string_literal: true

module Mutations
  class CreateScheduledTripRequest < Mutations::BaseMutation
    description "Create a new scheduled trip request"

    argument :input, Types::Inputs::CreateScheduledTripRequestInput, required: true, description: "Input for creating a scheduled trip request"

    field :scheduled_trip, Types::ScheduledTripType, null: true

    def execute(input:)
      scheduled_trip = ScheduledTrip.new(
        client_name: input[:client_name],
        client_email: input[:client_email],
        client_phone: input[:client_phone],
        pickup_location: input[:pickup_location],
        dropoff_location: input[:dropoff_location],
        pickup_datetime: parse_pickup_datetime(input[:pickup_datetime]),
        recurrence_config: build_recurrence_config(input[:recurrence_config])
      )

      return validation_error_response(scheduled_trip) unless scheduled_trip.save

      scheduled_trip.audit_logs.create!(
        previous_state: nil,
        new_state: "pending",
        change_reason: "Trip request created",
        metadata: {}
      )

      { scheduled_trip: }
    end

    private

    def build_recurrence_config(recurrence_input)
      return {} unless recurrence_input&.dig(:frequency).present?

      interval = [recurrence_input[:interval].to_i, 1].max
      occurrence_count = recurrence_input[:occurrence_count]&.to_i
      days_of_week = recurrence_input[:days_of_week]

      {
        frequency: recurrence_input[:frequency],
        interval:,
        end_date: recurrence_input[:end_date]&.to_s,
        occurrence_count: occurrence_count&.positive? ? occurrence_count : nil,
        days_of_week: days_of_week.is_a?(Array) && days_of_week.any? ? days_of_week : nil
      }.compact
    end

    def parse_pickup_datetime(datetime)
      return datetime if datetime.is_a?(Time) || datetime.is_a?(DateTime)

      Time.zone.parse(datetime.to_s)
    end
  end
end
