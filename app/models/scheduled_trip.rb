# == Schema Information
#
# Table name: scheduled_trips
#
#  id                   :integer         not null primary key
#  client_name          :string          not null
#  client_email         :string          not null
#  client_phone         :string          not null
#  pickup_location      :string          not null
#  dropoff_location     :string          not null
#  pickup_datetime      :datetime        not null
#  recurrence_config    :jsonb           default({})
#  price                :decimal        
#  acceptance_token     :string          not null
#  decline_token        :string          not null
#  reviewed_by_id       :integer        
#  reviewed_at          :datetime       
#  notes                :text           
#  created_at           :datetime        not null
#  updated_at           :datetime        not null
#  state                :string          not null default(pending)
#  driver_id            :integer        
#
# Indexes
#
#  index_index_scheduled_trips_on_acceptance_token (acceptance_token) UNIQUE
#  index_index_scheduled_trips_on_client_email (client_email)
#  index_index_scheduled_trips_on_decline_token (decline_token) UNIQUE
#  index_index_scheduled_trips_on_driver_id (driver_id)
#  index_index_scheduled_trips_on_pickup_datetime (pickup_datetime)
#  index_index_scheduled_trips_on_reviewed_by_id (reviewed_by_id)
#  index_index_scheduled_trips_on_state (state)
#
# Foreign Keys
#
#  fk_rails_...  (reviewed_by_id => users.id)
#  fk_rails_...  (driver_id => drivers.id)
#

class ScheduledTrip < ApplicationRecord
  include AASM

  aasm column: :state do
    state :pending, initial: true
    state :confirmed
    state :accepted
    state :declined
    state :auto_declined

    event :confirm, before: :capture_previous_state, after_commit: :on_confirmed do
      transitions from: :pending, to: :confirmed
    end

    event :accept, before: :capture_previous_state, after_commit: :on_accepted do
      transitions from: :confirmed, to: :accepted, guard: :can_be_accepted?
    end

    event :decline, before: :capture_previous_state, after_commit: :on_declined do
      transitions from: [:pending, :confirmed], to: :declined
    end

    event :auto_decline, before: :capture_previous_state, after_commit: :on_auto_declined do
      transitions from: :confirmed, to: :auto_declined
    end
  end

  belongs_to :reviewed_by, class_name: "User", optional: true
  belongs_to :driver, optional: true
  has_many :audit_logs, class_name: "ScheduledTripAuditLog", dependent: :destroy

  validates :client_name, presence: true
  validates :client_email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :client_phone, presence: true
  validates :pickup_location, presence: true
  validates :dropoff_location, presence: true
  validates :pickup_datetime, presence: true
  validates :acceptance_token, presence: true, uniqueness: true
  validates :decline_token, presence: true, uniqueness: true
  validate :pickup_datetime_in_future, on: :create

  scope :upcoming, -> { where("pickup_datetime >= ?", Time.current) }
  scope :past, -> { where("pickup_datetime < ?", Time.current) }
  scope :recurring, -> { where.not(recurrence_config: {}) }
  scope :by_state, ->(state) { where(state:) }
  scope :by_date_range, ->(start_date, end_date) { where(pickup_datetime: start_date.beginning_of_day..end_date.end_of_day) }

  before_validation :generate_tokens, on: :create

  attr_accessor :state_change_user, :state_change_reason, :state_change_metadata, :previous_state_before_transition

  def log_state_change(user: nil, reason: nil, metadata: {})
    self.state_change_user = user
    self.state_change_reason = reason
    self.state_change_metadata = metadata
  end

  def can_be_accepted?
    confirmed? && pickup_datetime > 2.hours.from_now
  end

  def can_be_declined?
    pending? || confirmed?
  end

  def should_auto_decline?
    confirmed? && !accepted? && pickup_datetime <= 2.hours.from_now
  end

  private

  def on_confirmed
    create_audit_log_entry("confirmed", "Reviewed and confirmed by staff")
    ScheduledTripNotifier.send_confirmation_email(self)
  end

  def on_accepted
    create_audit_log_entry("accepted", state_change_reason || "Accepted by client via secure link")
    ScheduledTripNotifier.send_acceptance_email(self)
  end

  def on_declined
    create_audit_log_entry("declined", state_change_reason || "Declined by client via secure link")
    ScheduledTripNotifier.send_decline_email(self)
  end

  def on_auto_declined
    create_audit_log_entry("auto_declined", "Auto-declined: No response received within 2 hours of pickup time")
    ScheduledTripNotifier.send_auto_decline_email(self)
  end

  def capture_previous_state
    self.previous_state_before_transition = state_before_type_cast.to_s
  end

  def create_audit_log_entry(new_state, reason)
    previous_state = previous_state_before_transition || state_before_type_cast.to_s
    audit_logs.create!(
      previous_state:,
      new_state:,
      changed_by: state_change_user || reviewed_by,
      change_reason: reason,
      metadata: state_change_metadata || {}
    )
  end

  def generate_tokens
    self.acceptance_token ||= SecureRandom.urlsafe_base64(32)
    self.decline_token ||= SecureRandom.urlsafe_base64(32)
  end

  def pickup_datetime_in_future
    return unless pickup_datetime

    errors.add(:pickup_datetime, "must be in the future") if pickup_datetime <= Time.current
  end
end
