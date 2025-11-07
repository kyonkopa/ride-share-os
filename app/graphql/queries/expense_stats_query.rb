# frozen_string_literal: true

module Queries
  class ExpenseStatsQuery < BaseQuery
    description "Get expense statistics within a date range"

    argument :end_date, GraphQL::Types::ISO8601Date, required: false, description: "End date for the date range"
    argument :start_date, GraphQL::Types::ISO8601Date, required: false, description: "Start date for the date range"

    type Types::ExpenseStatsType, null: false

    def resolve(start_date: nil, end_date: nil)
      expenses = Expense.all

      if start_date && end_date
        expenses = expenses.where(date: start_date..end_date)
      elsif start_date
        expenses = expenses.where("date >= ?", start_date)
      elsif end_date
        expenses = expenses.where("date <= ?", end_date)
      end

      # Sum amounts in cents, then convert to dollars
      total_amount_cents = expenses.sum(:amount)
      total_amount = total_amount_cents / 100.0
      count = expenses.count

      # Group by category - amounts are in cents, convert to dollars
      category_totals_cents = expenses.group(:category).sum(:amount)
      category_totals = category_totals_cents.transform_keys(&:to_s).transform_values { |cents| cents / 100.0 }

      {
        total_amount:,
        count:,
        category_totals:
      }
    end
  end
end
