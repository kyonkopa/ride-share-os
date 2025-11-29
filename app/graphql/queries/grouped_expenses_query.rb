# frozen_string_literal: true

module Queries
  class GroupedExpensesQuery < Resolvers::BaseResolver
    description "Get expenses grouped by vehicle and date within a date range"

    argument :category, String, required: false, description: "Optional expense category to filter expenses"
    argument :driver_id, String, required: false, description: "Optional driver global ID to filter expenses"
    argument :end_date, GraphQL::Types::ISO8601Date, required: false, description: "End date for the date range"
    argument :pagination, Types::Inputs::PaginationInput, required: true, description: "Pagination options"
    argument :start_date, GraphQL::Types::ISO8601Date, required: false, description: "Start date for the date range"
    argument :vehicle_id, String, required: false, description: "Optional vehicle global ID to filter expenses"

    type Types::GroupedExpensesResultType, null: false

    def resolve(start_date: nil, end_date: nil, pagination:, driver_id: nil, vehicle_id: nil, category: nil)
      start_date ||= Date.new(1970, 1, 1) # Epoch start
      end_date ||= Date.current

      expenses = Expense.includes(:vehicle, :user).where(date: start_date..end_date)

      if driver_id.present?
        driver = Driver.find_by_global_id(driver_id)
        if driver&.user_id
          expenses = expenses.where(user_id: driver.user_id)
        else
          # If driver not found or has no user, return empty result
          expenses = expenses.none
        end
      end

      if vehicle_id.present?
        vehicle = Vehicle.find_by_global_id(vehicle_id)
        if vehicle
          expenses = expenses.where(vehicle_id: vehicle.id)
        else
          # If vehicle not found, return empty result
          expenses = expenses.none
        end
      end

      if category.present?
        expenses = expenses.where(category:)
      end

      # Calculate total amount for filtered expenses
      grouped_expenses_total_amount = expenses.sum(:amount) / 100.0

      # Group by category - amounts are in cents, convert to dollars
      category_totals_cents = expenses.group(:category).sum(:amount)
      category_totals = category_totals_cents.transform_keys(&:to_s).transform_values { |cents| cents / 100.0 }

      # Group expenses by vehicle_id and date
      grouped_expenses = expenses.group_by do |expense|
        vehicle_id = expense.vehicle_id || "no-vehicle"
        [vehicle_id, expense.date]
      end

      # Build group objects
      groups = grouped_expenses.map do |(vehicle_id, date), expense_list|
        vehicle = expense_list.first.vehicle
        vehicle_name = vehicle&.display_name || "No Vehicle"

        # Calculate total amount in cents, then convert to dollars
        total_amount_cents = expense_list.sum(&:amount)
        total_amount = total_amount_cents / 100.0

        {
          vehicle_id: vehicle_id.is_a?(String) ? vehicle_id : vehicle_id.to_s,
          vehicle_name:,
          date:,
          total_amount:,
          expense_count: expense_list.size,
          expenses: expense_list.sort_by { |e| [-e.date.to_time.to_i, e.created_at.to_i] }
        }
      end

      # Sort groups by date descending, then by vehicle name, then by total amount
      sorted_groups = groups.sort_by do |group|
        [-group[:date].to_time.to_i, group[:vehicle_name], -group[:total_amount]]
      end

      # Paginate groups
      page = pagination.page
      per_page = pagination.per_page
      start_index = (page - 1) * per_page
      end_index = start_index + per_page - 1
      paginated_items = sorted_groups[start_index..end_index] || []

      # Build pagination metadata
      total_count = sorted_groups.size
      total_pages = (total_count.to_f / per_page).ceil
      current_page = page
      next_page = current_page < total_pages ? current_page + 1 : nil
      prev_page = current_page > 1 ? current_page - 1 : nil
      first_page = current_page == 1
      last_page = current_page == total_pages

      {
        items: paginated_items,
        errors: [],
        pagination: {
          current_page:,
          next_page:,
          prev_page:,
          first_page:,
          last_page:,
          page_count: total_pages,
          total_size: total_count,
          page_size: per_page
        },
        total_amount: grouped_expenses_total_amount.to_f,
        category_totals:
      }
    end
  end
end
