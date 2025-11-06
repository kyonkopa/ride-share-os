module Types
  class ShiftAssignmentType < Types::BaseObject
    include Types::Concerns::BaseActiveRecordFields

    description "A shift assignment for a driver"

    field :actual_end_time, GraphQL::Types::ISO8601DateTime, null: true
    field :actual_start_time, GraphQL::Types::ISO8601DateTime, null: true
    field :city, Types::Enums::CityEnum, null: false
    field :end_time, GraphQL::Types::ISO8601DateTime, null: false
    field :start_time, GraphQL::Types::ISO8601DateTime, null: false
    field :status, Types::Enums::ShiftStatusEnum, null: false

    # Associations
    field :driver, Types::DriverType, null: false
    field :revenue_records, [Types::RevenueRecordType], null: true
    field :shift_events, [Types::ShiftEventType], null: true
    field :vehicle, Types::VehicleType, null: true
  end
end
