# frozen_string_literal: true

module Types::Concerns::BaseActiveRecordFields
  extend ActiveSupport::Concern

  included do
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :global_id, String, null: false
    field :id, String, null: false, method: :global_id
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
