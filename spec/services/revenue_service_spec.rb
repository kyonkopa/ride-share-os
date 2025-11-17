# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RevenueService do
  let(:start_date) { Date.new(2024, 1, 1) }
  let(:end_date) { Date.new(2024, 1, 7) }
  let(:driver) { create(:driver) }

  describe '.aggregate_revenue' do
    context 'with revenue records in date range' do
      it 'sums all revenue records created within the date range' do
        # Create revenue records within range
        shift1 = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift1, total_revenue: 300.0, created_at: start_date.beginning_of_day + 10.hours)

        shift2 = create(:shift_assignment, driver:, start_time: (start_date + 1.day).beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift2, total_revenue: 500.0, created_at: (start_date + 1.day).beginning_of_day + 10.hours)

        result = described_class.aggregate_revenue(start_date:, end_date:)

        expect(result).to eq(800.0)
      end

      it 'handles multiple revenue records correctly' do
        shift = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 100.0, source: :bolt, created_at: start_date.beginning_of_day + 10.hours)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 200.0, source: :uber, created_at: start_date.beginning_of_day + 11.hours)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 150.0, source: :off_trip, created_at: start_date.beginning_of_day + 12.hours)

        result = described_class.aggregate_revenue(start_date:, end_date:)

        expect(result).to eq(450.0)
      end

      it 'excludes revenue records created before the start date' do
        shift_in_range = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift_in_range, total_revenue: 300.0, created_at: start_date.beginning_of_day + 10.hours)

        shift_before = create(:shift_assignment, driver:, start_time: (start_date - 1.day).beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift_before, total_revenue: 200.0, created_at: (start_date - 1.day).beginning_of_day + 10.hours)

        result = described_class.aggregate_revenue(start_date:, end_date:)

        expect(result).to eq(300.0)
      end

      it 'excludes revenue records created after the end date' do
        shift_in_range = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift_in_range, total_revenue: 300.0, created_at: start_date.beginning_of_day + 10.hours)

        shift_after = create(:shift_assignment, driver:, start_time: (end_date + 1.day).beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift_after, total_revenue: 400.0, created_at: (end_date + 1.day).beginning_of_day + 10.hours)

        result = described_class.aggregate_revenue(start_date:, end_date:)

        expect(result).to eq(300.0)
      end

      it 'includes records created exactly at start date beginning of day' do
        shift = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 300.0, created_at: start_date.beginning_of_day)

        result = described_class.aggregate_revenue(start_date:, end_date:)

        expect(result).to eq(300.0)
      end

      it 'includes records created exactly at end date end of day' do
        shift = create(:shift_assignment, driver:, start_time: end_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 300.0, created_at: end_date.end_of_day)

        result = described_class.aggregate_revenue(start_date:, end_date:)

        expect(result).to eq(300.0)
      end
    end

    context 'with no revenue records' do
      it 'returns zero when no revenue records exist' do
        result = described_class.aggregate_revenue(start_date:, end_date:)

        expect(result).to eq(0.0)
      end

      it 'returns zero when no revenue records exist in date range' do
        shift = create(:shift_assignment, driver:, start_time: (start_date - 5.days).beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 300.0, created_at: start_date - 5.days)

        result = described_class.aggregate_revenue(start_date:, end_date:)

        expect(result).to eq(0.0)
      end
    end

    context 'with decimal revenue amounts' do
      it 'handles decimal revenue values correctly' do
        shift = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 123.45, created_at: start_date.beginning_of_day + 10.hours)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 456.78, source: :uber, created_at: start_date.beginning_of_day + 11.hours)

        result = described_class.aggregate_revenue(start_date:, end_date:)

        expect(result).to be_within(0.01).of(580.23)
      end
    end

    context 'with single day date range' do
      it 'works correctly with same start and end date' do
        shift = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 300.0, created_at: start_date.beginning_of_day + 10.hours)

        result = described_class.aggregate_revenue(start_date:, end_date: start_date)

        expect(result).to eq(300.0)
      end
    end
  end

  describe '.calculate_company_earnings' do
    let(:driver1) { create(:driver) }
    let(:driver2) { create(:driver) }

    context 'with revenue, payroll, and expenses' do
      it 'calculates earnings correctly: revenue - payroll - expenses' do
        # Create revenue records
        shift1 = create(:shift_assignment, driver: driver1, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: driver1, shift_assignment: shift1, total_revenue: 300.0, created_at: start_date.beginning_of_day + 10.hours)

        shift2 = create(:shift_assignment, driver: driver2, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: driver2, shift_assignment: shift2, total_revenue: 600.0, created_at: start_date.beginning_of_day + 10.hours)

        # Create expenses
        create(:expense, amount: 10000, date: start_date) # 100.00
        create(:expense, amount: 5000, date: start_date + 1.day) # 50.00

        result = described_class.calculate_company_earnings(start_date:, end_date:)

        # Revenue: 300 + 600 = 900
        # Payroll: 45 (15% of 300) + 105 (15% of 500 + 30% of 100) = 150
        # Expenses: 100 + 50 = 150
        # Earnings: 900 - 150 - 150 = 600
        expect(result[:total_revenue]).to eq(900.0)
        expect(result[:total_payroll_due]).to eq(150.0)
        expect(result[:total_expenses]).to eq(150.0)
        expect(result[:earnings]).to eq(600.0)
      end

      it 'returns all components of the calculation' do
        shift = create(:shift_assignment, driver: driver1, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: driver1, shift_assignment: shift, total_revenue: 500.0, created_at: start_date.beginning_of_day + 10.hours)
        create(:expense, amount: 20000, date: start_date) # 200.00

        result = described_class.calculate_company_earnings(start_date:, end_date:)

        expect(result).to have_key(:total_revenue)
        expect(result).to have_key(:total_payroll_due)
        expect(result).to have_key(:total_expenses)
        expect(result).to have_key(:earnings)
      end

      it 'handles zero expenses correctly' do
        shift = create(:shift_assignment, driver: driver1, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: driver1, shift_assignment: shift, total_revenue: 500.0, created_at: start_date.beginning_of_day + 10.hours)

        result = described_class.calculate_company_earnings(start_date:, end_date:)

        expect(result[:total_expenses]).to eq(0.0)
        expect(result[:earnings]).to eq(425.0) # 500 - 75 (payroll)
      end

      it 'handles zero payroll correctly' do
        # Create expenses but no revenue (no payroll)
        create(:expense, amount: 10000, date: start_date) # 100.00

        result = described_class.calculate_company_earnings(start_date:, end_date:)

        expect(result[:total_revenue]).to eq(0.0)
        expect(result[:total_payroll_due]).to eq(0.0)
        expect(result[:total_expenses]).to eq(100.0)
        expect(result[:earnings]).to eq(-100.0) # Negative earnings when expenses exceed revenue
      end

      it 'handles zero revenue correctly' do
        create(:expense, amount: 10000, date: start_date) # 100.00

        result = described_class.calculate_company_earnings(start_date:, end_date:)

        expect(result[:total_revenue]).to eq(0.0)
        expect(result[:earnings]).to eq(-100.0)
      end
    end

    context 'with date range filtering' do
      it 'only includes revenue, payroll, and expenses within the date range' do
        # Within range
        shift1 = create(:shift_assignment, driver: driver1, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: driver1, shift_assignment: shift1, total_revenue: 300.0, created_at: start_date.beginning_of_day + 10.hours)
        create(:expense, amount: 10000, date: start_date) # 100.00

        # Before range
        shift_before = create(:shift_assignment, driver: driver1, start_time: (start_date - 1.day).beginning_of_day + 8.hours)
        create(:revenue_record, driver: driver1, shift_assignment: shift_before, total_revenue: 200.0, created_at: (start_date - 1.day).beginning_of_day + 10.hours)
        create(:expense, amount: 5000, date: start_date - 1.day) # 50.00

        # After range - ExpenseService uses exclusive end, so end_date expenses are excluded
        shift_after = create(:shift_assignment, driver: driver1, start_time: (end_date + 1.day).beginning_of_day + 8.hours)
        create(:revenue_record, driver: driver1, shift_assignment: shift_after, total_revenue: 400.0, created_at: (end_date + 1.day).beginning_of_day + 10.hours)
        create(:expense, amount: 15000, date: end_date + 1.day) # 150.00

        result = described_class.calculate_company_earnings(start_date:, end_date:)

        # Only within range: Revenue 300, Payroll 45, Expenses 100
        expect(result[:total_revenue]).to eq(300.0)
        expect(result[:total_payroll_due]).to eq(45.0)
        expect(result[:total_expenses]).to eq(100.0)
        expect(result[:earnings]).to eq(155.0) # 300 - 45 - 100
      end
    end

    context 'edge cases' do
      it 'handles negative earnings when expenses exceed revenue' do
        shift = create(:shift_assignment, driver: driver1, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: driver1, shift_assignment: shift, total_revenue: 100.0, created_at: start_date.beginning_of_day + 10.hours)
        create(:expense, amount: 50000, date: start_date) # 500.00

        result = described_class.calculate_company_earnings(start_date:, end_date:)

        # Revenue: 100, Payroll: 15 (15% of 100), Expenses: 500
        # Earnings: 100 - 15 - 500 = -415
        expect(result[:earnings]).to eq(-415.0)
      end

      it 'handles very large amounts correctly' do
        shift = create(:shift_assignment, driver: driver1, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: driver1, shift_assignment: shift, total_revenue: 10000.0, created_at: start_date.beginning_of_day + 10.hours)
        create(:expense, amount: 100000, date: start_date) # 1000.00

        result = described_class.calculate_company_earnings(start_date:, end_date:)

        expect(result[:total_revenue]).to eq(10000.0)
        expect(result[:earnings]).to be_a(Float)
      end
    end
  end
end
