# frozen_string_literal: true

FactoryBot.define do
  factory :vehicle do
    make { Faker::Vehicle.make }
    license_plate { Faker::Vehicle.license_plate }
    model { Faker::Vehicle.model }
    year_of_manufacture { Faker::Vehicle.year }
    latest_odometer { Faker::Number.between(from: 1000, to: 200000) }
    latest_range { Faker::Number.between(from: 100, to: 500) }
    telematics_source { Vehicle.telematics_sources.keys.sample }

    trait :with_high_mileage do
      latest_odometer { Faker::Number.between(from: 150000, to: 300000) }
    end

    trait :with_low_mileage do
      latest_odometer { Faker::Number.between(from: 1000, to: 50000) }
    end
  end
end
