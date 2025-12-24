# frozen_string_literal: true

module Queries
  class FinanceDetailsQuery < BaseQuery
    description "Get finance details breakdown for a date range"

    argument :end_date, GraphQL::Types::ISO8601Date, required: true, description: "End date for the date range"
    argument :start_date, GraphQL::Types::ISO8601Date, required: true, description: "Start date for the date range"

    type Types::FinanceDetailsType, null: false

    def resolve(start_date:, end_date:)
      earnings_data = RevenueService.calculate_company_earnings(start_date:, end_date:)
      statistics = RevenueService.calculate_revenue_statistics

      earnings_data.merge(statistics)
    end
  end
end
