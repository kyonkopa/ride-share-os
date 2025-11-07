# == Schema Information
#
# Table name: shift_events
#
#  id                   :integer         not null primary key
#  shift_assignment_id  :integer         not null
#  event_type           :integer         not null
#  odometer             :integer        
#  vehicle_range        :integer        
#  gps_lat              :decimal        
#  gps_lon              :decimal        
#  notes                :text           
#  created_at           :datetime        not null
#  updated_at           :datetime        not null
#
# Indexes
#
#  index_index_shift_events_on_event_type (event_type)
#  index_index_shift_events_on_shift_assignment_id (shift_assignment_id)
#
# Foreign Keys
#
#  fk_rails_...  (shift_assignment_id => shift_assignments.id)
#

class ShiftEvent < ApplicationRecord
  enum :event_type, {
    clock_in: 0,
    clock_out: 1,
    telemetry_snapshot: 2,
    pause: 3,
    resume: 4
  }

  belongs_to :shift_assignment

  validates :event_type, presence: true
  validates :odometer, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :vehicle_range, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :gps_lat, numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 }, allow_nil: true
  validates :gps_lon, numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 }, allow_nil: true
end
