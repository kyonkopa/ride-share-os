# frozen_string_literal: true

module Types
  module Inputs
    class ReviewScheduledTripInput < Types::BaseInputObject
      description "Input type for reviewing a scheduled trip"

      argument :notes, String, required: false, description: "Optional notes"
      argument :price, Float, required: true, description: "Confirmed price"
      argument :scheduled_trip_id, ID, required: true, description: "ID of the scheduled trip"
    end
  end
end
