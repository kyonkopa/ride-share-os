# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ExpenseService do
  let(:start_date) { Date.new(2024, 1, 1) }
  let(:end_date) { Date.new(2024, 1, 7) }

  describe '.aggregate_expenses' do
    context 'with expenses in date range' do
      it 'sums all expenses created within the date range' do
        # Create expenses within range (amounts in cents)
        create(:expense, amount: 10000, created_at: start_date.beginning_of_day + 10.hours) # 100.00
        create(:expense, amount: 5000, created_at: (start_date + 1.day).beginning_of_day + 10.hours) # 50.00
        create(:expense, amount: 2500, created_at: (start_date + 2.days).beginning_of_day + 10.hours) # 25.00

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(175.0) # 100 + 50 + 25
      end

      it 'converts amounts from cents to decimal correctly' do
        create(:expense, amount: 12345, created_at: start_date.beginning_of_day + 10.hours) # 123.45

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(123.45)
      end

      it 'handles expenses with different categories' do
        create(:expense, amount: 10000, category: "fuel", created_at: start_date.beginning_of_day + 10.hours) # 100.00
        create(:expense, amount: 5000, category: "maintenance", created_at: start_date.beginning_of_day + 11.hours) # 50.00
        create(:expense, amount: 3000, category: "other", description: "Other expense", created_at: start_date.beginning_of_day + 12.hours) # 30.00

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(180.0)
      end

      it 'handles expenses associated with vehicles' do
        vehicle = create(:vehicle)
        create(:expense, vehicle:, amount: 10000, created_at: start_date.beginning_of_day + 10.hours) # 100.00

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(100.0)
      end

      it 'handles expenses associated with users' do
        user = create(:user)
        create(:expense, :with_user, user:, amount: 10000, created_at: start_date.beginning_of_day + 10.hours) # 100.00

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(100.0)
      end

      it 'excludes expenses created before the start date' do
        create(:expense, amount: 10000, created_at: start_date.beginning_of_day + 10.hours) # 100.00
        create(:expense, amount: 5000, created_at: (start_date - 1.day).beginning_of_day + 10.hours) # 50.00

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(100.0)
      end

      it 'excludes expenses created after the end date' do
        create(:expense, amount: 10000, created_at: start_date.beginning_of_day + 10.hours) # 100.00
        create(:expense, amount: 5000, created_at: (end_date + 1.day).beginning_of_day + 10.hours) # 50.00

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(100.0)
      end

      it 'includes expenses created exactly at start date beginning of day' do
        create(:expense, amount: 10000, created_at: start_date.beginning_of_day) # 100.00

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(100.0)
      end

      it 'includes expenses created exactly at end date end of day' do
        create(:expense, amount: 10000, created_at: end_date.end_of_day) # 100.00

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(100.0)
      end
    end

    context 'with no expenses' do
      it 'returns zero when no expenses exist' do
        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(0.0)
      end

      it 'returns zero when no expenses exist in date range' do
        create(:expense, amount: 10000, created_at: (start_date - 5.days).beginning_of_day + 10.hours) # 100.00

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(0.0)
      end
    end

    context 'with decimal amounts' do
      it 'handles amounts that result in decimal values correctly' do
        create(:expense, amount: 1234, created_at: start_date.beginning_of_day + 10.hours) # 12.34
        create(:expense, amount: 5678, created_at: start_date.beginning_of_day + 11.hours) # 56.78

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(69.12)
      end

      it 'handles odd cent amounts correctly' do
        create(:expense, amount: 1, created_at: start_date.beginning_of_day + 10.hours) # 0.01
        create(:expense, amount: 99, created_at: start_date.beginning_of_day + 11.hours) # 0.99

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(1.0)
      end
    end

    context 'with single day date range' do
      it 'works correctly with same start and end date' do
        create(:expense, amount: 10000, created_at: start_date.beginning_of_day + 10.hours) # 100.00

        result = described_class.aggregate_expenses(start_date:, end_date: start_date)

        expect(result).to eq(100.0)
      end
    end

    context 'with large amounts' do
      it 'handles very large expense amounts correctly' do
        create(:expense, amount: 1_000_000, created_at: start_date.beginning_of_day + 10.hours) # 10000.00

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(10000.0)
      end

      it 'handles multiple large expenses' do
        create(:expense, amount: 500_000, created_at: start_date.beginning_of_day + 10.hours) # 5000.00
        create(:expense, amount: 300_000, created_at: start_date.beginning_of_day + 11.hours) # 3000.00

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(8000.0)
      end
    end

    context 'edge cases' do
      it 'handles expenses with zero amount (should not exist but tests robustness)' do
        # Note: This should not happen due to validations, but testing for robustness
        expense = build(:expense, amount: 0)
        expense.save(validate: false)
        expense.update_column(:created_at, start_date.beginning_of_day + 10.hours)

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(0.0)
      end

      it 'handles expenses created at different times of day' do
        create(:expense, amount: 10000, created_at: start_date.beginning_of_day + 1.hour) # 100.00
        create(:expense, amount: 5000, created_at: start_date.beginning_of_day + 12.hours) # 50.00
        create(:expense, amount: 2500, created_at: start_date.beginning_of_day + 23.hours) # 25.00

        result = described_class.aggregate_expenses(start_date:, end_date:)

        expect(result).to eq(175.0)
      end
    end
  end
end
