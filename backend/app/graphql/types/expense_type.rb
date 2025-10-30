module Types
  class ExpenseType < Types::BaseObject
    include Types::Concerns::BaseActiveRecordFields

    description "An expense record"

    field :amount, Float, null: false
    field :category, String, null: false
    field :date, GraphQL::Types::ISO8601Date, null: false
    field :receipt_key, String, null: true

    # Associations
    field :driver, Types::DriverType, null: true
    field :vehicle, Types::VehicleType, null: true
  end
end
