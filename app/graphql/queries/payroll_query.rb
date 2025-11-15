# frozen_string_literal: true

module Queries
  class PayrollQuery < BaseQuery
    description "Get payroll information for all drivers within a date range"

    argument :end_date, GraphQL::Types::ISO8601Date, required: true, description: "End date for the date range"
    argument :start_date, GraphQL::Types::ISO8601Date, required: true, description: "Start date for the date range"

    type Types::PayrollType, null: false

    def resolve(start_date:, end_date:)
      PayrollService.calculate_payroll(start_date:, end_date:)
    end
  end
end
