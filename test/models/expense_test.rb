# == Schema Information
#
# Table name: expenses
#
#  id          :integer          not null, primary key
#  driver_id   :integer
#  vehicle_id  :integer
#  amount      :decimal(10, 2)   not null
#  category    :string           not null
#  date        :date             not null
#  receipt_key :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
# Indexes
#
#  index_expenses_on_category             (category)
#  index_expenses_on_date                 (date)
#  index_expenses_on_driver_id            (driver_id)
#  index_expenses_on_driver_id_and_date   (driver_id,date)
#  index_expenses_on_vehicle_id           (vehicle_id)
#  index_expenses_on_vehicle_id_and_date  (vehicle_id,date)
#

require "test_helper"

class ExpenseTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
