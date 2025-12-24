# frozen_string_literal: true

module Types
  class FinanceDetailsTrendItemType < Types::BaseObject
    description "Finance details for a specific month in a trend"

    field :end_date, GraphQL::Types::ISO8601Date, null: false, description: "End date of the month"
    field :finance_details, Types::FinanceDetailsType, null: false, description: "Finance details for this month"
    field :is_projection, Boolean, null: false, description: "Whether this is a projected value"
    field :month, String, null: false, description: "Month label (e.g., 'Jan 2024')"
    field :start_date, GraphQL::Types::ISO8601Date, null: false, description: "Start date of the month"
  end
end
