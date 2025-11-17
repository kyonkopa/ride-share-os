# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Queries::TodaysShiftEventsQuery do
  let(:user) { create(:user, :confirmed, :with_driver) }
  let(:driver) { user.driver }
  let(:vehicle) { create(:vehicle) }
  let(:shift_assignment) { create(:shift_assignment, driver:, vehicle:, start_time: Date.current.beginning_of_day) }

  let(:query) do
    <<~GQL
      query TodaysShiftEvents {
        todaysShiftEvents {
          id
          globalId
          eventType
          odometer
          vehicleRange
          gpsLat
          gpsLon
          notes
          createdAt
        }
      }
    GQL
  end

  let(:context) { { current_user: user } }

  describe 'when user has shift events for today' do
    let(:today_clock_in) { create(:shift_event, :clock_in, shift_assignment:, created_at: Date.current.beginning_of_day + 8.hours) }
    let(:today_pause) { create(:shift_event, :pause, shift_assignment:, created_at: Date.current.beginning_of_day + 10.hours) }

    before do
      today_clock_in
      today_pause
      create(:shift_event, :resume, shift_assignment:, created_at: Date.current.beginning_of_day + 11.hours)
      # Create events outside today to verify they're excluded
      create(:shift_event, :clock_in, shift_assignment:, created_at: Date.current - 1.day)
      create(:shift_event, :clock_out, shift_assignment:, created_at: Date.current + 1.day)
    end

    it 'returns only today\'s shift events' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .with_effects do |events, _full_result|
          expect(events.length).to eq(3)
          expect(events.map { |e| e["id"] }).to include(
            today_clock_in.global_id,
            today_pause.global_id
          )
          expect(events.find { |e| e["id"] == today_clock_in.global_id }).to include(
            "eventType" => "clock_in"
          )
          expect(events.find { |e| e["id"] == today_pause.global_id }).to include(
            "eventType" => "pause"
          )
        end
    end

    it 'returns events ordered by created_at descending' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .with_effects do |events, _full_result|
          dates = events.map { |e| DateTime.parse(e["createdAt"]) }
          expect(dates).to eq(dates.sort.reverse)
        end
    end
  end

  describe 'when user has no shift events for today' do
    before do
      create(:shift_event, :clock_in, shift_assignment:, created_at: Date.current - 1.day)
      create(:shift_event, :clock_out, shift_assignment:, created_at: Date.current + 1.day)
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
