# frozen_string_literal: true

class ScheduledTripMailer < ApplicationMailer
  def confirmation_email(scheduled_trip)
    @scheduled_trip = scheduled_trip
    @acceptance_url = ScheduledTripNotifier.acceptance_url(scheduled_trip)
    @decline_url = ScheduledTripNotifier.decline_url(scheduled_trip)

    mail(
      to: scheduled_trip.client_email,
      subject: "Your Scheduled Trip Request Has Been Confirmed"
    )
  end

  def acceptance_email(scheduled_trip)
    @scheduled_trip = scheduled_trip

    mail(
      to: scheduled_trip.client_email,
      subject: "Your Scheduled Trip Has Been Accepted"
    )
  end

  def decline_email(scheduled_trip)
    @scheduled_trip = scheduled_trip

    mail(
      to: scheduled_trip.client_email,
      subject: "Your Scheduled Trip Has Been Declined"
    )
  end

  def auto_decline_email(scheduled_trip)
    @scheduled_trip = scheduled_trip

    mail(
      to: scheduled_trip.client_email,
      subject: "Your Scheduled Trip Has Been Automatically Declined"
    )
  end
end
