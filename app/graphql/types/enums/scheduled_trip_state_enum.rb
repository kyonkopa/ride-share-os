# frozen_string_literal: true

module Types
  module Enums
    class ScheduledTripStateEnum < Types::BaseEnum
      description "The possible states for scheduled trips"

      value "pending", value: "pending", description: "Pending review"
      value "confirmed", value: "confirmed", description: "Confirmed by staff"
      value "accepted", value: "accepted", description: "Accepted by client"
      value "declined", value: "declined", description: "Declined by client"
      value "auto_declined", value: "auto_declined", description: "Auto-declined by system"
    end
  end
end
