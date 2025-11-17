# frozen_string_literal: true

module Types
  class DriverDateRevenueGroupType < Types::BaseObject
    description "A group of revenue records for a specific driver and date"

    field :all_reconciled, Boolean, null: false, description: "Whether all revenue records in this group are reconciled"
    field :date, GraphQL::Types::ISO8601Date, null: false, description: "Date of the revenue records"
    field :driver_id, String, null: false, description: "Driver ID"
    field :driver_name, String, null: false, description: "Driver full name"
    field :revenue_count, Int, null: false, description: "Number of revenue records in this group"
    field :revenue_records, [Types::RevenueRecordType], null: false, description: "List of revenue records in this group"
    field :source_breakdown, GraphQL::Types::JSON, null: false, description: "Revenue breakdown by source"
    field :total_profit, Float, null: false, description: "Total profit of all revenue records in this group"
    field :total_revenue, Float, null: false, description: "Total revenue of all revenue records in this group"
    field :vehicle_name, String, null: true, description: "Vehicle display name (if available)"
  end
end
