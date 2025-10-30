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

# frozen_string_literal: true

FactoryBot.define do
  factory :shift_event do
    shift_assignment
    event_type { :clock_in }
    odometer { Faker::Number.between(from: 1000, to: 200000) }
    vehicle_range { Faker::Number.between(from: 100, to: 500) }
    gps_lat { Faker::Address.latitude }
    gps_lon { Faker::Address.longitude }
    notes { Faker::Lorem.sentence }

    trait :clock_in do
      event_type { :clock_in }
    end

    trait :clock_out do
      event_type { :clock_out }
    end

    trait :telemetry_snapshot do
      event_type { :telemetry_snapshot }
    end

    trait :with_gps do
      gps_lat { 5.6037 } # Accra coordinates
      gps_lon { -0.1870 }
    end

    trait :without_gps do
      gps_lat { nil }
      gps_lon { nil }
    end
  end
end
