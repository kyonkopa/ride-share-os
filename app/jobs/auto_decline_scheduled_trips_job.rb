# frozen_string_literal: true

class AutoDeclineScheduledTripsJob < ApplicationJob
  queue_as :default

  def perform
    # Find all confirmed trips that should be auto-declined
    # (confirmed but not accepted, and pickup time is within 2 hours)
    trips_to_decline = ScheduledTrip.confirmed
                                    .where.not(state: :accepted)
                                    .where("pickup_datetime <= ?", 2.hours.from_now)
                                    .select { |trip| trip.should_auto_decline? }

    trips_to_decline.each do |trip|
      decline_trip(trip)
    end

    Rails.logger.info("Auto-declined #{trips_to_decline.count} scheduled trips")
  end

  private

  def decline_trip(trip)
    # Set metadata for audit log
    trip.log_state_change(
      reason: "Auto-declined: No response received within 2 hours of pickup time",
      metadata: { auto_declined_at: Time.current }
    )

    # Trigger AASM event (will handle audit log and notification)
    trip.auto_decline!
  rescue AASM::InvalidTransition => e
    Rails.logger.error("Invalid transition for trip #{trip.id}: #{e.message}")
  rescue StandardError => e
    Rails.logger.error("Failed to auto-decline trip #{trip.id}: #{e.message}")
    raise
  end
end
