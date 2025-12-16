# == Schema Information
#
# Table name: scheduled_trip_audit_logs
#
#  id                   :integer         not null primary key
#  scheduled_trip_id    :integer         not null
#  previous_state       :string
#  new_state            :string          not null
#  changed_by_id        :integer
#  change_reason        :string
#  metadata             :jsonb           default({})
#  created_at           :datetime        not null
#  updated_at           :datetime        not null
#
# Indexes
#
#  index_index_scheduled_trip_audit_logs_on_changed_by_id (changed_by_id)
#  index_index_scheduled_trip_audit_logs_on_created_at (created_at)
#  index_index_scheduled_trip_audit_logs_on_scheduled_trip_id (scheduled_trip_id)
#
# Foreign Keys
#
#  fk_rails_...  (changed_by_id => users.id)
#  fk_rails_...  (scheduled_trip_id => scheduled_trips.id)
#

class ScheduledTripAuditLog < ApplicationRecord
  belongs_to :scheduled_trip
  belongs_to :changed_by, class_name: "User", optional: true

  validates :new_state, presence: true
  validates :scheduled_trip_id, presence: true

  scope :for_trip, ->(trip) { where(scheduled_trip_id: trip.id) }
  scope :recent, -> { order(created_at: :desc) }
end
