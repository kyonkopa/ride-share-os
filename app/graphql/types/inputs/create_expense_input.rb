# frozen_string_literal: true

module Types
  module Inputs
    class CreateExpenseInput < Types::BaseInputObject
      description "Input type for creating an expense"

      argument :amount, Float, required: true, description: "Expense amount"
      argument :category, String, required: true, description: "Expense category"
      argument :date, GraphQL::Types::ISO8601Date, required: true, description: "Expense date"
      argument :description, String, required: false, description: "Description of the expense (required when category is 'other')"
      argument :override_warnings, Boolean, required: false, default_value: false, description: "Override warnings for duplicate expenses"
      argument :receipt_key, String, required: false, description: "Receipt key for uploaded receipt (optional)"
      argument :vehicle_id, ID, required: false, description: "ID of the vehicle (optional)"
    end
  end
end
