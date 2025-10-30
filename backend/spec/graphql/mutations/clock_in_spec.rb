# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::ClockIn do
  let(:user) { create(:user, :confirmed, :with_driver) }
  let(:driver) { user.driver }
  let(:vehicle) { create(:vehicle) }
  let(:shift_assignment) { create(:shift_assignment, driver:, vehicle:) }

  let(:mutation) do
    <<~GQL
      mutation ClockIn($input: ClockInInput!) {
        clockIn(input: $input) {
          shiftEvent {
            id
            eventType
            odometer
            vehicleRange
            gpsLat
            gpsLon
            notes
            shiftAssignment {
              id
              status
            }
          }
          errors {
            message
            field
            code
          }
        }
      }
    GQL
  end

  let(:variables) do
    {
      input: {
        shiftAssignmentId: shift_assignment.id,
        odometer: 50000,
        vehicleRange: 300,
        gpsLat: 5.6037,
        gpsLon: -0.1870,
        notes: "Starting shift"
      }
    }
  end

  let(:context) { { current_user: user } }

  describe 'successful clock in' do
    it 'creates a shift event and updates shift assignment status' do
      expect(mutation).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          shiftEvent: {
            id: /ShiftEvent:[a-zA-Z0-9]+/,
            eventType: 0, # clock_in enum value
            odometer: 50000,
            vehicleRange: 300,
            gpsLat: 5.6037,
            gpsLon: -0.1870,
            notes: "Starting shift",
            shiftAssignment: {
              id: shift_assignment.global_id,
              status: "active"
            }
          },
          errors: []
        }.with_indifferent_access)
        .with_effects do
          expect(shift_assignment.reload.status).to eq('active')
          expect(shift_assignment.shift_events.count).to eq(1)
          expect(shift_assignment.shift_events.first.event_type).to eq('clock_in')
        end
    end

    context 'without shift_assignment_id (auto-find active shift)' do
      let(:active_shift) { create(:shift_assignment, :scheduled, driver:, vehicle:) }
      let(:variables) do
        {
          input: {
            odometer: 50000,
            notes: "Auto-found shift"
          }
        }
      end

      before do
        active_shift # create the active shift
      end

      it 'finds and uses the active shift assignment' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .and_return({
            shiftEvent: {
              id: /ShiftEvent:[a-zA-Z0-9]+/,
              eventType: 0,
              odometer: 50000,
              notes: "Auto-found shift",
              shiftAssignment: {
                id: active_shift.global_id,
                status: "active"
              }
            }
          }.with_indifferent_access)
      end
    end
  end

  describe 'error cases' do
    context 'when shift assignment not found' do
      let(:variables) do
        {
          input: {
            shiftAssignmentId: 99999
          }
        }
      end

      it 'returns an error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_mutation_error([{ "message" => "Shift assignment not found", "field" => "shift_assignment_id", "code" => "SHIFT_ASSIGNMENT_NOT_FOUND" }])
      end
    end

    context 'when user is not the assigned driver' do
      let(:other_driver) { create(:driver) }
      let(:other_shift) { create(:shift_assignment, driver: other_driver, vehicle:) }
      let(:variables) do
        {
          input: {
            shiftAssignmentId: other_shift.id
          }
        }
      end

      it 'returns a permission denied error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_mutation_error([{ "message" => "You don't have permission to clock into this shift", "field" => nil, "code" => "PERMISSION_DENIED" }])
      end
    end

    context 'when user has no driver profile' do
      let(:user_without_driver) { create(:user, :confirmed) }

      let(:context) { { current_user: user_without_driver } }

      it 'returns a permission denied error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_mutation_error([{ "message" => "You do not have a driver profile", "field" => nil, "code" => "NO_DRIVER_PROFILE" }])
      end
    end

    context 'when already clocked in' do
      before do
        create(:shift_event, shift_assignment:, event_type: :clock_in)
      end

      it 'returns an already clocked in error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_mutation_error([{ "message" => "Already clocked in to this shift", "field" => nil, "code" => "ALREADY_CLOCKED_IN" }])
      end
    end

    context 'when no active shift found and no shift_assignment_id provided' do
      let(:variables) do
        {
          input: {
            odometer: 50000
          }
        }
      end

      it 'returns a shift assignment not found error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_mutation_error([{ "message" => "Shift assignment not found", "field" => "shift_assignment_id", "code" => "SHIFT_ASSIGNMENT_NOT_FOUND" }])
      end
    end
  end

  describe 'validation errors' do
    context 'with invalid odometer reading' do
      let(:variables) do
        {
          input: {
            shiftAssignmentId: shift_assignment.id,
            odometer: -100
          }
        }
      end

      it 'returns validation errors' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_mutation_error([{ "message" => "Odometer must be greater than or equal to 0", "field" => "odometer", "code" => "greater_than_or_equal_to" }])
      end
    end

    context 'with invalid GPS coordinates' do
      let(:variables) do
        {
          input: {
            shiftAssignmentId: shift_assignment.id,
            gpsLat: 95.0, # Invalid latitude
            gpsLon: 185.0 # Invalid longitude
          }
        }
      end

      it 'returns validation errors' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_mutation_error([
            { "message" => "Gps lat must be less than or equal to 90", "field" => "gps_lat", "code" => "less_than_or_equal_to" },
            { "message" => "Gps lon must be less than or equal to 180", "field" => "gps_lon", "code" => "less_than_or_equal_to" }
          ])
      end
    end

    context 'with invalid vehicle range' do
      let(:variables) do
        {
          input: {
            shiftAssignmentId: shift_assignment.id,
            vehicleRange: -50
          }
        }
      end

      it 'returns validation errors' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_mutation_error([{ "message" => "Vehicle range must be greater than or equal to 0", "field" => "vehicle_range", "code" => "greater_than_or_equal_to" }])
      end
    end
  end

  describe 'authentication' do
    context 'when user is not authenticated' do
      let(:context) { {} }

      it 'returns an authentication error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_errors(['Authentication is required'])
      end
    end
  end
end
