# frozen_string_literal: true

module Queries
  class ExpensesQuery < Resolvers::BaseResolver
    description "Get all expenses within a date range"

    argument :end_date, GraphQL::Types::ISO8601Date, required: false, description: "End date for the date range"
    argument :start_date, GraphQL::Types::ISO8601Date, required: false, description: "Start date for the date range"

    def scope(start_date: nil, end_date: nil)
      expenses = Expense.all
      if start_date && end_date
        expenses = expenses.where(date: start_date..end_date)
      elsif start_date
        expenses = expenses.where("date >= ?", start_date)
      elsif end_date
        expenses = expenses.where("date <= ?", end_date)
      end

      expenses.order(date: :desc, created_at: :desc)
    end
  end
end
