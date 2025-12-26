# frozen_string_literal: true

module Queries
  class YesterdayReportQuery < BaseQuery
    description "Get yesterday's operational report"

    type Types::YesterdayReportType, null: false

    def resolve
      report_data = HistoricalReportService.generate_report

      {
        human_readable_text: report_data[:human_readable_text]
      }
    end
  end
end
