# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::CreatePayrollRecord do
  let(:user) { create(:user, :confirmed, can: "payroll_write_access") }
  let(:driver) { create(:driver) }
  let(:period_start_date) { Date.current.beginning_of_month }
  let(:period_end_date) { Date.current.end_of_month }
  let(:mutation) do
    <<~GQL
      mutation CreatePayrollRecord($input: CreatePayrollRecordInput!) {
        createPayrollRecord(input: $input) {
          payrollRecord {
            id
            globalId
            amountPaid
            paidAt
            periodStartDate
            periodEndDate
            notes
            driver {
              id
              fullName
            }
            paidByUser {
              id
              email
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
        amountPaid: 150.50,
        periodStartDate: period_start_date.iso8601,
        periodEndDate: period_end_date.iso8601,
        notes: "Payment for January 2024"
      }
    }
  end
  let(:context) { { current_user: user } }

  describe 'successful creation' do
    before do
      # Set up revenue records so amount_due > 0
      shift = create(:shift_assignment, driver:, start_time: period_start_date.beginning_of_day + 8.hours)
      create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 1000.0)
    end

    it 'creates a payroll record with all fields' do
      expect(mutation).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          payrollRecord: {
            id: /PayrollRecord:[a-zA-Z0-9]+/,
            amountPaid: 150.50,
            periodStartDate: period_start_date.iso8601,
            periodEndDate: period_end_date.iso8601,
            notes: "Payment for January 2024",
            driver: {
              id: driver.global_id,
              fullName: driver.full_name
            },
            paidByUser: {
              id: user.global_id,
              email: user.email
            }
          }
        }.with_indifferent_access)
        .with_effects do
          payroll_record = PayrollRecord.last
          aggregate_failures do
            expect(payroll_record).to be_present
            expect(payroll_record.amount_paid).to eq(150.50)
            expect(payroll_record.period_start_date).to eq(period_start_date)
            expect(payroll_record.period_end_date).to eq(period_end_date)
            expect(payroll_record.notes).to eq("Payment for January 2024")
            expect(payroll_record.driver_id).to eq(driver.id)
            expect(payroll_record.paid_by_user_id).to eq(user.id)
            expect(payroll_record.paid_at).to be_present
          end
        end
    end

    it 'sets paid_at to current time when not provided' do
      freeze_time do
        variables_without_paid_at = variables.except(:input).merge(
          input: variables[:input].except(:paidAt)
        )

        expect(mutation).to execute_as_graphql
          .with_variables(variables_without_paid_at)
          .with_context(context)
          .with_no_errors
          .with_effects do
            payroll_record = PayrollRecord.last
            expect(payroll_record.paid_at).to be_within(1.second).of(Time.current)
          end
      end
    end

    it 'handles decimal amounts correctly' do
      decimal_variables = variables.deep_merge(input: { amountPaid: 123.456789 })

      expect(mutation).to execute_as_graphql
        .with_variables(decimal_variables)
        .with_context(context)
        .with_no_errors
        .with_effects do
          payroll_record = PayrollRecord.last
          expect(payroll_record.amount_paid).to be_within(0.01).of(123.456789)
        end
    end
  end

  describe 'validation errors' do
    it 'returns an error when required field is missing' do
      invalid_variables = {
        input: {
          driverId: driver.global_id,
          periodStartDate: period_start_date.iso8601,
          periodEndDate: period_end_date.iso8601
        }
      }

      expect(mutation).to execute_as_graphql
        .with_variables(invalid_variables)
        .with_context(context)
        .with_errors(["Expected value to not be null"])
    end

    it 'returns an error when amount is invalid' do
      # Set up revenue records so amount_due > 0
      shift = create(:shift_assignment, driver:, start_time: period_start_date.beginning_of_day + 8.hours)
      create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 1000.0)

      invalid_variables = variables.deep_merge(input: { amountPaid: 0 })

      expect(mutation).to execute_as_graphql
        .with_variables(invalid_variables)
        .with_context(context)
        .with_no_errors
        .with_mutation_error([/must be greater than 0/])
    end

    it 'returns an error when date format is invalid' do
      # Date format validation happens before amount_due check, so no revenue records needed
      invalid_variables = variables.deep_merge(input: { periodStartDate: "not-a-date" })

      expect(mutation).to execute_as_graphql
        .with_variables(invalid_variables)
        .with_context(context)
        .with_errors(["Could not coerce value"])
    end
  end

  describe 'duplicate record prevention' do
    before do
      # Set up revenue records so amount_due > 0
      shift = create(:shift_assignment, driver:, start_time: period_start_date.beginning_of_day + 8.hours)
      create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 1000.0)
    end

    it 'prevents creating duplicate payroll records for the same driver and period' do
      # Create first payroll record
      expect(mutation).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors

      # Try to create duplicate
      expect(mutation).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_mutation_error([
          {
            "message" => "A payroll record already exists for this driver and period",
            "field" => "driverId",
            "code" => "DUPLICATE_RECORD"
          }
        ])
        .with_effects do
          # Should still only have one record
          expect(PayrollRecord.count).to eq(1)
        end
    end
  end

  describe 'authorization' do
    context 'when user is not authenticated' do
      let(:context) { {} }

      it 'returns an authentication error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_errors(['Authentication is required'])
      end
    end

    context 'when user does not have payroll_write_access permission' do
      let(:unauthorized_user) { create(:user, :confirmed) }
      let(:context) { { current_user: unauthorized_user } }

      it 'returns an authorization error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_errors(["You are not authorized to create a payroll record"])
      end
    end
  end

  describe 'error cases' do
    it 'returns an error when driver does not exist' do
      invalid_variables = variables.deep_merge(input: { driverId: "Driver:999999" })

      expect(mutation).to execute_as_graphql
        .with_variables(invalid_variables)
        .with_context(context)
        .with_errors(["An error occurred while fetching the record"])
    end
  end

  describe 'edge cases' do
    it 'prevents payment exceeding the amount due to the driver' do
      # Set up revenue records for the driver to establish an amount_due
      shift = create(:shift_assignment, driver:, start_time: period_start_date.beginning_of_day + 8.hours)
      create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 1000.0)

      # Calculate the actual amount_due
      payroll_data = PayrollService.calculate_driver_payroll(
        driver:,
        start_date: period_start_date,
        end_date: period_end_date
      )
      amount_due = payroll_data[:amount_due]

      # Try to pay more than amount_due
      overpayment_variables = variables.deep_merge(input: { amountPaid: amount_due + 100.0 })

      expect(mutation).to execute_as_graphql
        .with_variables(overpayment_variables)
        .with_context(context)
        .with_no_errors
        .with_mutation_error([
          {
            "message" => match(/cannot exceed the amount due/),
            "field" => "amountPaid",
            "code" => "VALIDATION_ERROR"
          }
        ])
        .with_effects do
          # Should not create a payroll record
          expect(PayrollRecord.count).to eq(0)
        end
    end

    it 'allows payment equal to the amount due to the driver' do
      # Set up revenue records for the driver
      shift = create(:shift_assignment, driver:, start_time: period_start_date.beginning_of_day + 8.hours)
      create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 1000.0)

      # Calculate the actual amount_due
      payroll_data = PayrollService.calculate_driver_payroll(
        driver:,
        start_date: period_start_date,
        end_date: period_end_date
      )
      amount_due = payroll_data[:amount_due]

      # Pay exactly the amount_due
      exact_payment_variables = variables.deep_merge(input: { amountPaid: amount_due })

      expect(mutation).to execute_as_graphql
        .with_variables(exact_payment_variables)
        .with_context(context)
        .with_no_errors
        .with_effects do
          payroll_record = PayrollRecord.last
          expect(payroll_record.amount_paid).to eq(amount_due)
        end
    end

    it 'handles very small amounts' do
      # Set up revenue records so amount_due > 0
      shift = create(:shift_assignment, driver:, start_time: period_start_date.beginning_of_day + 8.hours)
      create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 1000.0)

      small_amount_variables = variables.deep_merge(input: { amountPaid: 0.01 })

      expect(mutation).to execute_as_graphql
        .with_variables(small_amount_variables)
        .with_context(context)
        .with_no_errors
        .with_effects do
          payroll_record = PayrollRecord.last
          expect(payroll_record.amount_paid).to eq(0.01)
        end
    end

    it 'handles long notes text' do
      # Set up revenue records so amount_due > 0
      shift = create(:shift_assignment, driver:, start_time: period_start_date.beginning_of_day + 8.hours)
      create(:revenue_record, driver:, shift_assignment: shift, total_revenue: 1000.0)

      long_notes = "A" * 1000
      long_notes_variables = variables.deep_merge(input: { notes: long_notes })

      expect(mutation).to execute_as_graphql
        .with_variables(long_notes_variables)
        .with_context(context)
        .with_no_errors
        .with_effects do
          payroll_record = PayrollRecord.last
          expect(payroll_record.notes).to eq(long_notes)
        end
    end
  end
end
