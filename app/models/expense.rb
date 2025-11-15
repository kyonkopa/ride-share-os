# == Schema Information
#
# Table name: expenses
#
#  id                   :integer         not null primary key
#  user_id              :integer
#  vehicle_id           :integer
#  category             :string          not null
#  date                 :date            not null
#  receipt_key          :string
#  created_at           :datetime        not null
#  updated_at           :datetime        not null
#  amount               :integer         not null
#  description          :string
#
# Indexes
#
#  index_index_expenses_on_category     (category)
#  index_index_expenses_on_date         (date)
#  index_index_expenses_on_user_id      (user_id)
#  index_index_expenses_on_user_id_and_date (user_id, date)
#  index_index_expenses_on_vehicle_id   (vehicle_id)
#  index_index_expenses_on_vehicle_id_and_date (vehicle_id, date)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#  fk_rails_...  (vehicle_id => vehicles.id)
#

class Expense < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :vehicle, optional: true

  validates :amount, presence: true, numericality: { greater_than: 0, only_integer: true }
  validates :category, presence: true
  validates :date, presence: true
  validates :description, presence: true, if: -> { category == "other" }
  validate :user_or_vehicle_present

  # validate uniqueness of category and date for a given vehicle
  validate :unique_category_and_date_for_vehicle

  def unique_category_and_date_for_vehicle
    if vehicle_id.present? && Expense.exists?(category:, date:, vehicle_id:)
      errors.add(:base, "An expense with this category and date already exists for this vehicle")
    end
  end

  # Convert amount from dollars (Float) to cents (Integer) when setting
  def amount=(value)
    if value.is_a?(Float) || value.is_a?(BigDecimal)
      super((value * 100).round.to_i)
    else
      super(value)
    end
  end

  # Convert amount from cents (Integer) to dollars (Float) when reading
  def amount_in_decimal
    return nil if amount.nil?
    amount / 100.0
  end

  private

  def user_or_vehicle_present
    unless user_id.present? || vehicle_id.present?
      errors.add(:base, "Either user or vehicle must be present")
    end
  end
end
