# frozen_string_literal: true

module Types
  module Inputs
    class UpdateVehicleInput < Types::BaseInputObject
      description "Input type for updating a vehicle"

      argument :latest_odometer, Integer, required: false, description: "Latest odometer reading"
      argument :latest_range, Integer, required: false, description: "Latest vehicle range"
      argument :license_plate, String, required: false, description: "Vehicle license plate"
      argument :make, String, required: false, description: "Vehicle make"
      argument :model, String, required: false, description: "Vehicle model"
      argument :telematics_source, Integer, required: false, description: "Telematics source"
      argument :year_of_manufacture, Integer, required: false, description: "Year of manufacture"
    end
  end
end
