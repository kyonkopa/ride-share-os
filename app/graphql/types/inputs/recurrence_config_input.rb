# frozen_string_literal: true

module Types
  module Inputs
    class RecurrenceConfigInput < Types::BaseInputObject
      description "Input type for recurrence configuration"

      argument :days_of_week, [Integer], required: false, description: "Days of week (0-6, Sunday-Saturday) for weekly recurrence"
      argument :end_date, GraphQL::Types::ISO8601Date, required: false, description: "End date for recurrence"
      argument :frequency, String, required: true, description: "Frequency: daily, weekly, monthly"
      argument :interval, Integer, required: false, default_value: 1, description: "Interval between occurrences"
      argument :occurrence_count, Integer, required: false, description: "Number of occurrences"
    end
  end
end
