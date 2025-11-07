# frozen_string_literal: true

module Types
  class RevenueStatsType < Types::BaseObject
    description "Statistics for revenue records"

    field :count, Integer, null: false, description: "Total count of revenue records"
    field :source_totals, GraphQL::Types::JSON, null: false, description: "Total revenue and profit grouped by source"
    field :total_profit, Float, null: false, description: "Total profit from all revenue records"
    field :total_revenue, Float, null: false, description: "Total revenue from all revenue records"
  end
end
