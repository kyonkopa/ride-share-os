# frozen_string_literal: true

module Types
  module Inputs
    class ScheduledTripsFilterInput < Types::BaseInputObject
      description "Input type for filtering scheduled trips"

      argument :client_email, String, required: false, description: "Filter by client email"
      argument :end_date, GraphQL::Types::ISO8601Date, required: false, description: "End date for date range filter"
      argument :recurring, Boolean, required: false, description: "Filter by recurring flag"
      argument :start_date, GraphQL::Types::ISO8601Date, required: false, description: "Start date for date range filter"
      argument :state, Types::Enums::ScheduledTripStateEnum, required: false, description: "Filter by state"
    end
  end
end
