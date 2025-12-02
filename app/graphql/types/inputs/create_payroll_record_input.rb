# frozen_string_literal: true

module Types
  module Inputs
    class CreatePayrollRecordInput < Types::BaseInputObject
      description "Input type for creating a payroll record"

      argument :amount_paid, Float, required: true, description: "Amount paid to the driver"
      argument :driver_id, ID, required: true, loads: Types::DriverType, description: "ID of the driver being paid"
      argument :notes, String, required: false, description: "Optional notes about the payment"
      argument :paid_at, GraphQL::Types::ISO8601DateTime, required: false, description: "When the payment was made (defaults to now)"
      argument :period_end_date, GraphQL::Types::ISO8601Date, required: true, description: "End date of the payroll period"
      argument :period_start_date, GraphQL::Types::ISO8601Date, required: true, description: "Start date of the payroll period"
    end
  end
end
