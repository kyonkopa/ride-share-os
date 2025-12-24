# frozen_string_literal: true

module Queries
  class FinanceDetailsTrendQuery < BaseQuery
    description "Get finance details trend for multiple months with projection"

    argument :include_projection, Boolean, required: false, default_value: true, description: "Whether to include next month projection (default: true)"
    argument :months_back, Integer, required: false, default_value: 5, description: "Number of months to look back (default: 5)"

    type [Types::FinanceDetailsTrendItemType], null: false

    def resolve(months_back:, include_projection:)
      now = Time.current
      all_results = []

      # Fetch 6 months of data for projection calculation (even if we only display 5)
      months_for_calculation = 6
      months_for_calculation.times do |i|
        month_start = (now - (months_for_calculation - i).months).beginning_of_month
        month_end = month_start.end_of_month

        finance_details = RevenueService.calculate_company_earnings(
          start_date: month_start.to_date,
          end_date: month_end.to_date
        )

        all_results << {
          month: month_start.strftime("%b %y"),
          start_date: month_start.to_date,
          end_date: month_end.to_date,
          is_projection: false,
          finance_details:
        }
      end

      # Calculate and add projection if requested (based on all 6 months)
      if include_projection
        # Calculate average revenue from all 6 months
        average_revenue = all_results.sum { |r| r[:finance_details][:total_revenue] } / all_results.size.to_f
        projected_revenue = average_revenue * 1.1

        # Calculate average expenses and payroll for projection
        average_expenses = all_results.sum { |r| r[:finance_details][:total_expenses] } / all_results.size.to_f
        average_payroll = all_results.sum { |r| r[:finance_details][:total_payroll_due] } / all_results.size.to_f

        projection_month_start = (now + 1.month).beginning_of_month
        projection_month_end = projection_month_start.end_of_month

        projected_earnings = projected_revenue - average_payroll - average_expenses

        all_results << {
          month: projection_month_start.strftime("%b %y") + " (Next)",
          start_date: projection_month_start.to_date,
          end_date: projection_month_end.to_date,
          is_projection: true,
          finance_details: {
            total_revenue: projected_revenue,
            total_payroll_due: average_payroll,
            total_expenses: average_expenses,
            earnings: projected_earnings
          }
        }
      end

      # Return only the most recent months_back months + projection (skip the oldest month)
      # This ensures we show 5 months + projection while using 6 months for calculation
      display_results = all_results.select { |r| !r[:is_projection] }.last(months_back)
      display_results << all_results.find { |r| r[:is_projection] } if include_projection

      display_results.compact
    end
  end
end
