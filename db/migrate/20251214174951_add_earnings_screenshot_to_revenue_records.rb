# frozen_string_literal: true

class AddEarningsScreenshotToRevenueRecords < ActiveRecord::Migration[8.0]
  def change
    add_column :revenue_records, :earnings_screenshot, :text
  end
end
