# frozen_string_literal: true

module Queries
  class ScheduledTripsQuery < Resolvers::BaseResolver
    description "Get scheduled trips with pagination and filters"

    argument :filter, Types::Inputs::ScheduledTripsFilterInput, required: false, description: "Filter options"
    argument :pagination, Types::Inputs::PaginationInput, required: true, description: "Pagination options"

    type Types::PaginatedResultType.for(Types::ScheduledTripType), null: false

    def scope(**args)
      ScheduledTrip.where.not(state: [:auto_declined, :declined]).order(pickup_datetime: :asc)
    end

    def apply_state_filter(scope, state)
      scope.by_state(state)
    end

    def apply_start_date_filter(scope, start_date)
      date = start_date.is_a?(Date) ? start_date : Date.parse(start_date.to_s)
      scope.where("pickup_datetime >= ?", date.beginning_of_day)
    end

    def apply_end_date_filter(scope, end_date)
      date = end_date.is_a?(Date) ? end_date : Date.parse(end_date.to_s)
      scope.where("pickup_datetime <= ?", date.end_of_day)
    end

    def apply_recurring_filter(scope, recurring)
      if recurring
        scope.recurring
      else
        scope.where(recurrence_config: {})
      end
    end

    def apply_client_email_filter(scope, email)
      scope.where(client_email: email)
    end
  end
end
