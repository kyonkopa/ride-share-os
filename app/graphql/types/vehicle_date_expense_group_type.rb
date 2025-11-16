# frozen_string_literal: true

module Types
  class VehicleDateExpenseGroupType < Types::BaseObject
    description "A group of expenses for a specific vehicle and date"

    field :date, GraphQL::Types::ISO8601Date, null: false, description: "Date of the expenses"
    field :expense_count, Int, null: false, description: "Number of expenses in this group"
    field :expenses, [Types::ExpenseType], null: false, description: "List of expenses in this group"
    field :total_amount, Float, null: false, description: "Total amount of all expenses in this group (in dollars)"
    field :vehicle_id, String, null: false, description: "Vehicle ID (or 'no-vehicle' if no vehicle)"
    field :vehicle_name, String, null: false, description: "Vehicle display name (or 'No Vehicle' if no vehicle)"
  end
end
