# frozen_string_literal: true

module Queries
  class RecentShiftEventsQuery < Resolvers::BaseResolver
    description "Get recent shift events for the authenticated driver with pagination"

    argument :pagination, Types::Inputs::PaginationInput, required: true, description: "Pagination options"

    type Types::PaginatedResultType.for(Types::ShiftEventType), null: false

    def scope(**args)
      driver = current_user&.driver

      driver_scope = driver.present? ? { shift_assignments: { driver_id: driver.id } } : {}

      # Get all shift events for this driver, ordered by most recent first
      ShiftEvent.joins(:shift_assignment)
                .where(driver_scope)
                .order(created_at: :desc)
    end
  end
end
