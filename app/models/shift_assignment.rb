# == Schema Information
#
# Table name: shift_assignments
#
#  id                   :integer         not null primary key
#  city                 :integer         not null
#  driver_id            :integer         not null
#  vehicle_id           :integer        
#  start_time           :datetime        not null
#  end_time             :datetime        not null
#  recurrence_rule      :string         
#  status               :integer         not null default(0)
#  created_at           :datetime        not null
#  updated_at           :datetime        not null
#
# Indexes
#
#  index_index_shift_assignments_on_city (city)
#  index_index_shift_assignments_on_driver_id (driver_id)
#  index_index_shift_assignments_on_driver_id_and_start_time (driver_id, start_time)
#  index_index_shift_assignments_on_start_time (start_time)
#  index_index_shift_assignments_on_status (status)
#  index_index_shift_assignments_on_vehicle_id (vehicle_id)
#  index_index_shift_assignments_on_vehicle_id_and_start_time (vehicle_id, start_time)
#
# Foreign Keys
#
#  fk_rails_...  (vehicle_id => vehicles.id)
#  fk_rails_...  (driver_id => drivers.id)
#

class ShiftAssignment < ApplicationRecord
  enum :city, {
    accra: 0,
    kumasi: 1,
    takoradi: 2
  }

  enum :status, {
    scheduled: 0,
    active: 1,
    completed: 2,
    missed: 3
  }

  belongs_to :driver
  belongs_to :vehicle, optional: true
  has_many :shift_events, dependent: :destroy
  has_many :revenue_records, dependent: :destroy

  validates :city, presence: true
  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :status, presence: true
  validate :end_time_after_start_time

  def actual_start_time
    shift_events.find_by(event_type: "clock_in")&.created_at
  end
  
  def actual_end_time
    shift_events.find_by(event_type: "clock_out")&.created_at
  end

  private

  def end_time_after_start_time
    return unless start_time && end_time

    errors.add(:end_time, "must be after start time") if end_time <= start_time
  end
end
