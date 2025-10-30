# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    field :current_user, resolver: Queries::CurrentUserQuery, description: "Get the current authenticated user"
    field :current_shift, resolver: Queries::CurrentShiftQuery, description: "Get the current shift"
    field :vehicles, resolver: Queries::VehiclesQuery, description: "Get all vehicles in the system"
    field :today_shifts, resolver: Queries::TodayShiftsQuery, description: "Get today's shifts"
  end
end
