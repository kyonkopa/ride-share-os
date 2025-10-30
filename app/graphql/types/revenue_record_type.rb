module Types
  class RevenueRecordType < Types::BaseObject
    include Types::Concerns::BaseActiveRecordFields

    description "A revenue record for a shift"

    field :reconciled, Boolean, null: false
    field :total_profit, Float, null: false
    field :total_revenue, Float, null: false

    # Associations
    field :driver, Types::DriverType, null: false
    field :shift_assignment, Types::ShiftAssignmentType, null: false
  end
end
