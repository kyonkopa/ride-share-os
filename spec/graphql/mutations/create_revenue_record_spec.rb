# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::CreateRevenueRecord do
  let(:user) { create(:user, :confirmed) }
  let(:driver) { create(:driver, user:) }
  let(:vehicle) { create(:vehicle) }
  let(:shift_date) { Date.current }
  let(:shift_assignment) do
    create(:shift_assignment, driver:, vehicle:, start_time: shift_date.beginning_of_day + 8.hours)
  end

  let(:mutation) do
    <<~GQL
      mutation CreateRevenueRecord($input: CreateRevenueRecordInput!) {
        createRevenueRecord(input: $input) {
          revenueRecord {
            id
            globalId
            totalRevenue
            totalProfit
            reconciled
            source
            createdAt
            updatedAt
            driver {
              id
              fullName
            }
            shiftAssignment {
              id
              startTime
              endTime
              vehicle {
                id
                displayName
              }
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
        driverId: driver.global_id,
        date: shift_date.iso8601,
        vehicleId: vehicle.global_id,
        totalRevenue: 150.50,
        source: "bolt",
        reconciled: false
      }
    }
  end

  let(:context) { { current_user: user } }

  describe 'successful creation' do
    it 'creates a revenue record with all fields' do
      expect(mutation).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          revenueRecord: {
            id: /RevenueRecord:[a-zA-Z0-9]+/,
            globalId: /RevenueRecord:[a-zA-Z0-9]+/,
            totalRevenue: 150.50,
            totalProfit: 0.0,
            reconciled: false,
            source: "bolt",
            driver: {
              id: driver.global_id,
              fullName: driver.full_name
            },
            shiftAssignment: {
              id: shift_assignment.global_id,
              startTime: shift_assignment.start_time.iso8601,
              endTime: shift_assignment.end_time.iso8601,
              vehicle: {
                id: vehicle.global_id,
                displayName: "#{vehicle.make} #{vehicle.model} #{vehicle.license_plate}"
              }
            }
          },
          errors: []
        }.with_indifferent_access)
        .with_effects do
          revenue_record = RevenueRecord.last
          aggregate_failures do
            expect(revenue_record).to be_present
            expect(revenue_record.total_revenue).to eq(150.50)
            expect(revenue_record.total_profit).to eq(0.0)
            expect(revenue_record.reconciled).to eq(false)
            expect(revenue_record.source).to eq("bolt")
            expect(revenue_record.driver_id).to eq(driver.id)
            expect(revenue_record.shift_assignment_id).to eq(shift_assignment.id)
            expect(revenue_record.vehicle_id).to eq(vehicle.id)
          end
        end
    end

    it 'creates a revenue record with reconciled flag set to true' do
      reconciled_variables = variables.deep_merge(input: { reconciled: true })

      expect(mutation).to execute_as_graphql
        .with_variables(reconciled_variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          revenueRecord: {
            reconciled: true
          }
        }.with_indifferent_access)
        .with_effects do
          revenue_record = RevenueRecord.last
          expect(revenue_record.reconciled).to eq(true)
        end
    end

    context 'with different sources' do
      %w[bolt uber off_trip].each do |source|
        it "creates a revenue record with source '#{source}'" do
          source_variables = variables.deep_merge(input: { source: })

          expect(mutation).to execute_as_graphql
            .with_variables(source_variables)
            .with_context(context)
            .with_no_errors
            .and_return({
              revenueRecord: {
                source:
              }
            }.with_indifferent_access)
            .with_effects do
              revenue_record = RevenueRecord.last
              expect(revenue_record.source).to eq(source)
            end
        end
      end
    end

    context 'with different dates' do
      it 'creates a revenue record with a past date' do
        past_date = 5.days.ago.to_date
        past_shift_assignment = create(
          :shift_assignment, driver:, vehicle:,
                             start_time: past_date.beginning_of_day + 8.hours
)
        past_date_variables = variables.deep_merge(input: { date: past_date.iso8601 })

        expect(mutation).to execute_as_graphql
          .with_variables(past_date_variables)
          .with_context(context)
          .with_no_errors
          .and_return({
            revenueRecord: {
              shiftAssignment: {
                id: past_shift_assignment.global_id
              }
            }
          }.with_indifferent_access)
          .with_effects do
            revenue_record = RevenueRecord.last
            expect(revenue_record.shift_assignment.start_time.to_date).to eq(past_date)
          end
      end
    end

    it 'sets total_profit to 0.0 by default' do
      expect(mutation).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do
          revenue_record = RevenueRecord.last
          expect(revenue_record.total_profit).to eq(0.0)
        end
    end

    it 'handles decimal revenue amounts correctly' do
      decimal_variables = variables.deep_merge(input: { totalRevenue: 123.456789 })

      expect(mutation).to execute_as_graphql
        .with_variables(decimal_variables)
        .with_context(context)
        .with_no_errors
        .with_effects do
          revenue_record = RevenueRecord.last
          expect(revenue_record.total_revenue).to be_within(0.01).of(123.456789)
        end
    end
  end

  describe 'error cases' do
    context 'when user is not authenticated' do
      let(:context) { {} }

      it 'returns an authentication error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_errors(['Authentication is required'])
      end
    end

    context 'when driver_id is invalid' do
      let(:invalid_variables) do
        variables.deep_merge(input: { driverId: "Driver:InvalidID123" })
      end

      it 'returns a NOT_FOUND error' do
        expect(mutation).to execute_as_graphql
          .with_variables(invalid_variables)
          .with_context(context)
          .and_return({
            revenueRecord: nil,
            errors: array_including(
              hash_including(
                message: "Driver not found",
                field: "driver_id",
                code: "NOT_FOUND"
              )
            )
          }.with_indifferent_access)
      end
    end

    context 'when driver_id points to non-existent driver' do
      let(:invalid_variables) do
        variables.deep_merge(input: { driverId: "Driver:999999" })
      end

      it 'returns a NOT_FOUND error' do
        expect(mutation).to execute_as_graphql
          .with_variables(invalid_variables)
          .with_context(context)
          .and_return({
            revenueRecord: nil,
            errors: array_including(
              hash_including(
                message: "Driver not found",
                field: "driver_id",
                code: "NOT_FOUND"
              )
            )
          }.with_indifferent_access)
      end
    end

    context 'when vehicle_id is invalid' do
      let(:invalid_variables) do
        variables.deep_merge(input: { vehicleId: "Vehicle:InvalidID123" })
      end

      it 'returns a NOT_FOUND error' do
        expect(mutation).to execute_as_graphql
          .with_variables(invalid_variables)
          .with_context(context)
          .and_return({
            revenueRecord: nil,
            errors: array_including(
              hash_including(
                message: "Vehicle not found",
                field: "vehicle_id",
                code: "NOT_FOUND"
              )
            )
          }.with_indifferent_access)
      end
    end

    context 'when vehicle_id points to non-existent vehicle' do
      let(:invalid_variables) do
        variables.deep_merge(input: { vehicleId: "Vehicle:999999" })
      end

      it 'returns a NOT_FOUND error' do
        expect(mutation).to execute_as_graphql
          .with_variables(invalid_variables)
          .with_context(context)
          .and_return({
            revenueRecord: nil,
            errors: array_including(
              hash_including(
                message: "Vehicle not found",
                field: "vehicle_id",
                code: "NOT_FOUND"
              )
            )
          }.with_indifferent_access)
      end
    end

    context 'when no shift assignment exists for the driver on the given date' do
      let(:no_shift_variables) do
        variables.deep_merge(input: { date: 10.days.ago.to_date.iso8601 })
      end

      it 'returns a NOT_FOUND error' do
        expect(mutation).to execute_as_graphql
          .with_variables(no_shift_variables)
          .with_context(context)
          .and_return({
            revenueRecord: nil,
            errors: array_including(
              hash_including(
                message: match(/No shift assignment found for this driver on the given date/),
                field: "date",
                code: "NOT_FOUND"
              )
            )
          }.with_indifferent_access)
      end
    end

    context 'when multiple shift assignments exist for the same date' do
      before do
        create(
          :shift_assignment, driver:, vehicle: create(:vehicle),
                             start_time: shift_date.beginning_of_day + 9.hours
)
      end

      it 'uses the first shift assignment found' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .with_effects do
            revenue_record = RevenueRecord.last
            expect(revenue_record.shift_assignment_id).to eq(shift_assignment.id)
          end
      end
    end
  end

  describe 'validation errors' do
    context 'with missing required fields' do
      context 'when driverId is missing' do
        let(:invalid_variables) do
          {
            input: {
              date: shift_date.iso8601,
              vehicleId: vehicle.global_id,
              totalRevenue: 100.0,
              source: "bolt"
            }
          }
        end

        it 'returns a GraphQL validation error' do
          result = BackendSchema.execute(mutation, variables: invalid_variables, context:)
          expect(result["errors"]).to be_present
          expect(result["errors"].first["message"]).to match(/Expected value to not be null/)
        end
      end

      context 'when date is missing' do
        let(:invalid_variables) do
          {
            input: {
              driverId: driver.global_id,
              vehicleId: vehicle.global_id,
              totalRevenue: 100.0,
              source: "bolt"
            }
          }
        end

        it 'returns a GraphQL validation error' do
          result = BackendSchema.execute(mutation, variables: invalid_variables, context:)
          expect(result["errors"]).to be_present
          expect(result["errors"].first["message"]).to match(/Expected value to not be null/)
        end
      end

      context 'when totalRevenue is missing' do
        let(:invalid_variables) do
          {
            input: {
              driverId: driver.global_id,
              date: shift_date.iso8601,
              vehicleId: vehicle.global_id,
              source: "bolt"
            }
          }
        end

        it 'returns a GraphQL validation error' do
          result = BackendSchema.execute(mutation, variables: invalid_variables, context:)
          expect(result["errors"]).to be_present
          expect(result["errors"].first["message"]).to match(/Expected value to not be null/)
        end
      end

      context 'when source is missing' do
        let(:invalid_variables) do
          {
            input: {
              driverId: driver.global_id,
              date: shift_date.iso8601,
              vehicleId: vehicle.global_id,
              totalRevenue: 100.0
            }
          }
        end

        it 'returns a GraphQL validation error' do
          result = BackendSchema.execute(mutation, variables: invalid_variables, context:)
          expect(result["errors"]).to be_present
          expect(result["errors"].first["message"]).to match(/Expected value to not be null/)
        end
      end
    end

    context 'with invalid source' do
      let(:invalid_variables) do
        variables.deep_merge(input: { source: "invalid_source" })
      end

      it 'returns a GraphQL validation error' do
        result = BackendSchema.execute(mutation, variables: invalid_variables, context:)
        expect(result["errors"]).to be_present
        expect(result["errors"].first["message"]).to match(/Expected type RevenueSourceEnum/)
      end
    end

    context 'with invalid date format' do
      let(:invalid_variables) do
        variables.deep_merge(input: { date: "not-a-date" })
      end

      it 'returns a GraphQL error' do
        result = BackendSchema.execute(mutation, variables: invalid_variables, context:)
        expect(result["errors"]).to be_present
        expect(result["errors"].first["message"]).to match(/Could not coerce value/)
      end
    end
  end

  describe 'edge cases' do
    it 'handles very large revenue amounts' do
      large_amount_variables = variables.deep_merge(input: { totalRevenue: 999999.99 })

      expect(mutation).to execute_as_graphql
        .with_variables(large_amount_variables)
        .with_context(context)
        .with_no_errors
        .with_effects do
          revenue_record = RevenueRecord.last
          expect(revenue_record.total_revenue).to eq(999999.99)
        end
    end

    it 'handles zero revenue amount' do
      zero_amount_variables = variables.deep_merge(input: { totalRevenue: 0.0 })

      expect(mutation).to execute_as_graphql
        .with_variables(zero_amount_variables)
        .with_context(context)
        .with_no_errors
        .with_effects do
          revenue_record = RevenueRecord.last
          expect(revenue_record.total_revenue).to eq(0.0)
        end
    end

    it 'creates multiple revenue records for the same driver and date with different sources' do
      bolt_variables = variables.deep_merge(input: { source: "bolt", totalRevenue: 100.0 })
      uber_variables = variables.deep_merge(input: { source: "uber", totalRevenue: 200.0 })

      expect(mutation).to execute_as_graphql
        .with_variables(bolt_variables)
        .with_context(context)
        .with_no_errors

      expect(mutation).to execute_as_graphql
        .with_variables(uber_variables)
        .with_context(context)
        .with_no_errors
        .with_effects do
          revenue_records = RevenueRecord.where(driver_id: driver.id)
          expect(revenue_records.count).to eq(2)
          expect(revenue_records.pluck(:source)).to contain_exactly("bolt", "uber")
        end
    end
  end
end
