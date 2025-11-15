# frozen_string_literal: true

module Mutations
  class CreateExpense < Mutations::BaseMutation
    description "Create a new expense record"

    argument :input, Types::Inputs::CreateExpenseInput, required: true, description: "Input for creating an expense"

    field :expense, Types::ExpenseType, null: true

    def execute(input:)
      expense_params = {
        amount: input[:amount],
        category: input[:category],
        date: input[:date],
        receipt_key: input[:receipt_key],
        description: input[:description]
      }

      # Set user_id to current user (the user who added the expense)
      expense_params[:user_id] = current_user.id

      # Set vehicle_id if provided
      expense_params[:vehicle_id] = if input[:vehicle_id]
        Vehicle.find_by_global_id(input[:vehicle_id])&.id
      end

      expense = Expense.create!(expense_params)

      { expense: }
    end
  end
end
