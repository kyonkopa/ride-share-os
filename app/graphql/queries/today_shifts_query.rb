# frozen_string_literal: true

module Queries
  class TodayShiftsQuery < BaseQuery
    description "Get today's shifts for the authenticated driver"

    type [Types::ShiftAssignmentType], null: false

    def resolve
      return ShiftAssignment.scheduled_today.order(start_time: :asc) unless current_user&.driver

      driver = current_user.driver

      driver.shift_assignments.scheduled_today.order(start_time: :asc)
    end
  end
end
