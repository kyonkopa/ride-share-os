# frozen_string_literal: true

module Queries
  class RevenueStatsQuery < BaseQuery
    description "Get revenue statistics within a date range"

    argument :end_date, GraphQL::Types::ISO8601Date, required: false, description: "End date for the date range"
    argument :start_date, GraphQL::Types::ISO8601Date, required: false, description: "Start date for the date range"

    type Types::RevenueStatsType, null: false

    def resolve(start_date: nil, end_date: nil)
      records = RevenueRecord.all

      if start_date && end_date
        records = records.where(created_at: start_date.beginning_of_day..end_date.end_of_day)
      elsif start_date
        records = records.where("created_at >= ?", start_date.beginning_of_day)
      elsif end_date
        records = records.where("created_at <= ?", end_date.end_of_day)
      end

      total_revenue = records.sum(:total_revenue).to_f
      total_profit = records.sum(:total_profit).to_f
      count = records.count

      # Group by source - calculate revenue and profit totals per source
      source_totals = {}
      revenue_by_source = records.group(:source).sum(:total_revenue)
      profit_by_source = records.group(:source).sum(:total_profit)

      revenue_by_source.each do |source, revenue|
        source_name = RevenueRecord.sources.key(source)
        profit = profit_by_source[source] || 0
        source_totals[source_name] = {
          revenue: revenue.to_f,
          profit: profit.to_f
        }
      end

      {
        total_revenue:,
        total_profit:,
        count:,
        source_totals:
      }
    end
  end
end
