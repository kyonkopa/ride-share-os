# frozen_string_literal: true

FactoryBot.define do
  factory :expense do
    vehicle
    category { "fuel" }
    date { Date.today }
    amount { 5000 } # 50.00 in cents
    description { "Fuel expense" }

    trait :with_user do
      user
      vehicle { nil }
    end

    trait :maintenance do
      category { "maintenance" }
      description { "Maintenance expense" }
    end

    trait :other do
      category { "other" }
      description { "Other expense" }
    end
  end
end
