# frozen_string_literal: true

module Types
  class DriverPayrollType < Types::BaseObject
    description "Payroll information for a driver"

    field :amount_due, Float, null: false
    field :daily_breakdown, [Types::DailyPayrollBreakdownType], null: false
    field :driver, Types::DriverType, null: false
    field :start_date, GraphQL::Types::ISO8601Date, null: false
  end
end
