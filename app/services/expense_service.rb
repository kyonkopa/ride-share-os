# frozen_string_literal: true

class ExpenseService
  class << self
    # Aggregate expenses for the company within a date range
    #
    # @param start_date [Date] Start date of the period
    # @param end_date [Date] End date of the period
    # @return [Float] Total expenses for the period (converted from cents to decimal)
    def aggregate_expenses(start_date:, end_date:)
      expenses = Expense.where(date: start_date.beginning_of_day...end_date.end_of_day)

      # Sum expenses in cents, then convert to decimal
      total_cents = expenses.sum(:amount)
      total_cents / 100.0
    end
  end
end
