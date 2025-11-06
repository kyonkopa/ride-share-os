require 'rails_helper'

RSpec.describe ShiftAssignmentService do
  let(:driver) { create(:driver, verified: true) }
  let(:start_date) { Date.current }
  let(:end_date) { Date.current + 10.days }

  describe '.assign_shifts' do
    context 'with valid parameters' do
      it 'creates shift assignments for daily_for_6_days schedule' do
        assignments = described_class.assign_shifts(
          driver:,
          schedule: :daily_for_6_days,
          start_date:,
          end_date:
        )

        expect(assignments.count).to eq(6)
        expect(assignments.all? { |a| a.driver == driver }).to be true
        expect(assignments.all? { |a| a.status == 'scheduled' }).to be true
        expect(assignments.all? { |a| a.city == 'accra' }).to be true
        expect(assignments.all? { |a| a.vehicle_id.nil? }).to be true
      end

      it 'creates assignments with correct time ranges' do
        assignments = described_class.assign_shifts(
          driver:,
          schedule: :daily_for_6_days,
          start_date:,
          end_date:
        )

        assignments.each do |assignment|
          expect(assignment.start_time.hour).to eq(8)
          expect(assignment.end_time.hour).to eq(21)
          expect(assignment.start_time.to_date).to eq(assignment.end_time.to_date)
        end
      end

      it 'creates assignments for consecutive days' do
        assignments = described_class.assign_shifts(
          driver:,
          schedule: :daily_for_6_days,
          start_date:,
          end_date:
        )

        dates = assignments.map { |a| a.start_time.to_date }.sort
        expected_dates = (start_date..start_date + 5.days).to_a

        expect(dates).to eq(expected_dates)
      end

      it 'accepts custom city parameter' do
        assignments = described_class.assign_shifts(
          driver:,
          schedule: :daily_for_6_days,
          start_date:,
          end_date:,
          city: :kumasi
        )

        expect(assignments.all? { |a| a.city == 'kumasi' }).to be true
      end

      it 'skips existing assignments' do
        # Create an existing assignment for the first day
        existing_assignment = create(
          :shift_assignment,
          driver:,
          start_time: start_date.beginning_of_day + 8.hours,
          end_time: start_date.beginning_of_day + 17.hours
)

        assignments = described_class.assign_shifts(
          driver:,
          schedule: :daily_for_6_days,
          start_date:,
          end_date:
        )

        # Should create 5 new assignments (skipping the existing one)
        expect(assignments.count).to eq(5)
        expect(assignments.none? { |a| a.id == existing_assignment.id }).to be true
      end
    end

    context 'with invalid driver' do
      it 'raises error for nil driver' do
        expect {
          described_class.assign_shifts(
            driver: nil,
            schedule: :daily_for_6_days,
            start_date:,
            end_date:
          )
        }.to raise_error(StandardError, 'Driver is not active')
      end

      it 'raises error for unverified driver' do
        unverified_driver = create(:driver, verified: false)

        expect {
          described_class.assign_shifts(
            driver: unverified_driver,
            schedule: :daily_for_6_days,
            start_date:,
            end_date:
          )
        }.to raise_error(StandardError, 'Driver is not verified')
      end

      it 'raises error for non-persisted driver' do
        new_driver = build(:driver, verified: true)

        expect {
          described_class.assign_shifts(
            driver: new_driver,
            schedule: :daily_for_6_days,
            start_date:,
            end_date:
          )
        }.to raise_error(StandardError, 'Driver is not active')
      end
    end

    context 'with unsupported schedule' do
      it 'raises error for unsupported schedule' do
        expect {
          described_class.assign_shifts(
            driver:,
            schedule: :weekly,
            start_date:,
            end_date:
          )
        }.to raise_error(StandardError, 'Unsupported schedule: weekly')
      end
    end

    context 'with database errors' do
      it 'raises error when assignment creation fails' do
        allow(ShiftAssignment).to receive(:create!).and_raise(
          ActiveRecord::RecordInvalid.new(ShiftAssignment.new)
        )

        expect {
          described_class.assign_shifts(
            driver:,
            schedule: :daily_for_6_days,
            start_date:,
            end_date:
          )
        }.to raise_error(StandardError, /Failed to assign shifts/)
      end
    end

    context 'with multiple calls' do
      it 'handles multiple assignment calls correctly' do
        # First call
        first_assignments = described_class.assign_shifts(
          driver:,
          schedule: :daily_for_6_days,
          start_date:,
          end_date:
        )

        # Second call should skip existing assignments
        second_assignments = described_class.assign_shifts(
          driver:,
          schedule: :daily_for_6_days,
          start_date:,
          end_date:
        )

        expect(first_assignments.count).to eq(6)
        expect(second_assignments.count).to eq(0) # All already exist
        expect(ShiftAssignment.where(driver:).count).to eq(6)
      end
    end

    context 'with different start dates' do
      it 'creates assignments starting from the specified date' do
        future_start_date = Date.current + 1.week

        assignments = described_class.assign_shifts(
          driver:,
          schedule: :daily_for_6_days,
          start_date: future_start_date,
          end_date: future_start_date + 10.days
        )

        expect(assignments.count).to eq(6)
        expect(assignments.first.start_time.to_date).to eq(future_start_date)
        expect(assignments.last.start_time.to_date).to eq(future_start_date + 5.days)
      end
    end
  end

  describe 'private methods' do
    describe '#generate_daily_schedule' do
      it 'generates correct number of days' do
        dates = described_class.send(:generate_daily_schedule, start_date, end_date, 6, 0)

        expect(dates.count).to eq(6)
        expect(dates.first).to eq(start_date)
        expect(dates.last).to eq(start_date + 5.days)
      end
    end

    describe '#existing_assignment?' do
      it 'returns true when assignment exists' do
        create(
          :shift_assignment,
          driver:,
          start_time: start_date.beginning_of_day + 8.hours,
          end_time: start_date.beginning_of_day + 17.hours
)

        result = described_class.send(:existing_assignment?, driver, start_date)

        expect(result).to be true
      end

      it 'returns false when no assignment exists' do
        result = described_class.send(:existing_assignment?, driver, start_date)

        expect(result).to be false
      end
    end
  end
end
