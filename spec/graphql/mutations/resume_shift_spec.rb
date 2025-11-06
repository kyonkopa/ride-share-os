# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::ResumeShift do
  let(:user) { create(:user, :confirmed, :with_driver) }
  let(:driver) { user.driver }
  let(:vehicle) { create(:vehicle) }
  let(:shift_assignment) { create(:shift_assignment, :paused, driver:, vehicle:) }

  let(:mutation) do
    <<~GQL
      mutation ResumeShift {
        resumeShift {
          shiftEvent {
            id
            eventType
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

  let(:context) { { current_user: user } }

  # Create clock-in and pause events before each test
  before do
    create(:shift_event, :clock_in, shift_assignment:)
    create(:shift_event, :pause, shift_assignment:)
  end

  describe 'successful resume' do
    it 'creates a resume event and updates shift assignment status to active' do
      expect(mutation).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .and_return({
          shiftEvent: {
            id: /ShiftEvent:[a-zA-Z0-9]+/,
            eventType: "resume",
            shiftAssignment: {
              id: shift_assignment.global_id,
              status: "active"
            }
          },
          errors: []
        }.with_indifferent_access)
        .with_effects do
          expect(shift_assignment.reload.status).to eq('active')
          expect(shift_assignment.shift_events.count).to eq(3) # clock_in + pause + resume
          expect(shift_assignment.shift_events.last.event_type).to eq('resume')
        end
    end
  end

  describe 'error cases' do
    context 'when no paused shift found' do
      before do
        ShiftAssignment.update_all(status: :active)
      end

      it 'returns a no paused shift error' do
        expect(mutation).to execute_as_graphql
          .with_context(context)
          .with_mutation_error([{ "message" => "No paused shift found", "field" => "shift_assignment_id", "code" => "NO_PAUSED_SHIFT" }])
      end
    end

    context 'when user has no driver profile' do
      let(:user_without_driver) { create(:user, :confirmed) }
      let(:context) { { current_user: user_without_driver } }

      it 'returns a no driver profile error' do
        expect(mutation).to execute_as_graphql
          .with_context(context)
          .with_mutation_error([{ "message" => "You do not have a driver profile", "field" => nil, "code" => "NO_DRIVER_PROFILE" }])
      end
    end

    context 'when shift is not paused' do
      before do
        shift_assignment.update!(status: :active)
      end

      it 'returns a not paused error' do
        expect(mutation).to execute_as_graphql
          .with_context(context)
          .with_mutation_error([{ "message" => "Shift is not paused", "field" => nil, "code" => "NOT_PAUSED" }])
      end
    end

    context 'when user is not the assigned driver' do
      let(:other_driver) { create(:driver) }
      let(:other_shift) { create(:shift_assignment, :paused, driver: other_driver, vehicle:) }

      before do
        create(:shift_event, :clock_in, shift_assignment: other_shift)
        create(:shift_event, :pause, shift_assignment: other_shift)
        ShiftAssignment.where(driver:).update_all(status: :active)
      end

      it 'returns a permission denied error' do
        expect(mutation).to execute_as_graphql
          .with_context(context)
          .with_mutation_error([{ "message" => "You don't have permission to resume this shift", "field" => nil, "code" => "PERMISSION_DENIED" }])
      end
    end
  end

  describe 'authentication' do
    context 'when user is not authenticated' do
      let(:context) { {} }

      it 'returns an authentication error' do
        expect(mutation).to execute_as_graphql
          .with_context(context)
          .with_errors(['Authentication is required'])
      end
    end
  end
end
