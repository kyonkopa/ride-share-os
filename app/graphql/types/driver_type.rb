module Types
  class DriverType < Types::BaseObject
    include Types::Concerns::BaseActiveRecordFields

    description "A driver in the system"

    field :dob, GraphQL::Types::ISO8601Date, null: false
    field :email, String, null: false
    field :full_name, String, null: false
    field :phone_number, String, null: false
    field :verified, Boolean, null: false

    # Associations
    field :expenses, [Types::ExpenseType], null: true
    field :revenue_records, [Types::RevenueRecordType], null: true
    field :shift_assignments, [Types::ShiftAssignmentType], null: true
    field :user, Types::UserType, null: true

    def id = object.id
  end
end
