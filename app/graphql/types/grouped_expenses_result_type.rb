# frozen_string_literal: true

module Types
  class GroupedExpensesResultType < Types::BaseObject
    description "Paginated result for grouped expenses with statistics"

    field :category_totals, GraphQL::Types::JSON, null: false, description: "Total expenses grouped by category"
    field :errors, [Types::ErrorType], null: false
    field :items, [Types::VehicleDateExpenseGroupType], null: false
    field :pagination, Types::PaginationType, null: false
    field :total_amount, Float, null: false, description: "Total amount of all expenses"
  end
end
