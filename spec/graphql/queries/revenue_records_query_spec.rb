# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Queries::RevenueRecordsQuery do
  let(:user) { create(:user, :confirmed, :with_driver) }
  let(:driver) { user.driver }
  let(:vehicle) { create(:vehicle) }
  let(:shift_assignment) { create(:shift_assignment, driver:, vehicle:) }

  let(:query) do
    <<~GQL
      query RevenueRecords($startDate: ISO8601Date, $endDate: ISO8601Date) {
        revenueRecords(startDate: $startDate, endDate: $endDate) {
          id
          globalId
          totalRevenue
          totalProfit
          reconciled
          source
          createdAt
          driver {
            id
            fullName
          }
          shiftAssignment {
            id
          }
        }
      }
    GQL
  end

  let(:start_date) { Date.current }
  let(:end_date) { Date.current + 7.days }

  let(:variables) do
    {
      startDate: start_date.iso8601,
      endDate: end_date.iso8601
    }
  end

  let(:context) { { current_user: user } }

  describe 'when revenue records exist within the date range' do
    let(:record_in_range) do
      create(
        :revenue_record, :bolt, shift_assignment:, driver:,
                                created_at: start_date + 1.day
)
    end
    let(:record_at_start) do
      create(
        :revenue_record, :uber, shift_assignment:, driver:,
                                created_at: start_date.beginning_of_day
)
    end
    let(:record_at_end) do
      create(
        :revenue_record, source: :off_trip, shift_assignment:, driver:,
                         created_at: end_date.end_of_day
)
    end

    before do
      # Create records within range
      record_in_range
      record_at_start
      record_at_end
      # Create records outside range to verify they're excluded
      # Use different sources to avoid uniqueness validation issues
      create(
        :revenue_record, source: :off_trip, shift_assignment:, driver:,
                         created_at: start_date - 1.day
      )
      create(
        :revenue_record, source: :off_trip, shift_assignment:, driver:,
                         created_at: end_date + 1.day
      )
    end

    it 'returns only revenue records within the date range' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |records, _full_result|
          expect(records.length).to eq(3)
          record_ids = records.map { |r| r["id"] }
          expect(record_ids).to include(record_in_range.global_id)
          expect(record_ids).to include(record_at_start.global_id)
          expect(record_ids).to include(record_at_end.global_id)
        end
    end

    it 'returns records ordered by created_at descending' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |records, _full_result|
          dates = records.map { |r| DateTime.parse(r["createdAt"]) }
          expect(dates).to eq(dates.sort.reverse)
          expect(records.length).to eq(3)
        end
    end
  end

  describe 'when only start_date is provided' do
    let(:variables) do
      {
        startDate: start_date.iso8601
      }
    end

    before do
      create(
        :revenue_record, shift_assignment:, driver:,
                         created_at: start_date + 1.day
)
      create(
        :revenue_record, shift_assignment:, driver:,
                         created_at: start_date - 1.day
)
    end

    it 'returns all records from start_date onwards' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |records, _full_result|
          expect(records.length).to eq(1)
        end
    end
  end

  describe 'when only end_date is provided' do
    let(:variables) do
      {
        endDate: end_date.iso8601
      }
    end

    before do
      create(
        :revenue_record, shift_assignment:, driver:,
                         created_at: end_date - 1.day
)
      create(
        :revenue_record, shift_assignment:, driver:,
                         created_at: end_date + 1.day
)
    end

    it 'returns all records up to end_date' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |records, _full_result|
          expect(records.length).to eq(1)
        end
    end
  end

  describe 'when no date filters are provided' do
    let(:variables) { {} }

    before do
      create(
        :revenue_record, shift_assignment:, driver:,
                         created_at: start_date - 5.days
)
      create(
        :revenue_record, shift_assignment:, driver:,
                         created_at: start_date + 1.day
)
      create(
        :revenue_record, shift_assignment:, driver:,
                         created_at: end_date + 5.days
)
    end

    it 'returns all revenue records' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |records, _full_result|
          expect(records.length).to eq(3)
        end
    end
  end

  describe 'when no revenue records exist in the date range' do
    before do
      create(
        :revenue_record, shift_assignment:, driver:,
                         created_at: start_date - 1.day
)
      create(
        :revenue_record, shift_assignment:, driver:,
                         created_at: end_date + 1.day
)
    end

    it 'returns an empty array' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .and_return([])
    end
  end

  describe 'when user is not authenticated' do
    let(:context) { {} }

    before do
      create(:revenue_record, shift_assignment:, driver:)
    end

    it 'returns an authentication error' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_errors(["Authentication is required"])
    end
  end
end
