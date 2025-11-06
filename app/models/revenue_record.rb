# == Schema Information
#
# Table name: revenue_records
#
#  id                   :integer         not null primary key
#  shift_assignment_id  :integer         not null
#  driver_id            :integer         not null
#  total_revenue        :decimal         not null default(0.0)
#  total_profit         :decimal         not null default(0.0)
#  reconciled           :boolean         not null default(false)
#  created_at           :datetime        not null
#  updated_at           :datetime        not null
#  source               :integer         not null default(0)
#
# Indexes
#
#  index_index_revenue_records_on_driver_id (driver_id)
#  index_index_revenue_records_on_driver_id_and_created_at (driver_id, created_at)
#  index_index_revenue_records_on_reconciled (reconciled)
#  index_index_revenue_records_on_shift_assignment_id (shift_assignment_id)
#  index_index_revenue_records_on_source (source)
#
# Foreign Keys
#
#  fk_rails_...  (shift_assignment_id => shift_assignments.id)
#  fk_rails_...  (driver_id => drivers.id)
#

class RevenueRecord < ApplicationRecord
  belongs_to :shift_assignment
  belongs_to :driver

  attribute :source, :integer, default: 0

  enum :source, {
    bolt: 0,
    uber: 1
  }

  validates :total_revenue, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :total_profit, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :reconciled, inclusion: { in: [true, false] }
  validates :source, presence: true
end
