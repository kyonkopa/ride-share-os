# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RevenueRecord do
  subject { build(:revenue_record) }

  describe 'associations' do
    it { is_expected.to belong_to(:shift_assignment) }
    it { is_expected.to belong_to(:driver) }
    it { is_expected.to belong_to(:vehicle).optional }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:total_revenue) }
    it { is_expected.to validate_presence_of(:total_profit) }
    it { is_expected.to validate_presence_of(:source) }
    it { is_expected.to validate_numericality_of(:total_revenue).is_greater_than_or_equal_to(0) }
    it { is_expected.to validate_numericality_of(:total_profit).is_greater_than_or_equal_to(0) }

    describe 'total_revenue numericality' do
      context 'when revenue is negative' do
        it 'is invalid' do
          revenue_record = build(:revenue_record, total_revenue: -10.0)
          expect(revenue_record).not_to be_valid
          expect(revenue_record.errors[:total_revenue]).to be_present
        end
      end
    end

    describe 'total_profit numericality' do
      context 'when profit is negative' do
        it 'is invalid' do
          revenue_record = build(:revenue_record, total_profit: -5.0)
          expect(revenue_record).not_to be_valid
          expect(revenue_record.errors[:total_profit]).to be_present
        end
      end
    end

    describe 'reconciled inclusion' do
      context 'when reconciled is nil' do
        it 'is invalid' do
          revenue_record = build(:revenue_record, reconciled: nil)
          expect(revenue_record).not_to be_valid
          expect(revenue_record.errors[:reconciled]).to be_present
        end
      end
    end
  end

  describe 'unique_driver_source_per_day' do
      let(:driver) { create(:driver) }
      let(:shift_date) { Date.current }
      let(:shift_assignment) do
        create(:shift_assignment, driver:, start_time: shift_date.beginning_of_day + 8.hours)
      end
      let(:other_shift_assignment) do
        create(:shift_assignment, driver:, start_time: shift_date.beginning_of_day + 9.hours)
      end

      [:bolt, :uber].each do |source|
        context "when source is #{source}" do
          context "when no other #{source} record exists for the same driver and date" do
            it 'is valid' do
              revenue_record = build(:revenue_record, source, shift_assignment:, driver:)
              expect(revenue_record).to be_valid
            end
          end

          context "when another #{source} record exists for the same driver and date" do
            before do
              create(:revenue_record, source, shift_assignment:, driver:)
            end

            it 'is valid when using a different shift assignment' do
              revenue_record = build(:revenue_record, source, shift_assignment: other_shift_assignment, driver:)
              expect(revenue_record).to be_valid
            end

            it 'is invalid when using the same shift assignment' do
              revenue_record = build(:revenue_record, source, shift_assignment:, driver:)
              expect(revenue_record).not_to be_valid
              expect(revenue_record.errors[:base]).to include(
                "A revenue record already exists for this driver, source (#{source}), and date"
              )
            end
          end

          context "when another #{source} record exists for a different driver on the same date" do
            let(:other_driver) { create(:driver) }
            let(:other_driver_shift_assignment) do
              create(:shift_assignment, driver: other_driver, start_time: shift_date.beginning_of_day + 8.hours)
            end

            before do
              create(:revenue_record, source, shift_assignment: other_driver_shift_assignment, driver: other_driver)
            end

            it 'is valid' do
              revenue_record = build(:revenue_record, source, shift_assignment:, driver:)
              expect(revenue_record).to be_valid
            end
          end

          context "when another #{source} record exists for the same driver on a different date" do
            let(:different_date) { 1.day.ago.to_date }
            let(:different_date_shift_assignment) do
              create(:shift_assignment, driver:, start_time: different_date.beginning_of_day + 8.hours)
            end

            before do
              # Create record with created_at set to the different date to match validation logic
              record = create(:revenue_record, source, shift_assignment: different_date_shift_assignment, driver:)
              record.update_column(:created_at, different_date.beginning_of_day + 10.hours)
            end

            it 'is valid' do
              revenue_record = build(:revenue_record, source, shift_assignment:, driver:)
              expect(revenue_record).to be_valid
            end
          end

          context "when another #{source == :bolt ? :uber : :bolt} record exists for the same driver and date" do
            other_source = source == :bolt ? :uber : :bolt
            before do
              create(:revenue_record, other_source, shift_assignment:, driver:)
            end

            it 'is valid' do
              revenue_record = build(:revenue_record, source, shift_assignment: other_shift_assignment, driver:)
              expect(revenue_record).to be_valid
            end
          end
        end
      end

      context 'when source is off_trip' do
        context 'when another off_trip record exists for the same driver and date' do
          before do
            create(:revenue_record, source: :off_trip, shift_assignment:, driver:)
          end

          it 'is valid (uniqueness validation does not apply to off_trip)' do
            revenue_record = build(:revenue_record, source: :off_trip, shift_assignment: other_shift_assignment, driver:)
            expect(revenue_record).to be_valid
          end
        end

        context 'when multiple off_trip records exist for the same driver and date' do
          before do
            create(:revenue_record, source: :off_trip, shift_assignment:, driver:)
            create(:revenue_record, source: :off_trip, shift_assignment: other_shift_assignment, driver:)
          end

          it 'allows creating another off_trip record' do
            third_shift_assignment = create(:shift_assignment, driver:, start_time: shift_date.beginning_of_day + 10.hours)
            revenue_record = build(:revenue_record, source: :off_trip, shift_assignment: third_shift_assignment, driver:)
            expect(revenue_record).to be_valid
          end
        end
      end

      context 'when updating an existing record' do
        let!(:existing_record) { create(:revenue_record, :bolt, shift_assignment:, driver:) }

        it 'does not run validation on update' do
          # Validation only runs on create, so updating should not trigger it
          existing_record.update_column(:created_at, shift_assignment.start_time.beginning_of_day + 10.hours)
          existing_record.total_revenue = 200.0
          # The validation does not run on update, so the record should be valid
          expect(existing_record).to be_valid
        end
      end

      context 'when shift_assignment_id is not present' do
        it 'skips the validation' do
          revenue_record = build(:revenue_record, :bolt, shift_assignment: nil, driver:)
          revenue_record.shift_assignment_id = nil
          # The validation should not run, but the record will be invalid due to belongs_to
          # So we'll just check that the unique validation doesn't add errors
          revenue_record.valid?
          expect(revenue_record.errors[:base]).not_to include(
            match(/A revenue record already exists/)
          )
        end
      end
  end
end
