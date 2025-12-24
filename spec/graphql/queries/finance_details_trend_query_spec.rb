# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Queries::FinanceDetailsTrendQuery do
  let(:user) { create(:user, :confirmed) }
  let(:context) { { current_user: user } }
  let(:driver) { create(:driver) }

  let(:query) do
    <<~GQL
      query FinanceDetailsTrend($monthsBack: Int, $includeProjection: Boolean) {
        financeDetailsTrend(monthsBack: $monthsBack, includeProjection: $includeProjection) {
          month
          startDate
          endDate
          isProjection
          financeDetails {
            totalRevenue
            totalPayrollDue
            totalExpenses
            earnings
          }
        }
      }
    GQL
  end

  let(:variables) { {} }

  describe 'with default arguments' do
    before do
      # Create revenue records for the past 6 months to enable projection calculation
      # The query fetches 6 months of data but only displays 5 (skipping the oldest)
      6.times do |i|
        month_start = (Time.current - (6 - i).months).beginning_of_month
        shift = create(:shift_assignment, driver:, start_time: month_start + 8.hours)
        create(
          :revenue_record,
          driver:,
          shift_assignment: shift,
          total_revenue: 1000.0 + (i * 100.0),
          created_at: month_start + 10.hours
        )
        create(:expense, amount: 10000, date: month_start) # 100.00
      end
    end

    it 'returns 5 months of data plus projection' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |results, _full_result|
          # Should return 5 months + 1 projection = 6 items
          expect(results.length).to eq(6)

          # All but the last should be non-projections
          non_projections = results.select { |r| !r["isProjection"] }
          expect(non_projections.length).to eq(5)

          # Last item should be a projection
          projection = results.find { |r| r["isProjection"] }
          expect(projection).to be_present
          expect(projection["month"]).to include("(Next)")
        end
    end

    it 'returns correct structure for each item', :aggregate_failures do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |results, _full_result|
          result = results.first
          expect(result).to have_key("month")
          expect(result).to have_key("startDate")
          expect(result).to have_key("endDate")
          expect(result).to have_key("isProjection")
          expect(result).to have_key("financeDetails")
          expect(result["financeDetails"]).to have_key("totalRevenue")
          expect(result["financeDetails"]).to have_key("totalPayrollDue")
          expect(result["financeDetails"]).to have_key("totalExpenses")
          expect(result["financeDetails"]).to have_key("earnings")
        end
    end

    it 'calculates projection based on average of 6 months' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |results, _full_result|
          projection = results.find { |r| r["isProjection"] }
          expect(projection).to be_present

          # Average revenue from 6 months: (1000 + 1100 + 1200 + 1300 + 1400 + 1500) / 6 = 1250
          # Projected revenue: 1250 * 1.1 = 1375
          expect(projection["financeDetails"]["totalRevenue"]).to be_within(0.01).of(1375.0)
        end
    end
  end

  describe 'with custom months_back' do
    let(:variables) { { monthsBack: 3 } }

    before do
      # Create revenue records for the past 6 months
      6.times do |i|
        month_start = (Time.current - (6 - i).months).beginning_of_month
        shift = create(:shift_assignment, driver:, start_time: month_start + 8.hours)
        create(
          :revenue_record,
          driver:,
          shift_assignment: shift,
          total_revenue: 1000.0,
          created_at: month_start + 10.hours
        )
      end
    end

    it 'returns only the specified number of months plus projection' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |results, _full_result|
          # Should return 3 months + 1 projection = 4 items
          non_projections = results.select { |r| !r["isProjection"] }
          expect(non_projections.length).to eq(3)

          projection = results.find { |r| r["isProjection"] }
          expect(projection).to be_present
        end
    end
  end

  describe 'with include_projection: false' do
    let(:variables) { { includeProjection: false } }

    before do
      # Create revenue records for the past 6 months
      6.times do |i|
        month_start = (Time.current - (6 - i).months).beginning_of_month
        shift = create(:shift_assignment, driver:, start_time: month_start + 8.hours)
        create(
          :revenue_record,
          driver:,
          shift_assignment: shift,
          total_revenue: 1000.0,
          created_at: month_start + 10.hours
        )
      end
    end

    it 'returns only months without projection' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |results, _full_result|
          # Should return 5 months only (no projection)
          expect(results.length).to eq(5)
          expect(results.all? { |r| !r["isProjection"] }).to be true
        end
    end
  end

  describe 'with include_projection: true explicitly' do
    let(:variables) { { includeProjection: true } }

    before do
      # Create revenue records for the past 6 months
      6.times do |i|
        month_start = (Time.current - (6 - i).months).beginning_of_month
        shift = create(:shift_assignment, driver:, start_time: month_start + 8.hours)
        create(
          :revenue_record,
          driver:,
          shift_assignment: shift,
          total_revenue: 1000.0,
          created_at: month_start + 10.hours
        )
      end
    end

    it 'returns months with projection' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |results, _full_result|
          # Should return 5 months + 1 projection = 6 items
          expect(results.length).to eq(6)
          projection = results.find { |r| r["isProjection"] }
          expect(projection).to be_present
        end
    end
  end

  describe 'month date ranges' do
    before do
      # Create revenue records for the past 6 months
      6.times do |i|
        month_start = (Time.current - (6 - i).months).beginning_of_month
        shift = create(:shift_assignment, driver:, start_time: month_start + 8.hours)
        create(
          :revenue_record,
          driver:,
          shift_assignment: shift,
          total_revenue: 1000.0,
          created_at: month_start + 10.hours
        )
      end
    end

    it 'returns correct start and end dates for each month' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |results, _full_result|
          non_projections = results.select { |r| !r["isProjection"] }

          non_projections.each do |result|
            start_date = Date.parse(result["startDate"])
            end_date = Date.parse(result["endDate"])

            # Start date should be beginning of month
            expect(start_date).to eq(start_date.beginning_of_month)
            # End date should be end of month
            expect(end_date).to eq(start_date.end_of_month)
          end
        end
    end

    it 'returns projection with correct next month dates' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |results, _full_result|
          projection = results.find { |r| r["isProjection"] }
          expect(projection).to be_present

          projection_start = Date.parse(projection["startDate"])
          projection_end = Date.parse(projection["endDate"])
          next_month_start = (Time.current + 1.month).beginning_of_month.to_date

          expect(projection_start).to eq(next_month_start)
          expect(projection_end).to eq(next_month_start.end_of_month)
        end
    end
  end

  describe 'when no revenue records exist' do
    it 'returns months with zero values', :aggregate_failures do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |results, _full_result|
          expect(results.length).to eq(6) # 5 months + 1 projection

          non_projections = results.select { |r| !r["isProjection"] }
          non_projections.each do |result|
            expect(result["financeDetails"]["totalRevenue"]).to eq(0.0)
            expect(result["financeDetails"]["totalPayrollDue"]).to eq(0.0)
            expect(result["financeDetails"]["totalExpenses"]).to eq(0.0)
            expect(result["financeDetails"]["earnings"]).to eq(0.0)
          end
        end
    end

    it 'returns projection with zero values when no data exists', :aggregate_failures do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |results, _full_result|
          projection = results.find { |r| r["isProjection"] }
          expect(projection).to be_present
          expect(projection["financeDetails"]["totalRevenue"]).to eq(0.0)
          expect(projection["financeDetails"]["totalPayrollDue"]).to eq(0.0)
          expect(projection["financeDetails"]["totalExpenses"]).to eq(0.0)
          expect(projection["financeDetails"]["earnings"]).to eq(0.0)
        end
    end
  end

  describe 'projection calculation accuracy' do
    before do
      # Create revenue records with known values for accurate testing
      # Month 1: 1000 revenue, 100 expenses
      # Month 2: 2000 revenue, 200 expenses
      # Month 3: 3000 revenue, 300 expenses
      # Month 4: 4000 revenue, 400 expenses
      # Month 5: 5000 revenue, 500 expenses
      # Month 6: 6000 revenue, 600 expenses

      6.times do |i|
        month_start = (Time.current - (6 - i).months).beginning_of_month
        shift = create(:shift_assignment, driver:, start_time: month_start + 8.hours)
        create(
          :revenue_record,
          driver:,
          shift_assignment: shift,
          total_revenue: (i + 1) * 1000.0,
          created_at: month_start + 10.hours
        )
        create(:expense, amount: (i + 1) * 10000, date: month_start) # (i+1) * 100.00
      end
    end

    it 'calculates projection revenue as 110% of average' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |results, _full_result|
          projection = results.find { |r| r["isProjection"] }
          expect(projection).to be_present

          # Average revenue: (1000 + 2000 + 3000 + 4000 + 5000 + 6000) / 6 = 3500
          # Projected revenue: 3500 * 1.1 = 3850
          expect(projection["financeDetails"]["totalRevenue"]).to be_within(0.01).of(3850.0)
        end
    end

    it 'uses average expenses and payroll for projection' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |results, _full_result|
          projection = results.find { |r| r["isProjection"] }
          expect(projection).to be_present

          # Average expenses: (100 + 200 + 300 + 400 + 500 + 600) / 6 = 350
          expect(projection["financeDetails"]["totalExpenses"]).to be_within(0.01).of(350.0)
        end
    end
  end

  describe 'when user is not authenticated' do
    let(:context) { {} }

    before do
      month_start = Time.current.beginning_of_month
      shift = create(:shift_assignment, driver:, start_time: month_start + 8.hours)
      create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 1000.0)
    end

    it 'returns an authentication error' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_errors(["Authentication is required"])
    end
  end

  describe 'skipping oldest month' do
    before do
      # Create revenue records for 6 months with distinct values
      6.times do |i|
        month_start = (Time.current - (6 - i).months).beginning_of_month
        shift = create(:shift_assignment, driver:, start_time: month_start + 8.hours)
        create(
          :revenue_record,
          driver:,
          shift_assignment: shift,
          total_revenue: (i + 1) * 100.0, # 100, 200, 300, 400, 500, 600
          created_at: month_start + 10.hours
        )
      end
    end

    it 'returns only the most recent 5 months (skips oldest)' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |results, _full_result|
          non_projections = results.select { |r| !r["isProjection"] }
          expect(non_projections.length).to eq(5)

          # The oldest month (with 100 revenue) should be excluded
          # So we should see months with 200, 300, 400, 500, 600 revenue
          revenues = non_projections.map { |r| r["financeDetails"]["totalRevenue"] }
          expect(revenues).not_to include(100.0)
        end
    end
  end
end
