# frozen_string_literal: true

module Queries
  class MyPayrollQuery < BaseQuery
    description "Get payroll information for the authenticated driver within a date range"

    argument :end_date, GraphQL::Types::ISO8601Date, required: true, description: "End date for the date range"
    argument :start_date, GraphQL::Types::ISO8601Date, required: true, description: "Start date for the date range"

    type Types::DriverPayrollType, null: true

    def resolve(start_date:, end_date:)
      return nil unless current_user&.driver

      driver = current_user.driver
      PayrollService.calculate_driver_payroll(driver:, start_date:, end_date:)
    end
  end
end
