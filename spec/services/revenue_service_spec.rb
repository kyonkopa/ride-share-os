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

    context 'with driver filter' do
      let(:other_driver) { create(:driver) }

      it 'filters revenue records by driver' do
        shift1 = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift1, total_revenue: 300.0, realized_at: start_date.beginning_of_day + 10.hours)

        shift2 = create(:shift_assignment, driver: other_driver, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: other_driver, shift_assignment: shift2, total_revenue: 500.0, realized_at: start_date.beginning_of_day + 10.hours)

        result = described_class.aggregate_revenue(start_date:, end_date:, driver:)

        expect(result).to eq(300.0)
      end

      it 'excludes revenue records from other drivers' do
        shift1 = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift1, total_revenue: 200.0, realized_at: start_date.beginning_of_day + 10.hours)

        shift2 = create(:shift_assignment, driver: other_driver, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: other_driver, shift_assignment: shift2, total_revenue: 400.0, realized_at: start_date.beginning_of_day + 10.hours)

        result = described_class.aggregate_revenue(start_date:, end_date:, driver: other_driver)

        expect(result).to eq(400.0)
      end

      it 'returns zero when driver has no revenue records' do
        other_driver_shift = create(:shift_assignment, driver: other_driver, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: other_driver, shift_assignment: other_driver_shift, total_revenue: 500.0, realized_at: start_date.beginning_of_day + 10.hours)

        result = described_class.aggregate_revenue(start_date:, end_date:, driver:)

        expect(result).to eq(0.0)
      end
    end

    context 'with vehicle filter' do
      let(:vehicle) { create(:vehicle) }
      let(:other_vehicle) { create(:vehicle) }

      it 'filters revenue records by vehicle' do
        shift1 = create(:shift_assignment, driver:, vehicle:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, vehicle:, shift_assignment: shift1, total_revenue: 300.0, realized_at: start_date.beginning_of_day + 10.hours)

        shift2 = create(:shift_assignment, driver:, vehicle: other_vehicle, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, vehicle: other_vehicle, shift_assignment: shift2, total_revenue: 500.0, realized_at: start_date.beginning_of_day + 10.hours)

        result = described_class.aggregate_revenue(start_date:, end_date:, vehicle:)

        expect(result).to eq(300.0)
      end

      it 'excludes revenue records from other vehicles' do
        shift1 = create(:shift_assignment, driver:, vehicle:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, vehicle:, shift_assignment: shift1, total_revenue: 200.0, realized_at: start_date.beginning_of_day + 10.hours)

        shift2 = create(:shift_assignment, driver:, vehicle: other_vehicle, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, vehicle: other_vehicle, shift_assignment: shift2, total_revenue: 400.0, realized_at: start_date.beginning_of_day + 10.hours)

        result = described_class.aggregate_revenue(start_date:, end_date:, vehicle: other_vehicle)

        expect(result).to eq(400.0)
      end

      it 'returns zero when vehicle has no revenue records' do
        other_vehicle_shift = create(:shift_assignment, driver:, vehicle: other_vehicle, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, vehicle: other_vehicle, shift_assignment: other_vehicle_shift, total_revenue: 500.0, realized_at: start_date.beginning_of_day + 10.hours)

        result = described_class.aggregate_revenue(start_date:, end_date:, vehicle:)

        expect(result).to eq(0.0)
      end
    end

    context 'with driver and vehicle filters' do
      let(:other_driver) { create(:driver) }
      let(:vehicle) { create(:vehicle) }
      let(:other_vehicle) { create(:vehicle) }

      it 'filters revenue records by both driver and vehicle' do
        # Matching driver and vehicle
        shift1 = create(:shift_assignment, driver:, vehicle:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, vehicle:, shift_assignment: shift1, total_revenue: 300.0, realized_at: start_date.beginning_of_day + 10.hours)

        # Same driver, different vehicle
        shift2 = create(:shift_assignment, driver:, vehicle: other_vehicle, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, vehicle: other_vehicle, shift_assignment: shift2, total_revenue: 200.0, realized_at: start_date.beginning_of_day + 10.hours)

        # Different driver, same vehicle
        shift3 = create(:shift_assignment, driver: other_driver, vehicle:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: other_driver, vehicle:, shift_assignment: shift3, total_revenue: 400.0, realized_at: start_date.beginning_of_day + 10.hours)

        result = described_class.aggregate_revenue(start_date:, end_date:, driver:, vehicle:)

        expect(result).to eq(300.0)
      end

      it 'returns zero when no records match both driver and vehicle' do
        # Different driver and vehicle
        shift1 = create(:shift_assignment, driver: other_driver, vehicle: other_vehicle, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: other_driver, vehicle: other_vehicle, shift_assignment: shift1, total_revenue: 500.0, realized_at: start_date.beginning_of_day + 10.hours)

        # Same driver, different vehicle
        shift2 = create(:shift_assignment, driver:, vehicle: other_vehicle, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, vehicle: other_vehicle, shift_assignment: shift2, total_revenue: 200.0, realized_at: start_date.beginning_of_day + 10.hours)

        result = described_class.aggregate_revenue(start_date:, end_date:, driver:, vehicle:)

        expect(result).to eq(0.0)
      end
    end
  end

  describe '.calculate_company_earnings' do
    let(:first_driver) { create(:driver) }
    let(:second_driver) { create(:driver) }

    context 'with revenue, payroll, and expenses' do
      it 'calculates earnings correctly: revenue - payroll - expenses' do
        # Create revenue records
        shift1 = create(:shift_assignment, driver: first_driver, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: first_driver, shift_assignment: shift1, total_revenue: 300.0, created_at: start_date.beginning_of_day + 10.hours)

        shift2 = create(:shift_assignment, driver: second_driver, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: second_driver, shift_assignment: shift2, total_revenue: 600.0, created_at: start_date.beginning_of_day + 10.hours)

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
        shift = create(:shift_assignment, driver: first_driver, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: first_driver, shift_assignment: shift, total_revenue: 500.0, created_at: start_date.beginning_of_day + 10.hours)
        create(:expense, amount: 20000, date: start_date) # 200.00

        result = described_class.calculate_company_earnings(start_date:, end_date:)

        expect(result).to have_key(:total_revenue)
        expect(result).to have_key(:total_payroll_due)
        expect(result).to have_key(:total_expenses)
        expect(result).to have_key(:earnings)
      end

      it 'handles zero expenses correctly' do
        shift = create(:shift_assignment, driver: first_driver, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: first_driver, shift_assignment: shift, total_revenue: 500.0, created_at: start_date.beginning_of_day + 10.hours)

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
        shift1 = create(:shift_assignment, driver: first_driver, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: first_driver, shift_assignment: shift1, total_revenue: 300.0, created_at: start_date.beginning_of_day + 10.hours)
        create(:expense, amount: 10000, date: start_date) # 100.00

        # Before range
        shift_before = create(:shift_assignment, driver: first_driver, start_time: (start_date - 1.day).beginning_of_day + 8.hours)
        create(:revenue_record, driver: first_driver, shift_assignment: shift_before, total_revenue: 200.0, created_at: (start_date - 1.day).beginning_of_day + 10.hours)
        create(:expense, amount: 5000, date: start_date - 1.day) # 50.00

        # After range - ExpenseService uses exclusive end, so end_date expenses are excluded
        shift_after = create(:shift_assignment, driver: first_driver, start_time: (end_date + 1.day).beginning_of_day + 8.hours)
        create(:revenue_record, driver: first_driver, shift_assignment: shift_after, total_revenue: 400.0, created_at: (end_date + 1.day).beginning_of_day + 10.hours)
        create(:expense, amount: 15000, date: end_date + 1.day) # 150.00

        result = described_class.calculate_company_earnings(start_date:, end_date:)

        # Only within range: Revenue 300, Payroll 45, Expenses 100
        expect(result[:total_revenue]).to eq(300.0)
        expect(result[:total_payroll_due]).to eq(45.0)
        expect(result[:total_expenses]).to eq(100.0)
        expect(result[:earnings]).to eq(155.0) # 300 - 45 - 100
      end
    end

    context 'when edge cases occur' do
      it 'handles negative earnings when expenses exceed revenue' do
        shift = create(:shift_assignment, driver: first_driver, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: first_driver, shift_assignment: shift, total_revenue: 100.0, created_at: start_date.beginning_of_day + 10.hours)
        create(:expense, amount: 50000, date: start_date) # 500.00

        result = described_class.calculate_company_earnings(start_date:, end_date:)

        # Revenue: 100, Payroll: 15 (15% of 100), Expenses: 500
        # Earnings: 100 - 15 - 500 = -415
        expect(result[:earnings]).to eq(-415.0)
      end

      it 'handles very large amounts correctly' do
        shift = create(:shift_assignment, driver: first_driver, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: first_driver, shift_assignment: shift, total_revenue: 10000.0, created_at: start_date.beginning_of_day + 10.hours)
        create(:expense, amount: 100000, date: start_date) # 1000.00

        result = described_class.calculate_company_earnings(start_date:, end_date:)

        expect(result[:total_revenue]).to eq(10000.0)
        expect(result[:earnings]).to be_a(Float)
      end
    end
  end

  describe '.calculate_revenue_statistics' do
    let(:vehicle1) { create(:vehicle) }
    let(:vehicle2) { create(:vehicle) }
    let(:vehicle3) { create(:vehicle) }

    context 'with revenue records and vehicles' do
      it 'calculates total revenue all time correctly' do
        # Create revenue records across different months
        first_month = 3.months.ago.beginning_of_month
        shift1 = create(:shift_assignment, driver:, vehicle: vehicle1, start_time: first_month + 8.hours)
        create(:revenue_record, driver:, vehicle: vehicle1, shift_assignment: shift1, total_revenue: 1000.0, realized_at: first_month + 10.hours)

        second_month = 2.months.ago.beginning_of_month
        shift2 = create(:shift_assignment, driver:, vehicle: vehicle2, start_time: second_month + 8.hours)
        create(:revenue_record, driver:, vehicle: vehicle2, shift_assignment: shift2, total_revenue: 2000.0, realized_at: second_month + 10.hours)

        third_month = 1.month.ago.beginning_of_month
        shift3 = create(:shift_assignment, driver:, vehicle: vehicle3, start_time: third_month + 8.hours)
        create(:revenue_record, driver:, vehicle: vehicle3, shift_assignment: shift3, total_revenue: 3000.0, realized_at: third_month + 10.hours)

        result = described_class.calculate_revenue_statistics

        expect(result[:total_revenue_all_time]).to eq(6000.0)
      end

      it 'calculates average revenue per month correctly' do
        # Create revenue records 3 months ago
        first_month = 3.months.ago.beginning_of_month
        shift1 = create(:shift_assignment, driver:, vehicle: vehicle1, start_time: first_month + 8.hours)
        create(:revenue_record, driver:, vehicle: vehicle1, shift_assignment: shift1, total_revenue: 3000.0, realized_at: first_month + 10.hours)

        # Total revenue: 3000, months: 3 (from 3 months ago to now)
        # Average: 3000 / 3 = 1000
        result = described_class.calculate_revenue_statistics

        expect(result[:average_revenue_per_month]).to be_within(0.01).of(1000.0)
      end

      it 'calculates average revenue per car correctly' do
        # Create revenue records
        first_month = 2.months.ago.beginning_of_month
        shift1 = create(:shift_assignment, driver:, vehicle: vehicle1, start_time: first_month + 8.hours)
        create(:revenue_record, driver:, vehicle: vehicle1, shift_assignment: shift1, total_revenue: 6000.0, realized_at: first_month + 10.hours)

        # Total revenue: 6000, vehicles: 3
        # Average: 6000 / 3 = 2000
        result = described_class.calculate_revenue_statistics

        expect(result[:average_revenue_per_car]).to eq(2000.0)
      end

      it 'returns all three statistics' do
        first_month = 2.months.ago.beginning_of_month
        shift = create(:shift_assignment, driver:, vehicle: vehicle1, start_time: first_month + 8.hours)
        create(:revenue_record, driver:, vehicle: vehicle1, shift_assignment: shift, total_revenue: 5000.0, realized_at: first_month + 10.hours)

        result = described_class.calculate_revenue_statistics

        expect(result).to have_key(:total_revenue_all_time)
        expect(result).to have_key(:average_revenue_per_month)
        expect(result).to have_key(:average_revenue_per_car)
      end
    end

    context 'with no revenue records' do
      it 'returns zero for all statistics' do
        result = described_class.calculate_revenue_statistics

        expect(result[:total_revenue_all_time]).to eq(0.0)
        expect(result[:average_revenue_per_month]).to eq(0.0)
        expect(result[:average_revenue_per_car]).to eq(0.0)
      end
    end

    context 'with no vehicles' do
      before do
        Vehicle.destroy_all
      end

      it 'returns zero for average revenue per car' do
        first_month = 2.months.ago.beginning_of_month
        shift = create(:shift_assignment, driver:, start_time: first_month + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 5000.0, realized_at: first_month + 10.hours)

        result = described_class.calculate_revenue_statistics

        expect(result[:average_revenue_per_car]).to eq(0.0)
        expect(result[:total_revenue_all_time]).to eq(5000.0)
      end
    end

    context 'with revenue record without realized_at' do
      it 'handles missing realized_at gracefully' do
        # Create a revenue record without realized_at (shouldn't happen in practice but test edge case)
        shift = create(:shift_assignment, driver:, vehicle: vehicle1, start_time: 2.months.ago + 8.hours)
        revenue_record = create(:revenue_record, driver:, vehicle: vehicle1, shift_assignment: shift, total_revenue: 5000.0, realized_at: 2.months.ago + 10.hours)

        # Manually set realized_at to nil to test edge case
        revenue_record.update_column(:realized_at, nil)

        result = described_class.calculate_revenue_statistics

        # Should still calculate total revenue but average per month should be 0
        expect(result[:total_revenue_all_time]).to eq(5000.0)
        expect(result[:average_revenue_per_month]).to eq(0.0)
      end
    end

    context 'with single month of data' do
      it 'ensures at least 1 month is used for calculation' do
        # Create revenue record very recently (less than 1 month ago)
        recent_date = 10.days.ago
        shift = create(:shift_assignment, driver:, vehicle: vehicle1, start_time: recent_date + 8.hours)
        create(:revenue_record, driver:, vehicle: vehicle1, shift_assignment: shift, total_revenue: 1000.0, realized_at: recent_date + 10.hours)

        result = described_class.calculate_revenue_statistics

        # Should use at least 1 month, so average should be 1000 / 1 = 1000
        expect(result[:average_revenue_per_month]).to be_within(0.01).of(1000.0)
      end
    end

    context 'with multiple revenue records across different months' do
      it 'calculates statistics correctly with varied data' do
        # Create revenue records spanning 4 months
        month1 = 4.months.ago.beginning_of_month
        shift1 = create(:shift_assignment, driver:, vehicle: vehicle1, start_time: month1 + 8.hours)
        create(:revenue_record, driver:, vehicle: vehicle1, shift_assignment: shift1, total_revenue: 1000.0, realized_at: month1 + 10.hours)

        month2 = 3.months.ago.beginning_of_month
        shift2 = create(:shift_assignment, driver:, vehicle: vehicle2, start_time: month2 + 8.hours)
        create(:revenue_record, driver:, vehicle: vehicle2, shift_assignment: shift2, total_revenue: 2000.0, realized_at: month2 + 10.hours)

        month3 = 2.months.ago.beginning_of_month
        shift3 = create(:shift_assignment, driver:, vehicle: vehicle3, start_time: month3 + 8.hours)
        create(:revenue_record, driver:, vehicle: vehicle3, shift_assignment: shift3, total_revenue: 3000.0, realized_at: month3 + 10.hours)

        month4 = 1.month.ago.beginning_of_month
        shift4 = create(:shift_assignment, driver:, vehicle: vehicle1, start_time: month4 + 8.hours)
        create(:revenue_record, driver:, vehicle: vehicle1, shift_assignment: shift4, total_revenue: 4000.0, realized_at: month4 + 10.hours)

        result = described_class.calculate_revenue_statistics

        expect(result[:total_revenue_all_time]).to eq(10000.0)
        # Average per month: 10000 / 4 = 2500
        expect(result[:average_revenue_per_month]).to be_within(0.01).of(2500.0)
        # Average per car: 10000 / 3 = 3333.33
        expect(result[:average_revenue_per_car]).to be_within(0.01).of(3333.33)
      end
    end
  end
end
