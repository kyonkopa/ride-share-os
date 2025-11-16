# == Schema Information
#
# Table name: vehicles
#
#  id                   :integer         not null primary key
#  license_plate        :string          not null
#  model                :string          not null
#  year_of_manufacture  :integer         not null
#  latest_odometer      :integer         not null default(0)
#  latest_range         :integer         not null default(0)
#  telematics_source    :integer         not null
#  created_at           :datetime        not null
#  updated_at           :datetime        not null
#  make                 :string          not null
#  vehicle_image_path   :string
#
# Indexes
#
#  index_index_vehicles_on_license_plate (license_plate) UNIQUE
#  index_index_vehicles_on_telematics_source (telematics_source)
#

class Vehicle < ApplicationRecord
  enum :telematics_source, {
    manual: 0,
    gps_tracker: 1,
    obd_device: 2,
    mobile_app: 3
  }

  has_many :shift_assignments, dependent: :destroy
  has_many :expenses, dependent: :destroy

  validates :license_plate, presence: true, uniqueness: true
  validates :make, presence: true
  validates :model, presence: true
  validates :year_of_manufacture, presence: true, numericality: { greater_than: 1900, less_than_or_equal_to: Date.current.year + 1 }
  validates :latest_odometer, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :latest_range, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :telematics_source, presence: true

  def in_use?
    shift_assignments.active.any?
  end

  def display_name
    "#{make} #{model} #{license_plate}"
  end
end
