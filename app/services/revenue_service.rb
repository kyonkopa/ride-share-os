# frozen_string_literal: true

class RevenueService
  class << self
    # Aggregate revenue for the company within a date range
    #
    # @param start_date [Date] Start date of the period
    # @param end_date [Date] End date of the period
    # @return [Float] Total revenue for the period
    def aggregate_revenue(start_date:, end_date:)
      date_range = start_date.beginning_of_day..end_date.end_of_day

      RevenueRecord.where(created_at: date_range).sum(:total_revenue).to_f
    end

    # Calculate company earnings for a date range
    # Earnings = Revenue - Total Payroll Due - Total Expenses
    #
    # @param start_date [Date] Start date of the period
    # @param end_date [Date] End date of the period
    # @return [Hash] Hash containing total_revenue, total_payroll_due, total_expenses, and earnings
    def calculate_company_earnings(start_date:, end_date:)
      total_revenue = aggregate_revenue(start_date:, end_date:)

      # Get total payroll due from PayrollService
      payroll_result = PayrollService.calculate_payroll(start_date:, end_date:)
      total_payroll_due = payroll_result[:total_amount_due].to_f

      # Get total expenses from ExpenseService
      total_expenses = ExpenseService.aggregate_expenses(start_date:, end_date:)

      # Calculate earnings
      earnings = total_revenue - total_payroll_due - total_expenses

      {
        total_revenue:,
        total_payroll_due:,
        total_expenses:,
        earnings:
      }
    end
  end
end
