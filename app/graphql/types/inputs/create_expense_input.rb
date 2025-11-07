# frozen_string_literal: true

module Types
  module Inputs
    class CreateExpenseInput < Types::BaseInputObject
      description "Input type for creating an expense"

      argument :amount, Float, required: true, description: "Expense amount"
      argument :category, String, required: true, description: "Expense category"
      argument :date, GraphQL::Types::ISO8601Date, required: true, description: "Expense date"
      argument :receipt_key, String, required: false, description: "Receipt key for uploaded receipt (optional)"
      argument :vehicle_id, ID, required: false, description: "ID of the vehicle (optional)"
    end
  end
end
