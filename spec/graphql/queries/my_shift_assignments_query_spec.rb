# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Queries::MyShiftAssignmentsQuery do
  let(:user) { create(:user, :confirmed, :with_driver) }
  let(:driver) { user.driver }
  let(:vehicle) { create(:vehicle) }

  let(:query) do
    <<~GQL
      query MyShiftAssignments($startDate: ISO8601Date!, $endDate: ISO8601Date!) {
        myShiftAssignments(startDate: $startDate, endDate: $endDate) {
          id
          globalId
          status
          startTime
          endTime
          city
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

  describe 'when user has shift assignments in the date range' do
    let(:shift_in_range) { create(:shift_assignment, driver:, vehicle:, start_time: start_date + 1.day, end_time: start_date + 1.day + 13.hours) }
    let(:shift_at_start) { create(:shift_assignment, driver:, vehicle:, start_time: start_date.beginning_of_day, end_time: start_date.beginning_of_day + 13.hours) }

    before do
      # Create shifts within range
      shift_in_range
      shift_at_start
      create(:shift_assignment, driver:, vehicle:, start_time: end_date.end_of_day - 1.hour, end_time: end_date.end_of_day + 12.hours)
      # Create shifts outside range to verify they're excluded
      create(:shift_assignment, driver:, vehicle:, start_time: start_date - 1.day, end_time: start_date - 1.day + 13.hours)
      create(:shift_assignment, driver:, vehicle:, start_time: end_date + 1.day, end_time: end_date + 1.day + 13.hours)
    end

    it 'returns only shifts within the date range' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          myShiftAssignments: array_including(
            {
              id: shift_in_range.global_id,
              status: "scheduled"
            },
            {
              id: shift_at_start.global_id,
              status: "scheduled"
            }
          )
        }.with_indifferent_access)
        .with_effects do
          result = BackendSchema.execute(query, variables:, context:)
          assignments = result.dig("data", "myShiftAssignments")
          expect(assignments.length).to eq(3)
        end
    end

    it 'returns shifts ordered by start_time ascending' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do
          result = BackendSchema.execute(query, variables:, context:)
          assignments = result.dig("data", "myShiftAssignments")
          dates = assignments.map { |a| DateTime.parse(a["startTime"]) }
          expect(dates).to eq(dates.sort)
          expect(assignments.length).to eq(3)
        end
    end
  end

  describe 'when user has no shift assignments in the date range' do
    before do
      create(:shift_assignment, driver:, vehicle:, start_time: start_date - 1.day, end_time: start_date - 1.day + 13.hours)
      create(:shift_assignment, driver:, vehicle:, start_time: end_date + 1.day, end_time: end_date + 1.day + 13.hours)
    end

    it 'returns an empty array' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          myShiftAssignments: []
        }.with_indifferent_access)
    end
  end

  describe 'when user has no driver profile' do
    let(:user_without_driver) { create(:user, :confirmed) }
    let(:context) { { current_user: user_without_driver } }

    it 'returns an empty array' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          myShiftAssignments: []
        }.with_indifferent_access)
    end
  end

  describe 'when user is not authenticated' do
    let(:context) { {} }

    it 'returns an empty array' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          myShiftAssignments: []
        }.with_indifferent_access)
    end
  end
end
