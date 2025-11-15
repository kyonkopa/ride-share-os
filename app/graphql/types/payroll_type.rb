# frozen_string_literal: true

module Types
  class PayrollType < Types::BaseObject
    description "Payroll information for all drivers"

    field :driver_payrolls, [Types::DriverPayrollType], null: false
    field :total_amount_due, Float, null: false
  end
end
