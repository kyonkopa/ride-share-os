# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    field :current_shift, resolver: Queries::CurrentShiftQuery, description: "Get the current shift"
    field :current_user, resolver: Queries::CurrentUserQuery, description: "Get the current authenticated user"
    field :my_shift_assignments, resolver: Queries::MyShiftAssignmentsQuery, description: "Get shift assignments for the current driver within a date range"
    field :today_shifts, resolver: Queries::TodayShiftsQuery, description: "Get today's shifts"
    field :todays_shift_events, resolver: Queries::TodaysShiftEventsQuery, description: "Get today's shift events for the current driver"
    field :vehicles, resolver: Queries::VehiclesQuery, description: "Get all vehicles in the system"
  end
end
