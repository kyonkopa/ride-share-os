# frozen_string_literal: true

module Queries
  class TodaysShiftEventsQuery < BaseQuery
    description "Get today's shift events for the authenticated driver"

    type [Types::ShiftEventType], null: false

    def resolve
      today = Date.current
      driver = current_user&.driver

      driver_scope = driver.present? ? { shift_assignments: { driver_id: driver.id } } : {}

      # Get all shift events from today's shifts for this driver
      ShiftEvent.joins(:shift_assignment)
                .where(driver_scope)
                .where(created_at: today.beginning_of_day..today.end_of_day)
                .order(created_at: :desc)
    end
  end
end
