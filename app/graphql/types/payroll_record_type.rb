# frozen_string_literal: true

module Types
  class PayrollRecordType < Types::BaseObject
    include Types::Concerns::BaseActiveRecordFields

    description "A payroll record tracking payment to a driver"

    field :amount_paid, Float, null: false, description: "Amount paid to the driver"
    field :driver, Types::DriverType, null: false, description: "The driver who was paid"
    field :notes, String, null: true, description: "Optional notes about the payment"
    field :paid_at, GraphQL::Types::ISO8601DateTime, null: false, description: "When the payment was made"
    field :paid_by_user, Types::UserType, null: false, description: "The user who processed the payment"
    field :period_end_date, GraphQL::Types::ISO8601Date, null: false, description: "End date of the payroll period"
    field :period_start_date, GraphQL::Types::ISO8601Date, null: false, description: "Start date of the payroll period"
  end
end
