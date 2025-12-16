# frozen_string_literal: true

namespace :revenue_records do
  desc "Populate realized_at for existing revenue records using created_at.start_of_day"
  task populate_realized_at: :environment do
    puts "Populating realized_at for existing revenue records..."

    updated_count = 0
    RevenueRecord.where(realized_at: nil).find_each do |record|
      record.update_column(:realized_at, record.created_at.beginning_of_day)
      updated_count += 1
    end

    puts "Updated #{updated_count} revenue records with realized_at."
  end
end
