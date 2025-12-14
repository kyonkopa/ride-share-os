# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Queries::RecentShiftEventsQuery do
  let(:user) { create(:user, :confirmed, :with_driver) }
  let(:vehicle) { create(:vehicle) }
  let(:shift_assignment) { create(:shift_assignment, driver: user.driver, vehicle:) }
  let(:pagination) { { page: 1, perPage: 10 } }

  let(:query) do
    <<~GQL
      query RecentShiftEvents($pagination: PaginationInput!) {
        recentShiftEvents(pagination: $pagination) {
          items {
            id
            globalId
            eventType
            odometer
            vehicleRange
            gpsLat
            gpsLon
            notes
            createdAt
            shiftAssignment {
              id
              globalId
              driver {
                id
                fullName
              }
              vehicle {
                id
                displayName
                licensePlate
              }
            }
          }
          pagination {
            currentPage
            pageSize
            totalSize
            pageCount
            firstPage
            lastPage
            nextPage
            prevPage
          }
          errors {
            message
            field
          }
        }
      }
    GQL
  end

  let(:variables) do
    {
      pagination:
    }
  end

  let(:context) { { current_user: user } }

  describe 'when user has shift events' do
    let(:recent_event) { create(:shift_event, :clock_in, shift_assignment:, created_at: 1.hour.ago) }
    let(:older_event) { create(:shift_event, :pause, shift_assignment:, created_at: 2.days.ago) }
    let(:oldest_event) { create(:shift_event, :resume, shift_assignment:, created_at: 5.days.ago) }

    before do
      recent_event
      older_event
      oldest_event
      # Create events for a different driver to verify they're excluded
      other_driver = create(:driver)
      other_shift_assignment = create(:shift_assignment, driver: other_driver, vehicle:)
      create(:shift_event, :clock_in, shift_assignment: other_shift_assignment, created_at: 1.hour.ago)
    end

    it 'returns only shift events for the authenticated driver' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result['items']
          expect(items.length).to eq(3)
          expect(items.map { |e| e['id'] }).to include(
            recent_event.global_id,
            older_event.global_id,
            oldest_event.global_id
          )
        end
    end

    it 'returns events ordered by created_at descending' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result['items']
          dates = items.map { |e| DateTime.parse(e['createdAt']) }
          expect(dates).to eq(dates.sort.reverse)
          expect(items.first['id']).to eq(recent_event.global_id)
          expect(items.last['id']).to eq(oldest_event.global_id)
        end
    end

    it 'returns correct event data' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          event = result['items'].find { |e| e['id'] == recent_event.global_id }
          expect(event).to include(
            'eventType' => 'clock_in',
            'globalId' => recent_event.global_id
          )
          expect(event['shiftAssignment']['driver']['fullName']).to eq(user.driver.full_name)
          expect(event['shiftAssignment']['vehicle']['displayName']).to eq(vehicle.display_name)
        end
    end
  end

  describe 'pagination' do
    before do
      # Create 15 shift events to test pagination
      15.times do |i|
        create(:shift_event, :clock_in, shift_assignment:, created_at: i.hours.ago)
      end
    end

    it 'returns paginated results', :aggregate_failures do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          expect(result['items'].length).to eq(10)
          expect(result['pagination']['totalSize']).to eq(15)
          expect(result['pagination']['pageCount']).to eq(2)
          expect(result['pagination']['pageSize']).to eq(10)
          expect(result['pagination']['currentPage']).to eq(1)
          expect(result['pagination']['firstPage']).to be(true)
          expect(result['pagination']['lastPage']).to be(false)
          expect(result['pagination']['nextPage']).to eq(2)
          expect(result['pagination']['prevPage']).to be_nil
        end
    end

    context 'when requesting second page' do
      let(:pagination) { { page: 2, perPage: 10 } }

      it 'returns second page of results', :aggregate_failures do
        expect(query).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .with_effects do |result, _full_result|
            expect(result['items'].length).to eq(5)
            expect(result['pagination']['currentPage']).to eq(2)
            expect(result['pagination']['totalSize']).to eq(15)
            expect(result['pagination']['firstPage']).to be(false)
            expect(result['pagination']['lastPage']).to be(true)
            expect(result['pagination']['nextPage']).to be_nil
            expect(result['pagination']['prevPage']).to eq(1)
          end
      end
    end

    context 'when requesting with different per_page' do
      let(:pagination) { { page: 1, perPage: 5 } }

      it 'returns correct number of items per page' do
        expect(query).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .with_effects do |result, _full_result|
            expect(result['items'].length).to eq(5)
            expect(result['pagination']['pageSize']).to eq(5)
            expect(result['pagination']['pageCount']).to eq(3)
          end
      end
    end
  end

  describe 'when user has no shift events' do
    it 'returns empty items array' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          expect(result['items']).to be_empty
          expect(result['pagination']['totalSize']).to eq(0)
          expect(result['pagination']['pageCount']).to eq(0)
        end
    end
  end

  describe 'when user has no driver profile' do
    let(:user_without_driver) { create(:user, :confirmed) }
    let(:context) { { current_user: user_without_driver } }

    before do
      create(:shift_event, :clock_in, shift_assignment:, created_at: 1.hour.ago)
    end

    it 'returns empty items array' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          expect(result['items']).to be_empty
          expect(result['pagination']['totalSize']).to eq(0)
        end
    end
  end

  describe 'when user is not authenticated' do
    let(:context) { {} }

    before do
      create(:shift_event, :clock_in, shift_assignment:, created_at: 1.hour.ago)
    end

    it 'returns an authentication error' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_errors(['Authentication is required'])
    end
  end
end
