# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    field :current_shift, resolver: Queries::CurrentShiftQuery, description: "Get the current shift"

    field :grouped_expenses, Types::GroupedExpensesResultType, resolver: Queries::GroupedExpensesQuery, description: "Get expenses grouped by vehicle and date within a date range" do
      argument :pagination, Types::Inputs::PaginationInput, required: true, description: "Pagination options"
    end


    field :grouped_revenue_records, Types::GroupedRevenueRecordsResultType, resolver: Queries::GroupedRevenueRecordsQuery, description: "Get revenue records grouped by driver and date within a date range" do
      argument :pagination, Types::Inputs::PaginationInput, required: true, description: "Pagination options"
    end


    field :my_payroll, resolver: Queries::MyPayrollQuery, description: "Get payroll information for the authenticated driver within a date range"


    field :payroll, resolver: Queries::PayrollQuery, description: "Get all drivers with their shift assignments for payroll calculation"


    field :current_user, resolver: Queries::CurrentUserQuery, description: "Get the current authenticated user"


    field :drivers, resolver: Queries::DriversQuery, description: "Get all drivers in the system"


    field :finance_details, resolver: Queries::FinanceDetailsQuery, description: "Get finance details breakdown for a date range"


    field :my_shift_assignments, resolver: Queries::MyShiftAssignmentsQuery, description: "Get shift assignments for the current driver within a date range"


    field :revenue_records, resolver: Queries::RevenueRecordsQuery, description: "Get all revenue records within a date range"


    field :today_shifts, resolver: Queries::TodayShiftsQuery, description: "Get today's shifts"


    field :todays_shift_events, resolver: Queries::TodaysShiftEventsQuery, description: "Get today's shift events for the current driver"


    field :vehicles, resolver: Queries::VehiclesQuery, description: "Get all vehicles in the system"


    pagination_field :scheduled_trips, Types::ScheduledTripType, resolver: Queries::ScheduledTripsQuery, description: "Get scheduled trips with pagination and filters"
    pagination_field :expenses, Types::ExpenseType, resolver: Queries::ExpensesQuery, description: "Get all expenses within a date range"
  end
end
