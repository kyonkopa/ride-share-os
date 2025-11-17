# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Queries::TodayShiftsQuery do
  let(:user) { create(:user, :confirmed, :with_driver) }
  let(:driver) { user.driver }
  let(:vehicle) { create(:vehicle) }

  let(:query) do
    <<~GQL
      query TodayShifts {
        todayShifts {
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

  let(:context) { { current_user: user } }

  describe 'when user has shifts scheduled for today' do
    let(:today_shift) { create(:shift_assignment, driver:, vehicle:, start_time: Date.current.beginning_of_day + 8.hours, end_time: Date.current.beginning_of_day + 21.hours) }
    let(:another_today_shift) { create(:shift_assignment, driver:, vehicle:, start_time: Date.current.beginning_of_day + 10.hours, end_time: Date.current.beginning_of_day + 23.hours) }

    before do
      today_shift
      another_today_shift
      # Create shifts outside today to verify they're excluded
      create(:shift_assignment, driver:, vehicle:, start_time: Date.current - 1.day + 8.hours, end_time: Date.current - 1.day + 21.hours)
      create(:shift_assignment, driver:, vehicle:, start_time: Date.current + 1.day + 8.hours, end_time: Date.current + 1.day + 21.hours)
    end

    it 'returns only today\'s shifts' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .with_effects do |shifts, _full_result|
          expect(shifts.length).to eq(2)
          expect(shifts.map { |s| s["id"] }).to include(
            today_shift.global_id,
            another_today_shift.global_id
          )
        end
    end

    it 'returns shifts ordered by start_time ascending' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .with_effects do |shifts, _full_result|
          dates = shifts.map { |s| DateTime.parse(s["startTime"]) }
          expect(dates).to eq(dates.sort)
        end
    end
  end

  describe 'when user has no shifts scheduled for today' do
    before do
      create(:shift_assignment, driver:, vehicle:, start_time: Date.current - 1.day + 8.hours, end_time: Date.current - 1.day + 21.hours)
      create(:shift_assignment, driver:, vehicle:, start_time: Date.current + 1.day + 8.hours, end_time: Date.current + 1.day + 21.hours)
    end

    it 'returns an empty array' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .and_return([])
    end
  end

  describe 'when user has no driver profile' do
    let(:user_without_driver) { create(:user, :confirmed) }
    let(:context) { { current_user: user_without_driver } }

    it 'returns an empty array' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .and_return([])
    end
  end

  describe 'when user is not authenticated' do
    let(:context) { {} }

    it 'returns an empty array' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_errors(["Authentication is required"])
    end
  end
end
