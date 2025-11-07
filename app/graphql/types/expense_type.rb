module Types
  class ExpenseType < Types::BaseObject
    include Types::Concerns::BaseActiveRecordFields

    description "An expense record"

    field :amount, Float, null: false, description: "Expense amount in dollars"
    field :category, String, null: false
    field :date, GraphQL::Types::ISO8601Date, null: false
    field :receipt_key, String, null: true

    # Associations
    field :user, Types::UserType, null: true
    field :vehicle, Types::VehicleType, null: true

    def amount
      # Convert cents to dollars
      object.amount / 100.0
    end
  end
end
