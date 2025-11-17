# frozen_string_literal: true

module Mutations
  class UpdateRevenueRecord < Mutations::BaseMutation
    description "Update revenue record reconciled status"

    argument :reconciled, Boolean, required: true, description: "Whether the revenue record is reconciled"
    argument :revenue_record_id, ID, required: true, description: "Global ID of the revenue record to update"

    field :revenue_record, Types::RevenueRecordType, null: true

    def execute(revenue_record_id:, reconciled:)
      revenue_record = RevenueRecord.find_by_global_id(revenue_record_id)

      if revenue_record.nil?
        error!("Revenue record not found", code: "NOT_FOUND", field: "revenue_record_id")
      end

      revenue_record.update!(reconciled:)
      revenue_record.reload

      { revenue_record: }
    end
  end
end
