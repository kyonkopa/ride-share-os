# frozen_string_literal: true

module Types
  module Enums
    class ShiftStatusEnum < Types::BaseEnum
      description "The possible statuses for a shift assignment"

      value "scheduled", value: "scheduled", description: "Shift is scheduled but not yet started"
      value "active", value: "active", description: "Shift is currently active"
      value "completed", value: "completed", description: "Shift has been completed"
      value "missed", value: "missed", description: "Shift was missed"
      value "paused", value: "paused", description: "Shift is paused"
    end
  end
end
