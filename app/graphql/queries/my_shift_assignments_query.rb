# frozen_string_literal: true

module Queries
  class MyShiftAssignmentsQuery < BaseQuery
    description "Get shift assignments for the authenticated driver within a date range"

    argument :end_date, GraphQL::Types::ISO8601Date, required: true, description: "End date for the date range"
    argument :start_date, GraphQL::Types::ISO8601Date, required: true, description: "Start date for the date range"

    type [Types::ShiftAssignmentType], null: false

    def resolve(start_date:, end_date:)
      return [] unless current_user&.driver

      driver = current_user.driver

      driver.shift_assignments
            .where(start_time: start_date.beginning_of_day..end_date.end_of_day)
            .order(start_time: :asc)
    end
  end
end
