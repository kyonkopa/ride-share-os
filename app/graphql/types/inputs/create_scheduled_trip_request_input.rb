# frozen_string_literal: true

module Types
  module Inputs
    class CreateScheduledTripRequestInput < Types::BaseInputObject
      description "Input type for creating a scheduled trip request"

      argument :client_email, String, required: true, description: "Client email address"
      argument :client_name, String, required: true, description: "Client full name"
      argument :client_phone, String, required: true, description: "Client phone number"
      argument :dropoff_location, String, required: true, description: "Drop-off location"
      argument :pickup_datetime, GraphQL::Types::ISO8601DateTime, required: true, description: "Pickup date and time"
      argument :pickup_location, String, required: true, description: "Pickup location"
      argument :recurrence_config, Types::Inputs::RecurrenceConfigInput, required: false, description: "Optional recurrence configuration"
    end
  end
end
