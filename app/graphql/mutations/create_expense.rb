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

      # Check for duplicate expense (unless category is "other" or override_warnings is true)
      if expense_params[:category] != "other" && expense_params[:vehicle_id].present? && !input[:override_warnings]
        if Expense.exists?(category: expense_params[:category], date: expense_params[:date], vehicle_id: expense_params[:vehicle_id])
          error!(
            "An expense with this category and date already exists for this vehicle, choose Confirm to add this expense anyway",
            field: "base",
            code: "DUPLICATE_EXPENSE_WARNING"
)
        end
      end

      expense = Expense.create!(expense_params)

      { expense: }
    end
  end
end
