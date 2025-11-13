module Types
  module Enums
    class RevenueSourceEnum < Types::BaseEnum
      value "bolt", "Bolt"
      value "uber", "Uber"
      value "off_trip", "Off trip"
    end
  end

  class RevenueRecordType < Types::BaseObject
    include Types::Concerns::BaseActiveRecordFields

    description "A revenue record for a shift"

    field :driver, Types::DriverType, null: false
    field :reconciled, Boolean, null: false
    field :shift_assignment, Types::ShiftAssignmentType, null: false
    field :source, Types::Enums::RevenueSourceEnum, null: false
    field :total_profit, Float, null: false
    field :total_revenue, Float, null: false
  end
end
