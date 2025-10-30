# frozen_string_literal: true

module Queries
  class TodayShiftsQuery < BaseQuery
    description "Get today's shifts for the authenticated driver"

    type [Types::ShiftAssignmentType], null: false

    def resolve
      return [] unless current_user&.driver

      driver = current_user.driver
      today = Date.current

      driver.shift_assignments
            .where(start_time: today.beginning_of_day..today.end_of_day)
            .order(:start_time)
    end
  end
end
