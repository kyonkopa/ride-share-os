# frozen_string_literal: true

module Types
  module Inputs
    class AssignDriverToScheduledTripInput < Types::BaseInputObject
      description "Input type for assigning a driver to a scheduled trip"

      argument :driver_id, String, required: true, description: "Global ID of the driver to assign"
    end
  end
end
