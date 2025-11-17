# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::ClockOut do
  let(:user) { create(:user, :confirmed, :with_driver) }
  let(:driver) { user.driver }
  let(:vehicle) { create(:vehicle) }
  let(:shift_assignment) { create(:shift_assignment, :active, driver:, vehicle:) }

  # Create a clock-in event before each test
  before do
    create(:shift_event, :clock_in, shift_assignment:, odometer: 50000, vehicle_range: 300)
  end

  def mutation
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

  def default_variables
    {
      input: {
        odometer: 51000,
        vehicleRange: 250,
        gpsLat: 5.6037,
        gpsLon: -0.1870,
        notes: "Ending shift"
      }
    }
  end

  def graphql_context
    { current_user: user }
  end

  describe 'successful clock out' do
    let(:variables) { default_variables }

    it 'creates a shift event and updates shift assignment status to completed' do
      expect(mutation).to execute_as_graphql
        .with_variables(variables)
        .with_context(graphql_context)
        .with_no_errors
        .and_return({
          shiftEvent: {
            id: /ShiftEvent:[a-zA-Z0-9]+/,
            eventType: "clock_out",
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
          .with_context(graphql_context)
          .with_no_errors
          .and_return({
            shiftEvent: {
              id: /ShiftEvent:[a-zA-Z0-9]+/,
              eventType: "clock_out",
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
          input: {}
        }
      end

      it 'creates a clock out event with minimal data' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
          .with_no_errors
          .and_return({
            shiftEvent: {
              id: /ShiftEvent:[a-zA-Z0-9]+/,
              eventType: "clock_out",
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
          input: {}
        }
      end

      before do
        # Make sure there are no active shifts
        ShiftAssignment.update_all(status: :completed)
      end

      it 'returns an error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
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
          .with_context(graphql_context)
          .with_mutation_error([{ "message" => "Shift assignment not found", "field" => "shift_assignment_id", "code" => "SHIFT_ASSIGNMENT_NOT_FOUND" }])
      end
    end

    context 'when user is not the assigned driver' do
      let(:other_driver) { create(:driver) }
      let(:other_shift) { create(:shift_assignment, :active, driver: other_driver, vehicle:) }
      let(:variables) do
        {
          input: {}
        }
      end

      before do
        create(:shift_event, :clock_in, shift_assignment: other_shift)
        # Make sure the current user's driver has no active shifts
        ShiftAssignment.where(driver:).update_all(status: :completed)
        # Make sure there are no clock-in events for the current driver's shifts
        ShiftAssignment.where(driver:).each { |sa| sa.shift_events.destroy_all }
      end

      it 'returns a shift assignment not found error (since user has no active shifts)' do
        # Since clockOut auto-finds the first active shift for the current user's driver,
        # and there are none, it will return SHIFT_ASSIGNMENT_NOT_FOUND instead of PERMISSION_DENIED
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
          .with_mutation_error([{ "message" => "Shift assignment not found", "field" => "shift_assignment_id", "code" => "SHIFT_ASSIGNMENT_NOT_FOUND" }])
      end
    end

    context 'when user has no driver profile' do
      let(:user_without_driver) { create(:user, :confirmed) }
      let(:test_context) { { current_user: user_without_driver } }
      let(:variables) do
        {
          input: {}
        }
      end

      it 'returns a no driver profile error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(test_context)
          .with_mutation_error([{ "message" => "You do not have a driver profile", "field" => nil, "code" => "NO_DRIVER_PROFILE" }])
      end
    end

    context 'when already clocked out' do
      before do
        create(:shift_event, :clock_out, shift_assignment:)
      end

      let(:variables) do
        {
          input: {}
        }
      end

      it 'returns an already clocked out error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
          .with_mutation_error([{ "message" => "Already clocked out of this shift", "field" => nil, "code" => "ALREADY_CLOCKED_OUT" }])
      end
    end

    context 'when not clocked in' do
      let(:scheduled_shift) { create(:shift_assignment, :scheduled, driver:, vehicle:) }
      let(:variables) do
        {
          input: {}
        }
      end

      before do
        # Remove clock-in event and make scheduled shift active
        shift_assignment.shift_events.destroy_all
        shift_assignment.update!(status: :active)
      end

      it 'returns a not clocked in error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
          .with_mutation_error([{ "message" => "Must clock in before clocking out", "field" => nil, "code" => "NOT_CLOCKED_IN" }])
      end
    end
  end

  describe 'validation errors' do
    context 'with invalid odometer reading' do
      let(:variables) do
        {
          input: {
            odometer: -100
          }
        }
      end

      it 'returns validation errors' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
          .with_mutation_error([{ "message" => "Odometer must be greater than or equal to 0", "field" => "odometer", "code" => "greater_than_or_equal_to" }])
      end
    end

    context 'with invalid GPS coordinates' do
      let(:variables) do
        {
          input: {
            gpsLat: 95.0, # Invalid latitude
            gpsLon: 185.0 # Invalid longitude
          }
        }
      end

      it 'returns validation errors' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
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
            vehicleRange: -50
          }
        }
      end

      it 'returns validation errors' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
          .with_mutation_error([{ "message" => "Vehicle range must be greater than or equal to 0", "field" => "vehicle_range", "code" => "greater_than_or_equal_to" }])
      end
    end
  end

  describe 'authentication' do
    context 'when user is not authenticated' do
      let(:test_context) { {} }
      let(:variables) do
        {
          input: {}
        }
      end

      it 'returns an authentication error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(test_context)
          .with_errors(['Authentication is required'])
      end
    end
  end

  describe 'business logic' do
    context 'when clocking out with different odometer readings' do
      let(:variables) do
        {
          input: {
            odometer: 52000, # Higher than clock-in odometer
            vehicleRange: 200 # Lower than clock-in range
          }
        }
      end

      it 'correctly records the clock out data' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
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
            gpsLat: 5.6500, # Different location
            gpsLon: -0.2000,
            notes: "Ending shift at different location"
          }
        }
      end

      it 'records the GPS coordinates and notes' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
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
      let(:variables) do
        {
          input: {}
        }
      end

      before do
        create(:shift_event, :clock_in, shift_assignment: another_shift)
      end


      it 'finds the first active shift' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
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

  describe 'revenue records' do
    context 'when clocking out with earnings before midnight' do
      let(:shift_start_time) { Time.zone.parse('2024-01-15 18:00:00') }
      let(:test_shift_assignment) { create(:shift_assignment, :active, driver:, vehicle:, start_time: shift_start_time, end_time: shift_start_time + 8.hours) }
      let(:clock_out_time) { shift_start_time + 5.hours } # 2024-01-15 23:00:00 (before midnight)
      let(:variables) do
        {
          input: {
            boltEarnings: 150.50,
            uberEarnings: 200.75
          }
        }
      end

      before do
        # Complete the default shift_assignment and remove its clock-in to prevent it from being found
        ShiftAssignment.where(driver:).where.not(id: test_shift_assignment.id).update_all(status: :completed)
        ShiftAssignment.where(driver:).where.not(id: test_shift_assignment.id).each { |sa| sa.shift_events.destroy_all }
        create(:shift_event, :clock_in, shift_assignment: test_shift_assignment, created_at: shift_start_time)
        travel_to(clock_out_time)
      end

      after do
        travel_back
      end

      it 'creates revenue records with clock out time as created_at', :aggregate_failures do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
          .with_no_errors
          .with_effects do
            bolt_record = RevenueRecord.find_by(shift_assignment: test_shift_assignment, source: :bolt)
            uber_record = RevenueRecord.find_by(shift_assignment: test_shift_assignment, source: :uber)

            expect(bolt_record).to be_present
            expect(bolt_record.total_revenue).to eq(150.50)
            expect(bolt_record.created_at).to be_within(1.second).of(clock_out_time)

            expect(uber_record).to be_present
            expect(uber_record.total_revenue).to eq(200.75)
            expect(uber_record.created_at).to be_within(1.second).of(clock_out_time)
          end
      end
    end

    context 'when clocking out with earnings after midnight' do
      let(:shift_start_time) { Time.zone.parse('2024-01-15 18:00:00') }
      let(:test_shift_assignment) { create(:shift_assignment, :active, driver:, vehicle:, start_time: shift_start_time, end_time: shift_start_time + 8.hours) }
      let(:clock_out_time) { shift_start_time.to_date.end_of_day + 2.hours } # 2024-01-16 02:00:00 (after midnight)
      let(:expected_revenue_created_at) { shift_start_time.end_of_day - 1.hour }
      let(:variables) do
        {
          input: {
            boltEarnings: 180.25,
            uberEarnings: 220.50
          }
        }
      end

      before do
        # Complete the default shift_assignment and remove its clock-in to prevent it from being found
        ShiftAssignment.where(driver:).where.not(id: test_shift_assignment.id).update_all(status: :completed)
        ShiftAssignment.where(driver:).where.not(id: test_shift_assignment.id).each { |sa| sa.shift_events.destroy_all }
        create(:shift_event, :clock_in, shift_assignment: test_shift_assignment, created_at: shift_start_time)
        travel_to(clock_out_time)
      end

      after do
        travel_back
      end

      it 'creates revenue records with shift start day end_of_day minus 1 hour as created_at', :aggregate_failures do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
          .with_no_errors
          .with_effects do
            bolt_record = RevenueRecord.find_by(shift_assignment: test_shift_assignment, source: :bolt)
            uber_record = RevenueRecord.find_by(shift_assignment: test_shift_assignment, source: :uber)

            expect(bolt_record).to be_present
            expect(bolt_record.total_revenue).to eq(180.25)
            expect(bolt_record.created_at).to be_within(1.second).of(expected_revenue_created_at)

            expect(uber_record).to be_present
            expect(uber_record.total_revenue).to eq(220.50)
            expect(uber_record.created_at).to be_within(1.second).of(expected_revenue_created_at)
          end
      end
    end

    context 'when clocking out with only bolt earnings' do
      let(:shift_start_time) { Time.zone.parse('2024-01-15 18:00:00') }
      let(:test_shift_assignment) { create(:shift_assignment, :active, driver:, vehicle:, start_time: shift_start_time, end_time: shift_start_time + 8.hours) }
      let(:clock_out_time) { shift_start_time.to_date.end_of_day + 1.hour } # After midnight
      let(:expected_revenue_created_at) { shift_start_time.end_of_day - 1.hour }
      let(:variables) do
        {
          input: {
            boltEarnings: 100.00
          }
        }
      end

      before do
        # Complete the default shift_assignment and remove its clock-in to prevent it from being found
        ShiftAssignment.where(driver:).where.not(id: test_shift_assignment.id).update_all(status: :completed)
        ShiftAssignment.where(driver:).where.not(id: test_shift_assignment.id).each { |sa| sa.shift_events.destroy_all }
        create(:shift_event, :clock_in, shift_assignment: test_shift_assignment, created_at: shift_start_time)
        travel_to(clock_out_time)
      end

      after do
        travel_back
      end

      it 'creates only bolt revenue record with correct timestamp', :aggregate_failures do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
          .with_no_errors
          .with_effects do
            bolt_record = RevenueRecord.find_by(shift_assignment: test_shift_assignment, source: :bolt)
            uber_record = RevenueRecord.find_by(shift_assignment: test_shift_assignment, source: :uber)

            expect(bolt_record).to be_present
            expect(bolt_record.total_revenue).to eq(100.00)
            expect(bolt_record.created_at).to be_within(1.second).of(expected_revenue_created_at)

            expect(uber_record).to be_nil
          end
      end
    end

    context 'when clocking out with only uber earnings' do
      let(:shift_start_time) { Time.zone.parse('2024-01-15 18:00:00') }
      let(:test_shift_assignment) { create(:shift_assignment, :active, driver:, vehicle:, start_time: shift_start_time, end_time: shift_start_time + 8.hours) }
      let(:clock_out_time) { shift_start_time + 5.hours } # Before midnight
      let(:variables) do
        {
          input: {
            uberEarnings: 175.00
          }
        }
      end

      before do
        # Complete the default shift_assignment and remove its clock-in to prevent it from being found
        ShiftAssignment.where(driver:).where.not(id: test_shift_assignment.id).update_all(status: :completed)
        ShiftAssignment.where(driver:).where.not(id: test_shift_assignment.id).each { |sa| sa.shift_events.destroy_all }
        create(:shift_event, :clock_in, shift_assignment: test_shift_assignment, created_at: shift_start_time)
        travel_to(clock_out_time)
      end

      after do
        travel_back
      end

      it 'creates only uber revenue record with clock out time as created_at', :aggregate_failures do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
          .with_no_errors
          .with_effects do
            bolt_record = RevenueRecord.find_by(shift_assignment: test_shift_assignment, source: :bolt)
            uber_record = RevenueRecord.find_by(shift_assignment: test_shift_assignment, source: :uber)

            expect(bolt_record).to be_nil

            expect(uber_record).to be_present
            expect(uber_record.total_revenue).to eq(175.00)
            expect(uber_record.created_at).to be_within(1.second).of(clock_out_time)
          end
      end
    end

    context 'when clocking out exactly at end of shift start day' do
      let(:shift_start_time) { Time.zone.parse('2024-01-15 18:00:00') }
      let(:test_shift_assignment) { create(:shift_assignment, :active, driver:, vehicle:, start_time: shift_start_time, end_time: shift_start_time + 8.hours) }
      let(:clock_out_time) { shift_start_time.end_of_day } # Exactly at end of day
      let(:variables) do
        {
          input: {
            boltEarnings: 120.00
          }
        }
      end

      before do
        # Complete the default shift_assignment and remove its clock-in to prevent it from being found
        ShiftAssignment.where(driver:).where.not(id: test_shift_assignment.id).update_all(status: :completed)
        ShiftAssignment.where(driver:).where.not(id: test_shift_assignment.id).each { |sa| sa.shift_events.destroy_all }
        create(:shift_event, :clock_in, shift_assignment: test_shift_assignment, created_at: shift_start_time)
        travel_to(clock_out_time)
      end

      after do
        travel_back
      end

      it 'creates revenue record with clock out time as created_at (not after end_of_day)', :aggregate_failures do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(graphql_context)
          .with_no_errors
          .with_effects do
            bolt_record = RevenueRecord.find_by(shift_assignment: test_shift_assignment, source: :bolt)

            expect(bolt_record).to be_present
            expect(bolt_record.total_revenue).to eq(120.00)
            expect(bolt_record.created_at).to be_within(1.second).of(clock_out_time)
          end
      end
    end
  end
end
