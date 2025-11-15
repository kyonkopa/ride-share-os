# frozen_string_literal: true

module Types
  module Inputs
    class CreateRevenueRecordInput < Types::BaseInputObject
      description "Input type for creating a revenue record"

      argument :date, GraphQL::Types::ISO8601Date, required: true, description: "Date of the revenue record"
      argument :driver_id, ID, required: true, description: "ID of the driver"
      argument :reconciled, Boolean, required: false, description: "Whether the revenue is reconciled (default: false)"
      argument :source, Types::Enums::RevenueSourceEnum, required: true, description: "Revenue source (bolt, uber, or off_trip)"
      argument :total_revenue, Float, required: true, description: "Total revenue amount"
      argument :vehicle_id, ID, required: true, description: "ID of the vehicle"
    end
  end
end
