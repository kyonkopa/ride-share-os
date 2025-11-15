# frozen_string_literal: true

module Types
  class FinanceDetailsType < Types::BaseObject
    description "Finance details breakdown for a date range"

    field :earnings, Float, null: false, description: "Net company earnings (revenue - payroll - expenses)"
    field :total_expenses, Float, null: false, description: "Total expenses for the period"
    field :total_payroll_due, Float, null: false, description: "Total payroll due to drivers for the period"
    field :total_revenue, Float, null: false, description: "Total revenue for the period"
  end
end
