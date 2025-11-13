# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    field :current_shift, resolver: Queries::CurrentShiftQuery, description: "Get the current shift"
    field :current_user, resolver: Queries::CurrentUserQuery, description: "Get the current authenticated user"
    field :drivers, resolver: Queries::DriversQuery, description: "Get all drivers in the system"
    field :expense_stats, resolver: Queries::ExpenseStatsQuery, description: "Get expense statistics within a date range"
    field :my_shift_assignments, resolver: Queries::MyShiftAssignmentsQuery, description: "Get shift assignments for the current driver within a date range"
    field :revenue_records, resolver: Queries::RevenueRecordsQuery, description: "Get all revenue records within a date range"
    field :revenue_stats, resolver: Queries::RevenueStatsQuery, description: "Get revenue statistics within a date range"
    field :today_shifts, resolver: Queries::TodayShiftsQuery, description: "Get today's shifts"
    field :todays_shift_events, resolver: Queries::TodaysShiftEventsQuery, description: "Get today's shift events for the current driver"
    field :vehicles, resolver: Queries::VehiclesQuery, description: "Get all vehicles in the system"
    pagination_field :expenses, Types::ExpenseType, resolver: Queries::ExpensesQuery, description: "Get all expenses within a date range"
  end
end
