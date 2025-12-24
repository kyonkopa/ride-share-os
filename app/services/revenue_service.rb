# frozen_string_literal: true

class RevenueService
  class << self
    # Aggregate revenue for the company within a date range
    #
    # @param start_date [Date] Start date of the period
    # @param end_date [Date] End date of the period
    # @param driver [Driver, nil] Optional driver object to filter revenue records
    # @param vehicle [Vehicle, nil] Optional vehicle object to filter revenue records
    # @return [Float] Total revenue for the period
    def aggregate_revenue(start_date:, end_date:, driver: nil, vehicle: nil)
      date_range = start_date.beginning_of_day..end_date.end_of_day

      revenue_records = RevenueRecord.where(realized_at: date_range)

      if driver.present?
        revenue_records = revenue_records.where(driver_id: driver.id)
      end

      if vehicle.present?
        revenue_records = revenue_records.where(vehicle_id: vehicle.id)
      end

      revenue_records.sum(:total_revenue).to_f
    end

    # Calculate company earnings for a date range
    # Earnings = Revenue - Total Payroll Due - Total Expenses
    #
    # @param start_date [Date] Start date of the period
    # @param end_date [Date] End date of the period
    # @return [Hash] Hash containing total_revenue, total_payroll_due, total_expenses, and earnings
    def calculate_company_earnings(start_date:, end_date:)
      total_revenue = aggregate_revenue(start_date:, end_date:)

      payroll_result = PayrollService.calculate_payroll(start_date:, end_date:)
      total_payroll_due = payroll_result[:total_amount_due].to_f

      total_expenses = ExpenseService.aggregate_expenses(start_date:, end_date:)

      earnings = total_revenue - total_payroll_due - total_expenses

      {
        total_revenue:,
        total_payroll_due:,
        total_expenses:,
        earnings:
      }
    end

    # Calculate overall revenue statistics
    # @return [Hash] Hash containing total_revenue_all_time, average_revenue_per_month, average_revenue_per_car
    def calculate_revenue_statistics
      total_revenue_all_time = RevenueRecord.sum(:total_revenue).to_f

      first_revenue = RevenueRecord.order(realized_at: :asc).first
      if first_revenue&.realized_at.present?
        months_count = ((Time.current - first_revenue.realized_at) / 1.month.to_f).ceil
        months_count = [months_count, 1].max # Ensure at least 1 month
        average_revenue_per_month = total_revenue_all_time / months_count.to_f
      else
        average_revenue_per_month = 0.0
      end

      vehicle_count = Vehicle.count
      average_revenue_per_car = vehicle_count > 0 ? total_revenue_all_time / vehicle_count.to_f : 0.0

      {
        total_revenue_all_time:,
        average_revenue_per_month:,
        average_revenue_per_car:
      }
    end
  end
end
