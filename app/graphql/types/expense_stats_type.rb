# frozen_string_literal: true

module Types
  class ExpenseStatsType < Types::BaseObject
    description "Statistics for expenses"

    field :category_totals, GraphQL::Types::JSON, null: false, description: "Total expenses grouped by category"
    field :count, Integer, null: false, description: "Total count of expenses"
    field :total_amount, Float, null: false, description: "Total amount of expenses"
  end
end
