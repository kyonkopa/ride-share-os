# frozen_string_literal: true

module Types
  class DailyPayrollBreakdownType < Types::BaseObject
    description "Daily payroll breakdown for a driver"

    field :amount_due, Float, null: false
    field :date, GraphQL::Types::ISO8601Date, null: false
    field :revenue, Float, null: false
  end
end
