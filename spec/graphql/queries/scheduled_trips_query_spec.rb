# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Queries::ScheduledTripsQuery do
  let(:user) { create(:user, :confirmed) }
  let(:context) { { current_user: user } }
  let(:pagination) { { page: 1, perPage: 10 } }

  let(:query) do
    <<~GQL
      query ScheduledTrips(
        $filter: ScheduledTripsFilterInput
        $pagination: PaginationInput!
      ) {
        scheduledTrips(filter: $filter, pagination: $pagination) {
          items {
            id
            globalId
            clientName
            clientEmail
            clientPhone
            pickupLocation
            dropoffLocation
            pickupDatetime
            state
            price
            recurrenceConfig
            notes
          }
          pagination {
            currentPage
            pageCount
            totalSize
            pageSize
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

  describe 'basic functionality' do
    let!(:pending_trip) do
      create(
        :scheduled_trip,
        client_name: 'John Doe',
        client_email: 'john@example.com',
        pickup_datetime: 2.days.from_now,
        state: 'pending'
)
    end
    let!(:confirmed_trip) do
      create(
        :scheduled_trip, :confirmed,
        client_name: 'Jane Smith',
        client_email: 'jane@example.com',
        pickup_datetime: 3.days.from_now
)
    end
    let!(:accepted_trip) do
      create(
        :scheduled_trip, :accepted,
        client_name: 'Bob Johnson',
        client_email: 'bob@example.com',
        pickup_datetime: 4.days.from_now
)
    end
    let!(:declined_trip) do
      create(
        :scheduled_trip, :declined,
        client_name: 'Alice Brown',
        client_email: 'alice@example.com',
        pickup_datetime: 5.days.from_now
)
    end
    let!(:auto_declined_trip) do
      create(
        :scheduled_trip, :auto_declined,
        client_name: 'Charlie Wilson',
        client_email: 'charlie@example.com',
        pickup_datetime: 6.days.from_now
)
    end

    it 'returns scheduled trips excluding declined and auto_declined' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result['items']
          expect(items.length).to eq(3)
          trip_ids = items.map { |t| t['id'] }
          expect(trip_ids).to include(pending_trip.global_id, confirmed_trip.global_id, accepted_trip.global_id)
          expect(trip_ids).not_to include(declined_trip.global_id, auto_declined_trip.global_id)
        end
    end

    it 'returns trips ordered by pickup_datetime ascending' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result['items']
          pickup_times = items.map { |t| Time.parse(t['pickupDatetime']) }
          expect(pickup_times).to eq(pickup_times.sort)
        end
    end

    it 'returns correct trip details' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          trip = result['items'].find { |t| t['id'] == pending_trip.global_id }
          expect(trip).to be_present
          expect(trip['clientName']).to eq('John Doe')
          expect(trip['clientEmail']).to eq('john@example.com')
          expect(trip['state']).to eq('pending')
        end
    end

    it 'returns correct pagination metadata' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          pagination_data = result['pagination']
          expect(pagination_data['currentPage']).to eq(1)
          expect(pagination_data['totalSize']).to eq(3)
          expect(pagination_data['pageSize']).to eq(10)
          expect(pagination_data['pageCount']).to eq(1)
        end
    end
  end

  describe 'filtering by state' do
    let!(:pending_trip) do
      create(:scheduled_trip, pickup_datetime: 2.days.from_now, state: 'pending')
    end
    let(:variables) do
      {
        filter: { state: 'pending' },
        pagination:
      }
    end

    before do
      create(:scheduled_trip, :confirmed, pickup_datetime: 3.days.from_now)
      create(:scheduled_trip, :accepted, pickup_datetime: 4.days.from_now)
    end

    it 'returns only trips with the specified state' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result['items']
          expect(items.length).to eq(1)
          expect(items.first['id']).to eq(pending_trip.global_id)
          expect(items.first['state']).to eq('pending')
        end
    end
  end

  describe 'filtering by date range' do # rubocop:disable RSpec/MultipleMemoizedHelpers
    let(:start_date) { Date.current + 2.days }
    let(:end_date) { Date.current + 4.days }

    let!(:trip_before_range) do
      create(:scheduled_trip, pickup_datetime: start_date - 1.day)
    end
    let!(:trip_at_start) do
      create(:scheduled_trip, pickup_datetime: start_date.beginning_of_day)
    end
    let!(:trip_in_range) do
      create(:scheduled_trip, pickup_datetime: start_date + 1.day)
    end
    let!(:trip_at_end) do
      create(:scheduled_trip, pickup_datetime: end_date.end_of_day)
    end
    let!(:trip_after_range) do
      create(:scheduled_trip, pickup_datetime: end_date + 1.day)
    end

    context 'with start_date only' do # rubocop:disable RSpec/MultipleMemoizedHelpers
      let(:variables) do
        {
          filter: { startDate: start_date.iso8601 },
          pagination:
        }
      end

      it 'returns trips from start_date onwards' do # rubocop:disable RSpec/MultipleExpectations
        expect(query).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .with_effects do |result, _full_result|
            items = result['items']
            trip_ids = items.map { |t| t['id'] }
            expect(trip_ids).not_to include(trip_before_range.global_id)
            expect(trip_ids).to include(trip_at_start.global_id)
            expect(trip_ids).to include(trip_in_range.global_id)
            expect(trip_ids).to include(trip_at_end.global_id)
            expect(trip_ids).to include(trip_after_range.global_id)
          end
      end
    end

    context 'with end_date only' do # rubocop:disable RSpec/MultipleMemoizedHelpers
      let(:variables) do
        {
          filter: { endDate: end_date.iso8601 },
          pagination:
        }
      end

      it 'returns trips up to end_date' do # rubocop:disable RSpec/MultipleExpectations
        expect(query).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .with_effects do |result, _full_result|
            items = result['items']
            trip_ids = items.map { |t| t['id'] }
            expect(trip_ids).to include(trip_before_range.global_id)
            expect(trip_ids).to include(trip_at_start.global_id)
            expect(trip_ids).to include(trip_in_range.global_id)
            expect(trip_ids).to include(trip_at_end.global_id)
            expect(trip_ids).not_to include(trip_after_range.global_id)
          end
      end
    end

    context 'with both start_date and end_date' do # rubocop:disable RSpec/MultipleMemoizedHelpers
      let(:variables) do
        {
          filter: {
            startDate: start_date.iso8601,
            endDate: end_date.iso8601
          },
          pagination:
        }
      end

      it 'returns trips within the date range' do # rubocop:disable RSpec/MultipleExpectations
        expect(query).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .with_effects do |result, _full_result|
            items = result['items']
            trip_ids = items.map { |t| t['id'] }
            expect(trip_ids).not_to include(trip_before_range.global_id)
            expect(trip_ids).to include(trip_at_start.global_id)
            expect(trip_ids).to include(trip_in_range.global_id)
            expect(trip_ids).to include(trip_at_end.global_id)
            expect(trip_ids).not_to include(trip_after_range.global_id)
          end
      end
    end
  end

  describe 'filtering by client_email' do
    let!(:john_trip_earlier) do
      create(
        :scheduled_trip,
        client_email: 'john@example.com',
        pickup_datetime: 2.days.from_now
)
    end
    let!(:jane_trip) do
      create(
        :scheduled_trip,
        client_email: 'jane@example.com',
        pickup_datetime: 3.days.from_now
)
    end
    let!(:john_trip_later) do
      create(
        :scheduled_trip,
        client_email: 'john@example.com',
        pickup_datetime: 4.days.from_now
)
    end
    let(:variables) do
      {
        filter: { clientEmail: 'john@example.com' },
        pagination:
      }
    end

    it 'returns only trips for the specified client email' do # rubocop:disable RSpec/MultipleExpectations
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result['items']
          expect(items.length).to eq(2)
          trip_ids = items.map { |t| t['id'] }
          expect(trip_ids).to include(john_trip_earlier.global_id)
          expect(trip_ids).to include(john_trip_later.global_id)
          expect(trip_ids).not_to include(jane_trip.global_id)
          items.each do |trip|
            expect(trip['clientEmail']).to eq('john@example.com')
          end
        end
    end
  end

  describe 'filtering by recurring' do
    let!(:recurring_trip) do
      create(:scheduled_trip, :recurring, pickup_datetime: 2.days.from_now)
    end
    let!(:non_recurring_trip) do
      create(:scheduled_trip, recurrence_config: {}, pickup_datetime: 3.days.from_now)
    end
    let!(:another_non_recurring_trip) do
      create(:scheduled_trip, recurrence_config: nil, pickup_datetime: 4.days.from_now)
    end

    context 'when filtering for recurring trips' do
      let(:variables) do
        {
          filter: { recurring: true },
          pagination:
        }
      end

      it 'returns only recurring trips' do
        expect(query).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .with_effects do |result, _full_result|
            items = result['items']
            expect(items.length).to eq(1)
            expect(items.first['id']).to eq(recurring_trip.global_id)
          end
      end
    end

    context 'when filtering for non-recurring trips' do
      let(:variables) do
        {
          filter: { recurring: false },
          pagination:
        }
      end

      it 'returns only non-recurring trips' do
        expect(query).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .with_effects do |result, _full_result|
            items = result['items']
            expect(items.length).to eq(2)
            trip_ids = items.map { |t| t['id'] }
            expect(trip_ids).to include(non_recurring_trip.global_id)
            expect(trip_ids).to include(another_non_recurring_trip.global_id)
            expect(trip_ids).not_to include(recurring_trip.global_id)
          end
      end
    end
  end

  describe 'combining multiple filters' do # rubocop:disable RSpec/MultipleMemoizedHelpers
    let(:start_date) { Date.current + 2.days }
    let(:end_date) { Date.current + 4.days }

    let!(:matching_trip) do
      create(
        :scheduled_trip,
        state: 'pending',
        client_email: 'john@example.com',
        pickup_datetime: start_date + 1.day
)
    end
    let(:variables) do
      {
        filter: {
          state: 'pending',
          clientEmail: 'john@example.com',
          startDate: start_date.iso8601,
          endDate: end_date.iso8601
        },
        pagination:
      }
    end

    before do
      create(
        :scheduled_trip, :confirmed,
        client_email: 'john@example.com',
        pickup_datetime: start_date + 1.day
      )
      create(
        :scheduled_trip,
        state: 'pending',
        client_email: 'jane@example.com',
        pickup_datetime: start_date + 1.day
      )
      create(
        :scheduled_trip,
        state: 'pending',
        client_email: 'john@example.com',
        pickup_datetime: start_date - 1.day
      )
    end

    it 'applies all filters correctly' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result['items']
          expect(items.length).to eq(1)
          expect(items.first['id']).to eq(matching_trip.global_id)
        end
    end
  end

  describe 'pagination' do
    let(:pagination) { { page: 1, perPage: 3 } }

    before do
      5.times do |i|
        create(
          :scheduled_trip,
          client_email: "test#{i}@example.com",
          pickup_datetime: (i + 1).days.from_now
)
      end
    end

    it 'returns paginated results' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          expect(result['items'].length).to eq(3)
          expect(result['pagination']['totalSize']).to eq(5)
          expect(result['pagination']['pageCount']).to eq(2)
          expect(result['pagination']['pageSize']).to eq(3)
        end
    end

    context 'when requesting second page' do
      let(:pagination) { { page: 2, perPage: 3 } }

      it 'returns second page of results' do
        expect(query).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .with_effects do |result, _full_result|
            expect(result['items'].length).to eq(2)
            expect(result['pagination']['currentPage']).to eq(2)
            expect(result['pagination']['totalSize']).to eq(5)
          end
      end
    end
  end

  describe 'when no trips exist' do
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

  describe 'when user is not authenticated' do
    let(:context) { {} }

    before do
      create(:scheduled_trip, pickup_datetime: 2.days.from_now)
    end

    it 'returns an authentication error' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_errors(['Authentication is required'])
    end
  end

  describe 'ordering' do
    let!(:trip_latest) do
      create(:scheduled_trip, pickup_datetime: 3.days.from_now)
    end
    let!(:trip_earliest) do
      create(:scheduled_trip, pickup_datetime: 1.day.from_now)
    end
    let!(:trip_middle) do
      create(:scheduled_trip, pickup_datetime: 2.days.from_now)
    end

    it 'orders trips by pickup_datetime ascending' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result['items']
          expect(items.length).to eq(3)
          expect(items[0]['id']).to eq(trip_earliest.global_id)
          expect(items[1]['id']).to eq(trip_middle.global_id)
          expect(items[2]['id']).to eq(trip_latest.global_id)
        end
    end
  end
end
