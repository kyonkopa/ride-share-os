# frozen_string_literal: true

namespace :scheduled_trips do
  desc "Auto-decline scheduled trips that haven't been accepted within 2 hours of pickup time"
  task auto_decline: :environment do
    puts "Running auto-decline job for scheduled trips..."
    AutoDeclineScheduledTripsJob.perform_now
    puts "Auto-decline job completed."
  end
end
