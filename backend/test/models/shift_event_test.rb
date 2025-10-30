# == Schema Information
#
# Table name: shift_events
#
#  id                  :integer          not null, primary key
#  shift_assignment_id :integer          not null
#  event_type          :integer          not null
#  odometer            :integer
#  vehicle_range       :integer
#  gps_lat             :decimal(10, 6)
#  gps_lon             :decimal(10, 6)
#  notes               :text
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#
# Indexes
#
#  index_shift_events_on_event_type           (event_type)
#  index_shift_events_on_shift_assignment_id  (shift_assignment_id)
#

require "test_helper"

class ShiftEventTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
