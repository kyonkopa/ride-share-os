# frozen_string_literal: true

module Types
  module Inputs
    class ClockInInput < Types::BaseInputObject
      description "Input type for clocking in to a shift"

      argument :gps_lat, Float, required: false, description: "GPS latitude"
      argument :gps_lon, Float, required: false, description: "GPS longitude"
      argument :notes, String, required: false, description: "Additional notes for the clock in event"
      argument :odometer, Integer, required: false, description: "Current odometer reading"
      argument :shift_assignment_id, Integer, required: false, description: "ID of the shift assignment to clock into (optional - will auto-find active shift if not provided)"
      argument :vehicle_range, Integer, required: false, description: "Current vehicle range"
      argument :vehicle_id, ID, required: true, description: "ID of the vehicle to clock in to"
    end
  end
end
