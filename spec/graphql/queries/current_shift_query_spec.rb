# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Queries::CurrentShiftQuery do
  let(:user) { create(:user, :confirmed, :with_driver) }
  let(:driver) { user.driver }
  let(:vehicle) { create(:vehicle) }

  let(:query) do
    <<~GQL
      query CurrentShift {
        currentShift {
          id
          globalId
          status
          startTime
          endTime
          driver {
            id
            fullName
          }
          vehicle {
            id
            licensePlate
          }
        }
      }
    GQL
  end

  let(:context) { { current_user: user } }

  describe 'when user has an active shift' do
    let!(:active_shift) { create(:shift_assignment, :active, driver:, vehicle:) }

    it 'returns the active shift' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .and_return({
          currentShift: {
            id: active_shift.global_id,
            globalId: active_shift.global_id,
            status: "active",
            startTime: active_shift.start_time.iso8601,
            endTime: active_shift.end_time.iso8601,
            driver: {
              id: driver.global_id,
              fullName: driver.full_name
            },
            vehicle: {
              id: vehicle.global_id,
              licensePlate: vehicle.license_plate
            }
          }
        }.with_indifferent_access)
    end
  end

  describe 'when user has a paused shift' do
    let!(:paused_shift) { create(:shift_assignment, :paused, driver:, vehicle:) }

    it 'returns the paused shift' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .and_return({
          currentShift: {
            id: paused_shift.global_id,
            status: "paused"
          }
        }.with_indifferent_access)
    end
  end

  describe 'when user has both active and paused shifts' do
    before do
      create(:shift_assignment, :paused, driver:, vehicle:)
      create(:shift_assignment, :active, driver:, vehicle:)
    end

    it 'returns the first active or paused shift' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .and_return({
          currentShift: {
            id: match(/ShiftAssignment:[a-zA-Z0-9]+/)
          }
        }.with_indifferent_access)
    end
  end

  describe 'when user has no active or paused shifts' do
    before do
      create(:shift_assignment, :completed, driver:, vehicle:)
    end

    it 'returns nil' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .and_return({
          currentShift: nil
        }.with_indifferent_access)
    end
  end

  describe 'when user has no driver profile' do
    let(:user_without_driver) { create(:user, :confirmed) }
    let(:context) { { current_user: user_without_driver } }

    it 'returns nil' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .and_return({
          currentShift: nil
        }.with_indifferent_access)
    end
  end

  describe 'when user is not authenticated' do
    let(:context) { {} }

    it 'returns nil' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .and_return({
          currentShift: nil
        }.with_indifferent_access)
    end
  end
end
