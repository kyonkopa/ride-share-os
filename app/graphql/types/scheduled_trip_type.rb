# frozen_string_literal: true

module Types
  class ScheduledTripType < Types::BaseObject
    include Types::Concerns::BaseActiveRecordFields

    description "A scheduled trip request"

    field :client_email, String, null: false
    field :client_name, String, null: false
    field :client_phone, String, null: false
    field :dropoff_location, String, null: false
    field :notes, String, null: true
    field :pickup_datetime, GraphQL::Types::ISO8601DateTime, null: false
    field :pickup_location, String, null: false
    field :price, Float, null: true
    field :recurrence_config, GraphQL::Types::JSON, null: true
    field :state, Types::Enums::ScheduledTripStateEnum, null: false

    # Associations
    field :audit_logs, [Types::ScheduledTripAuditLogType], null: true
    field :driver, Types::DriverType, null: true
    field :reviewed_at, GraphQL::Types::ISO8601DateTime, null: true
    field :reviewed_by, Types::UserType, null: true

    def audit_logs
      object.audit_logs.recent
    end
  end
end
