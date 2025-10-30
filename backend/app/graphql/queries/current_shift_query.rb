# frozen_string_literal: true

module Queries
  class CurrentShiftQuery < BaseQuery
    description "Get the current active shift for the authenticated driver"

    type Types::ShiftAssignmentType, null: true

    def resolve
      return nil unless current_user&.driver

      current_user.driver.shift_assignments.active.first
    end
  end
end
