# frozen_string_literal: true

class ScheduledTripNotifier
  def self.send_confirmation_email(scheduled_trip)
    ScheduledTripMailer.confirmation_email(scheduled_trip).deliver_later
  end

  def self.send_acceptance_email(scheduled_trip)
    ScheduledTripMailer.acceptance_email(scheduled_trip).deliver_later
  end

  def self.send_decline_email(scheduled_trip)
    ScheduledTripMailer.decline_email(scheduled_trip).deliver_later
  end

  def self.send_auto_decline_email(scheduled_trip)
    ScheduledTripMailer.auto_decline_email(scheduled_trip).deliver_later
  end

  def self.acceptance_url(scheduled_trip)
    base_url = Rails.application.config.action_mailer.default_url_options[:host]
    port = Rails.application.config.action_mailer.default_url_options[:port]
    protocol = Rails.env.production? ? "https" : "http"
    port_str = port ? ":#{port}" : ""
    "#{protocol}://#{base_url}#{port_str}/scheduled-trips/#{scheduled_trip.acceptance_token}/accept"
  end

  def self.decline_url(scheduled_trip)
    base_url = Rails.application.config.action_mailer.default_url_options[:host]
    port = Rails.application.config.action_mailer.default_url_options[:port]
    protocol = Rails.env.production? ? "https" : "http"
    port_str = port ? ":#{port}" : ""
    "#{protocol}://#{base_url}#{port_str}/scheduled-trips/#{scheduled_trip.decline_token}/decline"
  end
end
