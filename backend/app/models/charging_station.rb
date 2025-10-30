# == Schema Information
#
# Table name: charging_stations
#
#  id                   :integer         not null primary key
#  name                 :string          not null
#  location_lat         :decimal         not null
#  location_lon         :decimal         not null
#  connectors           :json            not null default([])
#  status               :integer         not null default(0)
#  created_at           :datetime        not null
#  updated_at           :datetime        not null
#
# Indexes
#
#  index_index_charging_stations_on_location_lat_and_location_lon (location_lat, location_lon)
#  index_index_charging_stations_on_status (status)
#

class ChargingStation < ApplicationRecord
  enum :status, {
    available: 0,
    occupied: 1
  }

  validates :name, presence: true
  validates :location_lat, presence: true, numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 }
  validates :location_lon, presence: true, numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 }
  validates :status, presence: true
  validates :connectors, presence: true
end
