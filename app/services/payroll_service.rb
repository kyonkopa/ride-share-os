# frozen_string_literal: true

class PayrollService
  # Daily revenue target in GHS for calculating driver commission tiers
  DAILY_DRIVER_REVENUE_TARGET = 500

  class << self
    # Calculate payroll for all drivers within a date range
    #
    # @param start_date [Date] Start date of the payroll period
    # @param end_date [Date] End date of the payroll period
    # @return [Hash] Hash containing total_amount_due and driver_payrolls array
    def calculate_payroll(start_date:, end_date:)
      date_range = start_date.beginning_of_day..end_date.end_of_day

      # Get all drivers who have shift assignments in the date range
      # Preload shift assignments and revenue records to avoid N+1 queries
      drivers_with_shifts = Driver.joins(:shift_assignments)
                                  .where(shift_assignments: { start_time: date_range })
                                  .distinct
                                  .includes(
                                    shift_assignments: :revenue_records,
                                    revenue_records: :shift_assignment
                                  )

      driver_payrolls = drivers_with_shifts.map do |driver|
        calculate_driver_payroll(driver:, start_date:, end_date:, date_range:)
      end

      # Calculate total amount due across all drivers
      total_amount_due = driver_payrolls.sum { |dp| dp[:amount_due] }

      {
        total_amount_due:,
        driver_payrolls:
      }
    end

    # Calculate payroll for a single driver within a date range
    #
    # @param driver [Driver] The driver to calculate payroll for
    # @param start_date [Date] Start date of the payroll period
    # @param end_date [Date] End date of the payroll period
    # @param date_range [Range] Optional pre-calculated date range for performance
    # @return [Hash] Hash containing driver, amount_due, start_date, and daily_breakdown
    def calculate_driver_payroll(driver:, start_date:, end_date:, date_range: nil)
      date_range ||= start_date.beginning_of_day..end_date.end_of_day

      daily_breakdown = calculate_daily_breakdown(driver:, date_range:)
      amount_due = daily_breakdown.sum { |day| day[:amount_due] }
      start_date_for_driver = find_driver_start_date(driver:, date_range:, fallback_date: start_date)

      {
        driver:,
        amount_due:,
        start_date: start_date_for_driver,
        daily_breakdown:
      }
    end

    private

    # Calculate daily breakdown for a driver by grouping revenue records by day
    # Returns an array of daily breakdowns with date, revenue, and amount_due
    #
    # @param driver [Driver] The driver
    # @param date_range [Range] Date range for filtering revenue records
    # @return [Array<Hash>] Array of hashes containing date, revenue, and amount_due
    def calculate_daily_breakdown(driver:, date_range:)
      # Get revenue records grouped by day (using shift_assignment.start_time date)
      daily_revenues = RevenueRecord.joins(:shift_assignment)
                                    .where(driver_id: driver.id)
                                    .where(shift_assignments: { start_time: date_range })
                                    .group("DATE(shift_assignments.start_time)")
                                    .sum(:total_revenue)

      # Convert to array of breakdowns sorted by date
      # The date_string from SQL GROUP BY DATE() is in 'YYYY-MM-DD' format
      daily_revenues.map do |date_string, revenue|
        {
          date: date_string.is_a?(String) ? Date.parse(date_string) : date_string.to_date,
          revenue: revenue.to_f,
          amount_due: calculate_amount_due(revenue.to_f)
        }
      end.sort_by { |breakdown| breakdown[:date] }
    end

    # Calculate amount due for a driver by grouping revenue records by day
    # For each day, sum revenue records and apply the formula, then sum all daily amounts
    #
    # @param driver [Driver] The driver
    # @param date_range [Range] Date range for filtering revenue records
    # @return [Float] Total amount due to the driver
    def calculate_amount_due_for_period(driver:, date_range:)
      daily_breakdown = calculate_daily_breakdown(driver:, date_range:)
      daily_breakdown.sum { |day| day[:amount_due] }
    end

    # Calculate amount due based on revenue for a single day
    # Formula:
    # - 15% of first GHS 500 (DAILY_DRIVER_REVENUE_TARGET)
    # - 30% of surplus above GHS 500 (DAILY_DRIVER_REVENUE_TARGET)
    #
    # @param daily_revenue [Float] Total revenue amount for a single day
    # @return [Float] Amount due to the driver for that day
    def calculate_amount_due(daily_revenue)
      if daily_revenue <= DAILY_DRIVER_REVENUE_TARGET
        daily_revenue * 0.15
      else
        (DAILY_DRIVER_REVENUE_TARGET * 0.15) + ((daily_revenue - DAILY_DRIVER_REVENUE_TARGET) * 0.30)
      end
    end

    # Find the earliest shift assignment start date for a driver in the date range
    #
    # @param driver [Driver] The driver
    # @param date_range [Range] Date range for filtering shift assignments
    # @param fallback_date [Date] Fallback date if no shift is found
    # @return [Date] Earliest shift start date or fallback date
    def find_driver_start_date(driver:, date_range:, fallback_date:)
      earliest_shift = driver.shift_assignments
                             .where(start_time: date_range)
                             .order(:start_time)
                             .first

      earliest_shift&.start_time&.to_date || fallback_date
    end
  end
end
