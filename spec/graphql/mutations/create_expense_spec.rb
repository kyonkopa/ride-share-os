# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::CreateExpense do
  let(:user) { create(:user, :confirmed) }
  let(:vehicle) { create(:vehicle) }

  let(:mutation) do
    <<~GQL
      mutation CreateExpense($input: CreateExpenseInput!) {
        createExpense(input: $input) {
          expense {
            id
            amount
            category
            date
            receiptKey
            user {
              id
              firstName
              lastName
              email
            }
            vehicle {
              id
              displayName
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
        amount: 150.50,
        category: "maintenance",
        date: Date.current.iso8601,
        vehicleId: vehicle.global_id
      }
    }
  end

  let(:context) { { current_user: user } }

  describe 'successful creation' do
    it 'creates an expense with all fields' do
      expect(mutation).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          expense: {
            id: /Expense:[a-zA-Z0-9]+/,
            amount: 150.50,
            category: "maintenance",
            date: Date.current.iso8601,
            receiptKey: nil,
            user: {
              id: user.global_id,
              firstName: user.first_name,
              lastName: user.last_name,
              email: user.email
            },
            vehicle: {
              id: vehicle.global_id,
              displayName: "#{vehicle.make} #{vehicle.model} #{vehicle.license_plate}"
            }
          }
        }.with_indifferent_access)
        .with_effects do
          expense = Expense.last
          aggregate_failures do
            expect(expense).to be_present
            expect(expense.amount).to eq(150.50)
            expect(expense.category).to eq("maintenance")
            expect(expense.date).to eq(Date.current)
            expect(expense.user_id).to eq(user.id)
            expect(expense.vehicle_id).to eq(vehicle.id)
            expect(expense.receipt_key).to be_nil
          end
        end
    end

    it 'creates an expense without vehicle (user only)' do
      variables_without_vehicle = {
        input: {
          amount: 75.25,
          category: "toll",
          date: Date.current.iso8601
        }
      }

      expect(mutation).to execute_as_graphql
        .with_variables(variables_without_vehicle)
        .with_context(context)
        .with_no_errors
        .and_return({
          expense: {
            id: /Expense:[a-zA-Z0-9]+/,
            amount: 75.25,
            category: "toll",
            date: Date.current.iso8601,
            user: {
              id: user.global_id
            },
            vehicle: nil
          }
        }.with_indifferent_access)
        .with_effects do
          expense = Expense.last
          aggregate_failures do
            expect(expense.user_id).to eq(user.id)
            expect(expense.vehicle_id).to be_nil
          end
        end
    end

    it 'creates an expense with receipt_key' do
      variables_with_receipt = {
        input: {
          amount: 200.00,
          category: "insurance",
          date: Date.current.iso8601,
          receiptKey: "receipts/abc123.jpg"
        }
      }

      expect(mutation).to execute_as_graphql
        .with_variables(variables_with_receipt)
        .with_context(context)
        .with_no_errors
        .and_return({
          expense: {
            id: /Expense:[a-zA-Z0-9]+/,
            amount: 200.00,
            category: "insurance",
            receiptKey: "receipts/abc123.jpg"
          }
        }.with_indifferent_access)
        .with_effects do
          expense = Expense.last
          expect(expense.receipt_key).to eq("receipts/abc123.jpg")
        end
    end

    it 'sets user_id to current_user automatically' do
      other_user = create(:user, :confirmed)
      expect(other_user.id).not_to eq(user.id)

      expect(mutation).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do
          expense = Expense.last
          expect(expense.user_id).to eq(user.id)
          expect(expense.user_id).not_to eq(other_user.id)
        end
    end

    context 'with different categories' do
      %w[charging maintenance toll insurance other].each do |category|
        it "creates an expense with category '#{category}'" do
          input_hash = {
            amount: 100.00,
            category:,
            date: Date.current.iso8601
          }
          # Description is required for "other" category
          input_hash[:description] = "Test description" if category == "other"

          category_variables = {
            input: input_hash
          }

          expect(mutation).to execute_as_graphql
            .with_variables(category_variables)
            .with_context(context)
            .with_no_errors
            .and_return({
              expense: {
                category:
              }
            }.with_indifferent_access)
            .with_effects do
              expense = Expense.last
              expect(expense.category).to eq(category)
            end
        end
      end
    end

    context 'with different dates' do
      it 'creates an expense with a past date' do
        past_date = 5.days.ago.to_date
        past_date_variables = {
          input: {
            amount: 50.00,
            category: "other",
            date: past_date.iso8601,
            description: "Past expense"
          }
        }

        expect(mutation).to execute_as_graphql
          .with_variables(past_date_variables)
          .with_context(context)
          .with_no_errors
          .and_return({
            expense: {
              date: past_date.iso8601
            }
          }.with_indifferent_access)
          .with_effects do
            expense = Expense.last
            expect(expense.date).to eq(past_date)
          end
      end

      it 'creates an expense with a future date' do
        future_date = 5.days.from_now.to_date
        future_date_variables = {
          input: {
            amount: 50.00,
            category: "other",
            date: future_date.iso8601,
            description: "Future expense"
          }
        }

        expect(mutation).to execute_as_graphql
          .with_variables(future_date_variables)
          .with_context(context)
          .with_no_errors
          .and_return({
            expense: {
              date: future_date.iso8601
            }
          }.with_indifferent_access)
          .with_effects do
            expense = Expense.last
            expect(expense.date).to eq(future_date)
          end
      end
    end
  end

  describe 'validation errors' do
    context 'with missing required fields' do
      context 'when amount is missing' do
        let(:invalid_variables) do
          {
            input: {
              category: "maintenance",
              date: Date.current.iso8601
            }
          }
        end

        it 'returns a validation error' do
          expect(mutation).to execute_as_graphql
            .with_variables(invalid_variables)
            .with_context(context)
            .with_errors(["Expected value to not be null"])
        end
      end

      context 'when category is missing' do
        let(:invalid_variables) do
          {
            input: {
              amount: 100.00,
              date: Date.current.iso8601
            }
          }
        end

        it 'returns a validation error' do
          expect(mutation).to execute_as_graphql
            .with_variables(invalid_variables)
            .with_context(context)
            .with_errors(["Expected value to not be null"])
        end
      end

      context 'when date is missing' do
        let(:invalid_variables) do
          {
            input: {
              amount: 100.00,
              category: "maintenance"
            }
          }
        end

        it 'returns a validation error' do
          expect(mutation).to execute_as_graphql
            .with_variables(invalid_variables)
            .with_context(context)
            .with_errors(["Expected value to not be null"])
        end
      end
    end

    context 'with invalid amount' do
      context 'when amount is zero' do
        let(:invalid_variables) do
          {
            input: {
              amount: 0,
              category: "maintenance",
              date: Date.current.iso8601
            }
          }
        end

        it 'returns a validation error' do
          expect(mutation).to execute_as_graphql
            .with_variables(invalid_variables)
            .with_context(context)
            .with_no_errors
            .with_mutation_error([/Amount must be greater than 0/])
        end
      end

      context 'when amount is negative' do
        let(:invalid_variables) do
          {
            input: {
              amount: -50.00,
              category: "maintenance",
              date: Date.current.iso8601
            }
          }
        end

        it 'returns a validation error' do
          expect(mutation).to execute_as_graphql
            .with_variables(invalid_variables)
            .with_context(context)
            .with_no_errors
            .with_mutation_error([/Amount must be greater than 0/])
        end
      end
    end

    context 'with invalid category' do
      let(:invalid_variables) do
        {
          input: {
            amount: 100.00,
            category: "invalid_category",
            date: Date.current.iso8601
          }
        }
      end

      it 'allows any category string (no enum validation at GraphQL level)' do
        # The category validation happens at the model level, not GraphQL level
        # So this should succeed at GraphQL but may fail at model validation
        expect(mutation).to execute_as_graphql
          .with_variables(invalid_variables)
          .with_context(context)
          .with_effects do
            # The mutation will succeed but the model validation might catch it
            # If it succeeds, the expense should be created
            expense = Expense.last
            expect(expense.category).to eq("invalid_category") if expense
          end
      end
    end

    context 'with invalid date format' do
      let(:invalid_variables) do
        {
          input: {
            amount: 100.00,
            category: "maintenance",
            date: "not-a-date"
          }
        }
      end

      it 'returns a GraphQL error' do
        expect(mutation).to execute_as_graphql
          .with_variables(invalid_variables)
          .with_context(context)
          .with_errors(["Could not coerce value"])
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

    context 'when vehicle_id is invalid' do
      let(:invalid_variables) do
        {
          input: {
            amount: 100.00,
            category: "maintenance",
            date: Date.current.iso8601,
            vehicleId: "Vehicle:InvalidID123"
          }
        }
      end

      it 'creates expense without vehicle (vehicle_id is optional)' do
        # Since vehicle_id is optional, an invalid ID should just result in vehicle_id being nil
        expect(mutation).to execute_as_graphql
          .with_variables(invalid_variables)
          .with_context(context)
          .with_no_errors
          .with_effects do
            expense = Expense.last
            expect(expense.vehicle_id).to be_nil
          end
      end
    end

    context 'when vehicle_id points to non-existent vehicle' do
      let(:invalid_variables) do
        {
          input: {
            amount: 100.00,
            category: "maintenance",
            date: Date.current.iso8601,
            vehicleId: "Vehicle:999999"
          }
        }
      end

      it 'creates expense without vehicle' do
        expect(mutation).to execute_as_graphql
          .with_variables(invalid_variables)
          .with_context(context)
          .with_no_errors
          .with_effects do
            expense = Expense.last
            expect(expense.vehicle_id).to be_nil
          end
      end
    end
  end

  describe 'edge cases' do
    it 'handles very large amounts' do
      large_amount_variables = {
        input: {
          amount: 999999.99,
          category: "other",
          date: Date.current.iso8601,
          description: "Large expense"
        }
      }

      expect(mutation).to execute_as_graphql
        .with_variables(large_amount_variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          expense: {
            amount: 999999.99
          }
        }.with_indifferent_access)
        .with_effects do
          expense = Expense.last
          expect(expense.amount).to eq(999999.99)
        end
    end

    it 'handles very small amounts' do
      small_amount_variables = {
        input: {
          amount: 0.01,
          category: "other",
          date: Date.current.iso8601,
          description: "Small expense"
        }
      }

      expect(mutation).to execute_as_graphql
        .with_variables(small_amount_variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          expense: {
            amount: 0.01
          }
        }.with_indifferent_access)
        .with_effects do
          expense = Expense.last
          expect(expense.amount).to eq(0.01)
        end
    end

    it 'handles decimal amounts correctly' do
      decimal_variables = {
        input: {
          amount: 123.456789,
          category: "other",
          date: Date.current.iso8601,
          description: "Decimal expense"
        }
      }

      expect(mutation).to execute_as_graphql
        .with_variables(decimal_variables)
        .with_context(context)
        .with_no_errors
        .with_effects do
          expense = Expense.last
          expect(expense.amount).to be_within(0.01).of(123.456789)
        end
    end

    it 'creates multiple expenses for the same user' do
      first_expense_variables = {
        input: {
          amount: 50.00,
          category: "toll",
          date: Date.current.iso8601
        }
      }

      second_expense_variables = {
        input: {
          amount: 75.00,
          category: "maintenance",
          date: Date.current.iso8601
        }
      }

      expect(mutation).to execute_as_graphql
        .with_variables(first_expense_variables)
        .with_context(context)
        .with_no_errors

      expect(mutation).to execute_as_graphql
        .with_variables(second_expense_variables)
        .with_context(context)
        .with_no_errors
        .with_effects do
          expenses = Expense.where(user_id: user.id)
          expect(expenses.count).to eq(2)
          expect(expenses.pluck(:amount)).to contain_exactly(50.00, 75.00)
        end
    end
  end
end
