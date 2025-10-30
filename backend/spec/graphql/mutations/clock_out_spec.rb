# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::ClockOut do
  let(:user) { create(:user, :confirmed, :with_driver) }
  let(:driver) { user.driver }
  let(:vehicle) { create(:vehicle) }
  let(:shift_assignment) { create(:shift_assignment, :active, driver:, vehicle:) }

  let(:mutation) do
    <<~GQL
      mutation ClockOut($input: ClockOutInput!) {
        clockOut(input: $input) {
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
        odometer: 51000,
        vehicleRange: 250,
        gpsLat: 5.6037,
        gpsLon: -0.1870,
        notes: "Ending shift"
      }
    }
  end

  let(:context) { { current_user: user } }

  # Create a clock-in event before each test
  before do
    create(:shift_event, :clock_in, shift_assignment:, odometer: 50000, vehicle_range: 300)
  end

  describe 'successful clock out' do
    it 'creates a shift event and updates shift assignment status to completed' do
      expect(mutation).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          shiftEvent: {
            id: /ShiftEvent:[a-zA-Z0-9]+/,
            eventType: 1, # clock_out enum value
            odometer: 51000,
            vehicleRange: 250,
            gpsLat: 5.6037,
            gpsLon: -0.1870,
            notes: "Ending shift",
            shiftAssignment: {
              id: shift_assignment.global_id,
              status: "completed"
            }
          },
          errors: []
        }.with_indifferent_access)
        .with_effects do
          expect(shift_assignment.reload.status).to eq('completed')
          expect(shift_assignment.shift_events.count).to eq(2) # clock_in + clock_out
          expect(shift_assignment.shift_events.last.event_type).to eq('clock_out')
        end
    end

    context 'without shift_assignment_id (auto-find active shift)' do
      let(:variables) do
        {
          input: {
            odometer: 51000,
            notes: "Auto-found active shift"
          }
        }
      end

      it 'finds and uses the active shift assignment' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .and_return({
            shiftEvent: {
              id: /ShiftEvent:[a-zA-Z0-9]+/,
              eventType: 1,
              odometer: 51000,
              notes: "Auto-found active shift",
              shiftAssignment: {
                id: shift_assignment.global_id,
                status: "completed"
              }
            }
          }.with_indifferent_access)
      end
    end

    context 'with minimal data' do
      let(:variables) do
        {
          input: {
            shiftAssignmentId: shift_assignment.id
          }
        }
      end

      it 'creates a clock out event with minimal data' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .and_return({
            shiftEvent: {
              id: /ShiftEvent:[a-zA-Z0-9]+/,
              eventType: 1,
              odometer: nil,
              vehicleRange: nil,
              gpsLat: nil,
              gpsLon: nil,
              notes: nil,
              shiftAssignment: {
                id: shift_assignment.global_id,
                status: "completed"
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

    context 'when no active shift found and no shift_assignment_id provided' do
      let(:variables) do
        {
          input: {
            odometer: 51000
          }
        }
      end

      before do
        # Make sure there are no active shifts
        ShiftAssignment.update_all(status: :completed)
      end

      it 'returns a shift assignment not found error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_mutation_error([{ "message" => "Shift assignment not found", "field" => "shift_assignment_id", "code" => "SHIFT_ASSIGNMENT_NOT_FOUND" }])
      end
    end

    context 'when user is not the assigned driver' do
      let(:other_driver) { create(:driver) }
      let(:other_shift) { create(:shift_assignment, :active, driver: other_driver, vehicle:) }
      let(:variables) do
        {
          input: {
            shiftAssignmentId: other_shift.id
          }
        }
      end

      before do
        create(:shift_event, :clock_in, shift_assignment: other_shift)
      end

      it 'returns a permission denied error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_mutation_error([{ "message" => "You don't have permission to clock out of this shift", "field" => nil, "code" => "PERMISSION_DENIED" }])
      end
    end

    context 'when user has no driver profile' do
      let(:user_without_driver) { create(:user, :confirmed) }
      let(:context) { { current_user: user_without_driver } }

      it 'returns a no driver profile error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_mutation_error([{ "message" => "You do not have a driver profile", "field" => nil, "code" => "NO_DRIVER_PROFILE" }])
      end
    end

    context 'when already clocked out' do
      before do
        create(:shift_event, :clock_out, shift_assignment:)
      end

      it 'returns an already clocked out error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_mutation_error([{ "message" => "Already clocked out of this shift", "field" => nil, "code" => "ALREADY_CLOCKED_OUT" }])
      end
    end

    context 'when not clocked in' do
      let(:scheduled_shift) { create(:shift_assignment, :scheduled, driver:, vehicle:) }
      let(:variables) do
        {
          input: {
            shiftAssignmentId: scheduled_shift.id
          }
        }
      end

      it 'returns a not clocked in error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_mutation_error([{ "message" => "Must clock in before clocking out", "field" => nil, "code" => "NOT_CLOCKED_IN" }])
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

  describe 'business logic' do
    context 'when clocking out with different odometer readings' do
      let(:variables) do
        {
          input: {
            shiftAssignmentId: shift_assignment.id,
            odometer: 52000, # Higher than clock-in odometer
            vehicleRange: 200 # Lower than clock-in range
          }
        }
      end

      it 'correctly records the clock out data' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .and_return({
            shiftEvent: {
              odometer: 52000,
              vehicleRange: 200
            }
          }.with_indifferent_access)
      end
    end

    context 'when clocking out with GPS coordinates' do
      let(:variables) do
        {
          input: {
            shiftAssignmentId: shift_assignment.id,
            gpsLat: 5.6500, # Different location
            gpsLon: -0.2000,
            notes: "Ending shift at different location"
          }
        }
      end

      it 'records the GPS coordinates and notes' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .and_return({
            shiftEvent: {
              gpsLat: 5.6500,
              gpsLon: -0.2000,
              notes: "Ending shift at different location"
            }
          }.with_indifferent_access)
      end
    end

    context 'when multiple active shifts exist' do
      let(:another_shift) { create(:shift_assignment, :active, driver:, vehicle:) }
      
      before do
        create(:shift_event, :clock_in, shift_assignment: another_shift)
      end

      let(:variables) do
        {
          input: {
            # No shift_assignment_id provided - should find the first active shift
          }
        }
      end

      it 'finds the first active shift' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .and_return({
            shiftEvent: {
              shiftAssignment: {
                id: /ShiftAssignment:[a-zA-Z0-9]+/
              }
            }
          }.with_indifferent_access)
      end
    end
  end
end
