# == Schema Information
#
# Table name: payroll_records
#
#  id                   :integer         not null primary key
#  driver_id            :integer         not null
#  paid_by_user_id      :integer         not null
#  amount_paid          :decimal         not null
#  period_start_date    :date            not null
#  period_end_date      :date            not null
#  paid_at              :datetime        not null
#  notes                :text           
#  created_at           :datetime        not null
#  updated_at           :datetime        not null
#
# Indexes
#
#  index_index_payroll_records_on_driver_and_period (driver_id, period_start_date, period_end_date)
#  index_index_payroll_records_on_driver_id (driver_id)
#  index_index_payroll_records_on_paid_at (paid_at)
#  index_index_payroll_records_on_paid_by_user_id (paid_by_user_id)
#
# Foreign Keys
#
#  fk_rails_...  (paid_by_user_id => users.id)
#  fk_rails_...  (driver_id => drivers.id)
#

class PayrollRecord < ApplicationRecord
  belongs_to :driver
  belongs_to :paid_by_user, class_name: "User"

  validates :amount_paid, presence: true, numericality: { greater_than: 0 }
  validates :period_start_date, presence: true
  validates :period_end_date, presence: true
  validates :paid_at, presence: true
  validate :period_end_date_after_start_date
  validate :total_amount_paid_not_exceeding_amount_due

  private

  def period_end_date_after_start_date
    return unless period_start_date.present? && period_end_date.present?

    if period_end_date < period_start_date
      errors.add(:period_end_date, "must be after or equal to period start date")
    end
  end

  def total_amount_paid_not_exceeding_amount_due
    return unless driver_id.present? && period_start_date.present? && period_end_date.present? && amount_paid.present?

    payroll_data = PayrollService.calculate_driver_payroll(
      driver:,
      start_date: period_start_date,
      end_date: period_end_date
    )
    amount_due = payroll_data[:amount_due]

    # Calculate total amount already paid for this period (excluding this record if it's being updated)
    existing_payments = PayrollRecord.where(
      driver_id:,
      period_start_date:,
      period_end_date:
    ).where.not(id: id || 0).sum(:amount_paid)

    total_amount_paid = existing_payments + amount_paid

    if total_amount_paid > amount_due
      errors.add(:amount_paid, "would cause total payments (#{total_amount_paid}) to exceed the amount due (#{amount_due})")
    end
  end
end
