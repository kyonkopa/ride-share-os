# frozen_string_literal: true

module Types
  module Inputs
    class ClockOutInput < Types::BaseInputObject
      description "Input type for clocking out of a shift"

      argument :bolt_earnings, Float, required: false, description: "Bolt earnings for the shift"
      argument :gps_lat, Float, required: false, description: "GPS latitude"
      argument :gps_lon, Float, required: false, description: "GPS longitude"
      argument :notes, String, required: false, description: "Additional notes for the clock out event"
      argument :odometer, Integer, required: false, description: "Current odometer reading"
      argument :uber_earnings, Float, required: false, description: "Uber earnings for the shift"
      argument :vehicle_range, Integer, required: false, description: "Current vehicle range"
    end
  end
end
