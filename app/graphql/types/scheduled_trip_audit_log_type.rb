# frozen_string_literal: true

module Types
  class ScheduledTripAuditLogType < Types::BaseObject
    include Types::Concerns::BaseActiveRecordFields

    description "An audit log entry for a scheduled trip state change"

    field :change_reason, String, null: true
    field :metadata, GraphQL::Types::JSON, null: true
    field :new_state, String, null: false
    field :previous_state, String, null: true

    # Associations
    field :changed_by, Types::UserType, null: true
    field :scheduled_trip, Types::ScheduledTripType, null: false
  end
end
