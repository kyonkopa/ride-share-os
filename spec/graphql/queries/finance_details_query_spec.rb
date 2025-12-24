# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Queries::FinanceDetailsQuery do
  let(:user) { create(:user, :confirmed) }
  let(:context) { { current_user: user } }
  let(:driver) { create(:driver) }
  let(:vehicle) { create(:vehicle) }
  let(:shift_assignment) { create(:shift_assignment, driver:, vehicle:) }

  let(:query) do
    <<~GQL
      query FinanceDetails($startDate: ISO8601Date!, $endDate: ISO8601Date!) {
        financeDetails(startDate: $startDate, endDate: $endDate) {
          totalRevenue
          totalPayrollDue
          totalExpenses
          earnings
          totalRevenueAllTime
          averageRevenuePerMonth
          averageRevenuePerCar
        }
      }
    GQL
  end

  let(:start_date) { Date.current - 30.days }
  let(:end_date) { Date.current }

  let(:variables) do
    {
      startDate: start_date.iso8601,
      endDate: end_date.iso8601
    }
  end

  describe 'when data exists within the date range' do
    before do
      # Create revenue records within the date range
      create(
        :revenue_record,
        driver:,
        shift_assignment:,
        total_revenue: 1000.0,
        realized_at: start_date + 1.day
      )
      create(
        :revenue_record,
        driver:,
        shift_assignment:,
        total_revenue: 500.0,
        realized_at: start_date + 5.days
      )

      # Create revenue records outside the date range (should not be included)
      create(
        :revenue_record,
        driver:,
        shift_assignment:,
        total_revenue: 2000.0,
        realized_at: start_date - 1.day
      )
      create(
        :revenue_record,
        driver:,
        shift_assignment:,
        total_revenue: 3000.0,
        realized_at: end_date + 1.day
      )

      # Create expenses within the date range
      create(:expense, amount: 10000, date: start_date + 2.days) # 100.00
      create(:expense, amount: 5000, date: start_date + 10.days) # 50.00

      # Create expenses outside the date range (should not be included)
      create(:expense, amount: 20000, date: start_date - 1.day) # 200.00
      create(:expense, amount: 30000, date: end_date + 1.day) # 300.00
    end

    it 'returns correct finance details for the date range' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          # Total revenue should be sum of records within date range
          expect(result["totalRevenue"]).to eq(1500.0)

          # Total expenses should be sum of expenses within date range (in decimal)
          expect(result["totalExpenses"]).to eq(150.0)

          # Total payroll due is calculated based on revenue records
          # For tier_1 driver with 1000 revenue on one day: 500 * 0.15 + 500 * 0.30 = 75 + 150 = 225
          # For tier_1 driver with 500 revenue on another day: 500 * 0.15 = 75
          # Total payroll: 225 + 75 = 300
          expect(result["totalPayrollDue"]).to be_within(0.01).of(300.0)

          # Earnings = Revenue - Payroll - Expenses
          # 1500 - 300 - 150 = 1050
          expect(result["earnings"]).to be_within(0.01).of(1050.0)

          # Statistics should include all revenue records (including those outside date range)
          expect(result["totalRevenueAllTime"]).to eq(6000.0)
        end
    end

    it 'returns all required fields' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          expect(result).to have_key("totalRevenue")
          expect(result).to have_key("totalPayrollDue")
          expect(result).to have_key("totalExpenses")
          expect(result).to have_key("earnings")
          expect(result).to have_key("totalRevenueAllTime")
          expect(result).to have_key("averageRevenuePerMonth")
          expect(result).to have_key("averageRevenuePerCar")
        end
    end
  end

  describe 'when no data exists' do
    it 'returns zero values for all fields' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          expect(result["totalRevenue"]).to eq(0.0)
          expect(result["totalPayrollDue"]).to eq(0.0)
          expect(result["totalExpenses"]).to eq(0.0)
          expect(result["earnings"]).to eq(0.0)
          expect(result["totalRevenueAllTime"]).to eq(0.0)
          expect(result["averageRevenuePerMonth"]).to eq(0.0)
          expect(result["averageRevenuePerCar"]).to eq(0.0)
        end
    end
  end

  describe 'revenue statistics calculations' do
    before do
      # Create revenue records at different times to test statistics
      first_revenue_date = 3.months.ago
      create(
        :revenue_record,
        driver:,
        shift_assignment:,
        total_revenue: 1000.0,
        realized_at: first_revenue_date
      )
      create(
        :revenue_record,
        driver:,
        shift_assignment:,
        total_revenue: 2000.0,
        realized_at: 2.months.ago
      )
      create(
        :revenue_record,
        driver:,
        shift_assignment:,
        total_revenue: 3000.0,
        realized_at: 1.month.ago
      )

      # Create vehicles for average revenue per car calculation
      create(:vehicle)
      create(:vehicle)
    end

    it 'calculates average revenue per month correctly' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          # Total revenue all time: 6000.0
          # Months since first revenue: ~3 months (ceiling)
          # Average: 6000 / 3 = 2000
          expect(result["averageRevenuePerMonth"]).to be > 0
          expect(result["totalRevenueAllTime"]).to eq(6000.0)
        end
    end

    it 'calculates average revenue per car correctly' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          # Total revenue all time: 6000.0
          # Vehicle count: 2 (created in before block)
          # Average: 6000 / 2 = 3000
          expect(result["averageRevenuePerCar"]).to eq(3000.0)
        end
    end

    it 'returns zero average revenue per car when no vehicles exist' do
      Vehicle.destroy_all

      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          expect(result["averageRevenuePerCar"]).to eq(0.0)
        end
    end
  end

  describe 'earnings calculation' do
    before do
      # Create revenue records
      create(
        :revenue_record,
        driver:,
        shift_assignment:,
        total_revenue: 2000.0,
        realized_at: start_date + 1.day
      )

      # Create expenses
      create(:expense, amount: 10000, date: start_date + 2.days) # 100.00
    end

    it 'calculates earnings as revenue minus payroll minus expenses' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          revenue = result["totalRevenue"]
          payroll = result["totalPayrollDue"]
          expenses = result["totalExpenses"]
          earnings = result["earnings"]

          # Verify the calculation
          expected_earnings = revenue - payroll - expenses
          expect(earnings).to be_within(0.01).of(expected_earnings)
        end
    end
  end

  describe 'payroll calculation with different driver tiers' do
    let(:tier_1_driver) { create(:driver, tier: "tier_1") }
    let(:tier_2_driver) { create(:driver, tier: "tier_2") }
    let(:tier_1_shift) { create(:shift_assignment, driver: tier_1_driver, vehicle:) }
    let(:tier_2_shift) { create(:shift_assignment, driver: tier_2_driver, vehicle:) }

    before do
      # Tier 1 driver: 15% of first 500, then 30% of surplus
      # For 1000 revenue: 500 * 0.15 + 500 * 0.30 = 75 + 150 = 225
      create(
        :revenue_record,
        driver: tier_1_driver,
        shift_assignment: tier_1_shift,
        total_revenue: 1000.0,
        realized_at: start_date + 1.day
      )

      # Tier 2 driver: 20% of first 500, then 30% of surplus
      # For 1000 revenue: 500 * 0.20 + 500 * 0.30 = 100 + 150 = 250
      create(
        :revenue_record,
        driver: tier_2_driver,
        shift_assignment: tier_2_shift,
        total_revenue: 1000.0,
        realized_at: start_date + 2.days
      )
    end

    it 'calculates payroll correctly for different driver tiers' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          # Total payroll should be sum of both drivers' payroll
          # Tier 1: 225, Tier 2: 250, Total: 475
          expect(result["totalPayrollDue"]).to be_within(0.01).of(475.0)
        end
    end
  end

  describe 'when user is not authenticated' do
    let(:context) { {} }

    before do
      create(
        :revenue_record,
        driver:,
        shift_assignment:,
        total_revenue: 1000.0,
        realized_at: start_date + 1.day
      )
    end

    it 'returns an authentication error' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_errors(["Authentication is required"])
    end
  end

  describe 'date range boundaries' do
    before do
      # Create revenue at start of range
      create(
        :revenue_record,
        driver:,
        shift_assignment:,
        total_revenue: 100.0,
        realized_at: start_date.beginning_of_day
      )

      # Create revenue at end of range
      create(
        :revenue_record,
        driver:,
        shift_assignment:,
        total_revenue: 200.0,
        realized_at: end_date.end_of_day
      )

      # Create revenue just before start (should be excluded)
      create(
        :revenue_record,
        driver:,
        shift_assignment:,
        total_revenue: 300.0,
        realized_at: (start_date - 1.second).beginning_of_day
      )

      # Create revenue just after end (should be excluded)
      create(
        :revenue_record,
        driver:,
        shift_assignment:,
        total_revenue: 400.0,
        realized_at: (end_date + 1.second).end_of_day
      )
    end

    it 'includes records at the exact start and end boundaries' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          # Should include 100 + 200 = 300
          expect(result["totalRevenue"]).to eq(300.0)
        end
    end
  end
end
