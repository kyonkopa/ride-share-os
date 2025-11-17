# frozen_string_literal: true

module Types
  class GroupedRevenueRecordsResultType < Types::BaseObject
    description "Paginated result for grouped revenue records with statistics"

    field :errors, [Types::ErrorType], null: false
    field :items, [Types::DriverDateRevenueGroupType], null: false
    field :pagination, Types::PaginationType, null: false
    field :source_totals, GraphQL::Types::JSON, null: false, description: "Total revenue and profit grouped by source"
    field :total_profit, Float, null: false, description: "Total profit of all revenue records"
    field :total_revenue, Float, null: false, description: "Total revenue of all revenue records"
  end
end
