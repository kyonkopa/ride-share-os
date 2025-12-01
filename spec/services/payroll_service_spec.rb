# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PayrollService do
  let(:start_date) { Date.new(2024, 1, 1) }
  let(:end_date) { Date.new(2024, 1, 7) }
  let(:driver) { create(:driver) }

  describe '.calculate_payroll' do
    context 'with valid date range and drivers' do
      it 'calculates payroll for all drivers with shifts in the date range' do
        driver1 = create(:driver)
        driver2 = create(:driver)

        # Create shift assignments and revenue records for driver1
        shift1 = create(:shift_assignment, driver: driver1, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: driver1, shift_assignment: shift1, total_revenue: 300.0)

        # Create shift assignments and revenue records for driver2
        shift2 = create(:shift_assignment, driver: driver2, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: driver2, shift_assignment: shift2, total_revenue: 600.0)

        result = described_class.calculate_payroll(start_date:, end_date:)

        expect(result).to have_key(:total_amount_due)
        expect(result).to have_key(:driver_payrolls)
        expect(result[:driver_payrolls].count).to eq(2)
      end

      it 'calculates correct total amount due across all drivers' do
        driver1 = create(:driver)
        driver2 = create(:driver)

        # Driver1: 300 GHS revenue = 15% of 300 = 45 GHS
        shift1 = create(:shift_assignment, driver: driver1, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: driver1, shift_assignment: shift1, total_revenue: 300.0)

        # Driver2: 600 GHS revenue = (15% of 500) + (30% of 100) = 75 + 30 = 105 GHS
        shift2 = create(:shift_assignment, driver: driver2, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: driver2, shift_assignment: shift2, total_revenue: 600.0)

        result = described_class.calculate_payroll(start_date:, end_date:)

        expect(result[:total_amount_due]).to eq(150.0) # 45 + 105
      end

      it 'excludes drivers without shift assignments in the date range' do
        driver_with_shifts = create(:driver)
        driver_without_shifts = create(:driver)

        shift = create(:shift_assignment, driver: driver_with_shifts, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver: driver_with_shifts, shift_assignment: shift, total_revenue: 300.0)

        result = described_class.calculate_payroll(start_date:, end_date:)

        expect(result[:driver_payrolls].count).to eq(1)
        expect(result[:driver_payrolls].first[:driver]).to eq(driver_with_shifts)
      end

      it 'excludes shift assignments outside the date range' do
        driver = create(:driver)

        # Shift within range
        shift_in_range = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift_in_range, total_revenue: 300.0)

        # Shift before range
        shift_before = create(:shift_assignment, driver:, start_time: (start_date - 1.day).beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift_before, total_revenue: 200.0)

        # Shift after range
        shift_after = create(:shift_assignment, driver:, start_time: (end_date + 1.day).beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift_after, total_revenue: 400.0)

        result = described_class.calculate_payroll(start_date:, end_date:)

        expect(result[:driver_payrolls].count).to eq(1)
        expect(result[:driver_payrolls].first[:amount_due]).to eq(45.0) # Only 300 GHS revenue
      end

      it 'returns zero total amount due when no drivers have shifts' do
        result = described_class.calculate_payroll(start_date:, end_date:)

        expect(result[:total_amount_due]).to eq(0.0)
        expect(result[:driver_payrolls]).to be_empty
      end

      it 'handles drivers with multiple shift assignments across different days' do
        driver = create(:driver)

        # Day 1: 300 GHS
        shift1 = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift1, total_revenue: 300.0)

        # Day 2: 600 GHS
        shift2 = create(:shift_assignment, driver:, start_time: (start_date + 1.day).beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift2, total_revenue: 600.0)

        result = described_class.calculate_payroll(start_date:, end_date:)

        driver_payroll = result[:driver_payrolls].first
        expect(driver_payroll[:amount_due]).to eq(150.0) # 45 + 105
        expect(driver_payroll[:daily_breakdown].count).to eq(2)
      end
    end
  end

  describe '.calculate_driver_payroll' do
    context 'with revenue below daily target (500 GHS)' do
      it 'calculates 15% commission for revenue below target' do
        shift = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 300.0)

        result = described_class.calculate_driver_payroll(driver:, start_date:, end_date:)

        expect(result[:amount_due]).to eq(45.0) # 15% of 300
        expect(result[:driver]).to eq(driver)
      end

      it 'calculates 15% commission for revenue exactly at target' do
        shift = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 500.0)

        result = described_class.calculate_driver_payroll(driver:, start_date:, end_date:)

        expect(result[:amount_due]).to eq(75.0) # 15% of 500
      end
    end

    context 'with revenue above daily target (500 GHS)' do
      it 'calculates tiered commission: 15% of first 500 + 30% of surplus' do
        shift = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 600.0)

        result = described_class.calculate_driver_payroll(driver:, start_date:, end_date:)

        # (15% of 500) + (30% of 100) = 75 + 30 = 105
        expect(result[:amount_due]).to eq(105.0)
      end

      it 'calculates correctly for revenue significantly above target' do
        shift = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 1000.0)

        result = described_class.calculate_driver_payroll(driver:, start_date:, end_date:)

        # (15% of 500) + (30% of 500) = 75 + 150 = 225
        expect(result[:amount_due]).to eq(225.0)
      end
    end

    context 'with multiple days' do
      it 'calculates daily breakdown correctly' do
        # Day 1: 300 GHS
        shift1 = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift1, total_revenue: 300.0)

        # Day 2: 600 GHS
        shift2 = create(:shift_assignment, driver:, start_time: (start_date + 1.day).beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift2, total_revenue: 600.0)

        result = described_class.calculate_driver_payroll(driver:, start_date:, end_date:)

        aggregate_failures do
          expect(result[:daily_breakdown].count).to eq(2)
          expect(result[:daily_breakdown].first[:revenue]).to eq(300.0)
          expect(result[:daily_breakdown].first[:amount_due]).to eq(45.0)
          expect(result[:daily_breakdown].second[:revenue]).to eq(600.0)
          expect(result[:daily_breakdown].second[:amount_due]).to eq(105.0)
          expect(result[:amount_due]).to eq(150.0) # Sum of both days
        end
      end

      it 'sorts daily breakdown by date' do
        # Day 3: 400 GHS
        shift3 = create(:shift_assignment, driver:, start_time: (start_date + 2.days).beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift3, total_revenue: 400.0)

        # Day 1: 300 GHS
        shift1 = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift1, total_revenue: 300.0)

        # Day 2: 600 GHS
        shift2 = create(:shift_assignment, driver:, start_time: (start_date + 1.day).beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift2, total_revenue: 600.0)

        result = described_class.calculate_driver_payroll(driver:, start_date:, end_date:)

        dates = result[:daily_breakdown].map { |day| day[:date] }
        expect(dates).to eq([start_date, start_date + 1.day, start_date + 2.days])
      end

      it 'groups multiple revenue records per day correctly' do
        shift = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        # Multiple revenue records for the same day (different sources to satisfy uniqueness validation)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 200.0, source: :bolt)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 300.0, source: :uber)

        result = described_class.calculate_driver_payroll(driver:, start_date:, end_date:)

        expect(result[:daily_breakdown].count).to eq(1)
        expect(result[:daily_breakdown].first[:revenue]).to eq(500.0) # Sum of 200 + 300
        expect(result[:daily_breakdown].first[:amount_due]).to eq(75.0) # 15% of 500
      end
    end

    context 'with no revenue records' do
      it 'returns zero amount due and empty daily breakdown' do
        shift = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        # No revenue records

        result = described_class.calculate_driver_payroll(driver:, start_date:, end_date:)

        expect(result[:amount_due]).to eq(0.0)
        expect(result[:daily_breakdown]).to be_empty
      end
    end

    context 'with driver start date' do
      it 'uses the earliest shift assignment date as start_date' do
        # Create shifts on different days
        shift1 = create(:shift_assignment, driver:, start_time: (start_date + 2.days).beginning_of_day + 8.hours)
        shift2 = create(:shift_assignment, driver:, start_time: (start_date + 1.day).beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift1, total_revenue: 300.0)
        create(:revenue_record, driver:, shift_assignment: shift2, total_revenue: 300.0)

        result = described_class.calculate_driver_payroll(driver:, start_date:, end_date:)

        expect(result[:start_date]).to eq(start_date + 1.day) # Earliest shift date
      end

      it 'uses fallback date when no shifts found in range' do
        result = described_class.calculate_driver_payroll(driver:, start_date:, end_date:)

        expect(result[:start_date]).to eq(start_date) # Fallback to provided start_date
      end
    end

    context 'with date range filtering' do
      it 'only includes revenue records within the date range' do
        # Shift within range
        shift_in_range = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift_in_range, total_revenue: 300.0)

        # Shift before range
        shift_before = create(:shift_assignment, driver:, start_time: (start_date - 1.day).beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift_before, total_revenue: 200.0)

        result = described_class.calculate_driver_payroll(driver:, start_date:, end_date:)

        expect(result[:amount_due]).to eq(45.0) # Only 300 GHS from shift in range
      end
    end
  end

  describe 'private methods' do
    describe '#calculate_amount_due' do
      let(:tier_1_driver) { create(:driver, tier: 'tier_1') }
      let(:tier_2_driver) { create(:driver, tier: 'tier_2') }

      context 'with tier_1 driver' do
        it 'calculates 15% for revenue at or below target' do
          expect(described_class.send(:calculate_amount_due, driver: tier_1_driver, daily_revenue: 0)).to eq(0.0)
          expect(described_class.send(:calculate_amount_due, driver: tier_1_driver, daily_revenue: 250)).to eq(37.5) # 15% of 250
          expect(described_class.send(:calculate_amount_due, driver: tier_1_driver, daily_revenue: 500)).to eq(75.0) # 15% of 500
        end

        it 'calculates tiered commission for revenue above target' do
          # 600 GHS: (15% of 500) + (30% of 100) = 75 + 30 = 105
          expect(described_class.send(:calculate_amount_due, driver: tier_1_driver, daily_revenue: 600)).to eq(105.0)

          # 1000 GHS: (15% of 500) + (30% of 500) = 75 + 150 = 225
          expect(described_class.send(:calculate_amount_due, driver: tier_1_driver, daily_revenue: 1000)).to eq(225.0)

          # 1500 GHS: (15% of 500) + (30% of 1000) = 75 + 300 = 375
          expect(described_class.send(:calculate_amount_due, driver: tier_1_driver, daily_revenue: 1500)).to eq(375.0)
        end
      end

      context 'with tier_2 driver' do
        it 'calculates 20% for revenue at or below target' do
          expect(described_class.send(:calculate_amount_due, driver: tier_2_driver, daily_revenue: 0)).to eq(0.0)
          expect(described_class.send(:calculate_amount_due, driver: tier_2_driver, daily_revenue: 250)).to eq(50.0) # 20% of 250
          expect(described_class.send(:calculate_amount_due, driver: tier_2_driver, daily_revenue: 500)).to eq(100.0) # 20% of 500
        end

        it 'calculates tiered commission for revenue above target' do
          # 600 GHS: (20% of 500) + (30% of 100) = 100 + 30 = 130
          expect(described_class.send(:calculate_amount_due, driver: tier_2_driver, daily_revenue: 600)).to eq(130.0)

          # 1000 GHS: (20% of 500) + (30% of 500) = 100 + 150 = 250
          expect(described_class.send(:calculate_amount_due, driver: tier_2_driver, daily_revenue: 1000)).to eq(250.0)

          # 1500 GHS: (20% of 500) + (30% of 1000) = 100 + 300 = 400
          expect(described_class.send(:calculate_amount_due, driver: tier_2_driver, daily_revenue: 1500)).to eq(400.0)
        end
      end

      it 'raises error for invalid tier' do
        invalid_driver = create(:driver, tier: 'invalid_tier')
        expect do
          described_class.send(:calculate_amount_due, driver: invalid_driver, daily_revenue: 500)
        end.to raise_error(RuntimeError, /Invalid tier/)
      end
    end

    describe '#calculate_daily_breakdown' do
      it 'groups revenue records by day' do
        # Day 1: 300 GHS
        shift1 = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift1, total_revenue: 300.0)

        # Day 2: 600 GHS
        shift2 = create(:shift_assignment, driver:, start_time: (start_date + 1.day).beginning_of_day + 8.hours)
        create(:revenue_record, driver:, shift_assignment: shift2, total_revenue: 600.0)

        date_range = start_date.beginning_of_day..end_date.end_of_day
        breakdown = described_class.send(:calculate_daily_breakdown, driver:, date_range:)

        expect(breakdown.count).to eq(2)
        expect(breakdown.first[:date]).to eq(start_date)
        expect(breakdown.first[:revenue]).to eq(300.0)
        expect(breakdown.second[:date]).to eq(start_date + 1.day)
        expect(breakdown.second[:revenue]).to eq(600.0)
      end

      it 'sums multiple revenue records for the same day' do
        shift = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        # Multiple revenue records for the same day (different sources to satisfy uniqueness validation)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 200.0, source: :bolt)
        create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 300.0, source: :uber)

        date_range = start_date.beginning_of_day..end_date.end_of_day
        breakdown = described_class.send(:calculate_daily_breakdown, driver:, date_range:)

        expect(breakdown.count).to eq(1)
        expect(breakdown.first[:revenue]).to eq(500.0)
        expect(breakdown.first[:amount_due]).to eq(75.0)
      end

      it 'sorts breakdown by date' do
        # Create shifts out of order
        shift3 = create(:shift_assignment, driver:, start_time: (start_date + 2.days).beginning_of_day + 8.hours)
        shift1 = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
        shift2 = create(:shift_assignment, driver:, start_time: (start_date + 1.day).beginning_of_day + 8.hours)

        create(:revenue_record, driver:, shift_assignment: shift1, total_revenue: 300.0)
        create(:revenue_record, driver:, shift_assignment: shift2, total_revenue: 400.0)
        create(:revenue_record, driver:, shift_assignment: shift3, total_revenue: 500.0)

        date_range = start_date.beginning_of_day..end_date.end_of_day
        breakdown = described_class.send(:calculate_daily_breakdown, driver:, date_range:)

        dates = breakdown.map { |day| day[:date] }
        expect(dates).to eq([start_date, start_date + 1.day, start_date + 2.days])
      end
    end

    describe '#find_driver_start_date' do
      it 'returns the earliest shift assignment date in range' do
        shift1 = create(:shift_assignment, driver:, start_time: (start_date + 2.days).beginning_of_day + 8.hours)
        shift2 = create(:shift_assignment, driver:, start_time: (start_date + 1.day).beginning_of_day + 8.hours)

        date_range = start_date.beginning_of_day..end_date.end_of_day
        result = described_class.send(:find_driver_start_date, driver:, date_range:, fallback_date: start_date)

        expect(result).to eq(start_date + 1.day) # Earliest shift date
      end

      it 'returns fallback date when no shifts found' do
        date_range = start_date.beginning_of_day..end_date.end_of_day
        result = described_class.send(:find_driver_start_date, driver:, date_range:, fallback_date: start_date)

        expect(result).to eq(start_date)
      end

      it 'handles shifts outside the date range' do
        # Create shift before range
        create(:shift_assignment, driver:, start_time: (start_date - 1.day).beginning_of_day + 8.hours)

        date_range = start_date.beginning_of_day..end_date.end_of_day
        result = described_class.send(:find_driver_start_date, driver:, date_range:, fallback_date: start_date)

        expect(result).to eq(start_date) # Fallback since no shifts in range
      end
    end
  end

  describe 'edge cases' do
    it 'handles zero revenue correctly' do
      shift = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
      create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 0.0)

      result = described_class.calculate_driver_payroll(driver:, start_date:, end_date:)

      expect(result[:amount_due]).to eq(0.0)
    end

    it 'handles very large revenue amounts' do
      shift = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
      create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 10_000.0)

      result = described_class.calculate_driver_payroll(driver:, start_date:, end_date:)

      # (15% of 500) + (30% of 9500) = 75 + 2850 = 2925
      expect(result[:amount_due]).to eq(2925.0)
    end

    it 'handles decimal revenue amounts' do
      shift = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
      create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 333.33)

      result = described_class.calculate_driver_payroll(driver:, start_date:, end_date:)

      expect(result[:amount_due]).to be_within(0.01).of(49.9995) # 15% of 333.33
    end

    it 'handles single day date range' do
      shift = create(:shift_assignment, driver:, start_time: start_date.beginning_of_day + 8.hours)
      create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 300.0)

      result = described_class.calculate_driver_payroll(driver:, start_date:, end_date: start_date)

      expect(result[:amount_due]).to eq(45.0)
      expect(result[:daily_breakdown].count).to eq(1)
    end
  end
end
