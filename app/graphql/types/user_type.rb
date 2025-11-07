module Types
  class UserType < Types::BaseObject
    include Types::Concerns::BaseActiveRecordFields

    description "A user in the system"

    field :driver, Types::DriverType, null: true
    field :email, String, null: false
    field :expenses, [Types::ExpenseType], null: true
    field :first_name, String, null: false
    field :full_name, String, null: false
    field :last_name, String, null: false
    field :last_sign_in_at, GraphQL::Types::ISO8601DateTime, null: true
    field :sign_in_count, Integer, null: false
  end
end
