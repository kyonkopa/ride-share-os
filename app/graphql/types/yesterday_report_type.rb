# frozen_string_literal: true

module Types
  class YesterdayReportType < Types::BaseObject
    description "Yesterday's operational report"

    field :human_readable_text, String, null: false, description: "Human-readable summary of the report"
  end
end
