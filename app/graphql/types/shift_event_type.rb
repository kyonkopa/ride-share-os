# frozen_string_literal: true

module Types
  class ShiftEventTypeEnum < Types::BaseEnum
    description "The possible types of shift events"

    value "clock_in", value: "clock_in", description: "A clock in event"
    value "clock_out", value: "clock_out", description: "A clock out event"
    value "telemetry_snapshot", value: "telemetry_snapshot", description: "A telemetry snapshot event"
  end

  class ShiftEventType < Types::BaseObject
    include Types::Concerns::BaseActiveRecordFields

    description "An event that occurs during a shift"

    field :event_type, ShiftEventTypeEnum, null: false
    field :gps_lat, Float, null: true
    field :gps_lon, Float, null: true
    field :notes, String, null: true
    field :odometer, Integer, null: true
    field :vehicle_range, Integer, null: true

    # Associations
    field :shift_assignment, Types::ShiftAssignmentType, null: false
  end
end
