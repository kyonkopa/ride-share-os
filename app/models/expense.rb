# == Schema Information
#
# Table name: expenses
#
#  id                   :integer         not null primary key
#  driver_id            :integer
#  vehicle_id           :integer
#  amount               :decimal         not null
#  category             :string          not null
#  date                 :date            not null
#  receipt_key          :string
#  created_at           :datetime        not null
#  updated_at           :datetime        not null
#
# Indexes
#
#  index_index_expenses_on_category     (category)
#  index_index_expenses_on_date         (date)
#  index_index_expenses_on_driver_id    (driver_id)
#  index_index_expenses_on_driver_id_and_date (driver_id, date)
#  index_index_expenses_on_vehicle_id   (vehicle_id)
#  index_index_expenses_on_vehicle_id_and_date (vehicle_id, date)
#
# Foreign Keys
#
#  fk_rails_...  (driver_id => drivers.id)
#  fk_rails_...  (vehicle_id => vehicles.id)
#

class Expense < ApplicationRecord
  belongs_to :driver, optional: true
  belongs_to :vehicle, optional: true

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :category, presence: true
  validates :date, presence: true
  validate :driver_or_vehicle_present

  private

  def driver_or_vehicle_present
    unless driver_id.present? || vehicle_id.present?
      errors.add(:base, "Either driver or vehicle must be present")
    end
  end
end
