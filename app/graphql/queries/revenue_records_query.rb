# frozen_string_literal: true

module Queries
  class RevenueRecordsQuery < BaseQuery
    description "Get all revenue records within a date range"

    argument :end_date, GraphQL::Types::ISO8601Date, required: false, description: "End date for the date range"
    argument :start_date, GraphQL::Types::ISO8601Date, required: false, description: "Start date for the date range"

    type [Types::RevenueRecordType], null: false

    def resolve(start_date: nil, end_date: nil)
      records = RevenueRecord.all

      if start_date && end_date
        records = records.where(realized_at: start_date.beginning_of_day..end_date.end_of_day)
      elsif start_date
        records = records.where("realized_at >= ?", start_date.beginning_of_day)
      elsif end_date
        records = records.where("realized_at <= ?", end_date.end_of_day)
      end

      records.order(realized_at: :desc)
    end
  end
end
