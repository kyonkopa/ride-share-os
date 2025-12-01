# frozen_string_literal: true

FactoryBot.define do
  factory :revenue_record do
    shift_assignment
    driver { shift_assignment.driver }
    total_revenue { 100.0 }
    total_profit { 80.0 }
    reconciled { false }
    source { :bolt }

    trait :reconciled do
      reconciled { true }
    end

    trait :uber do
      source { :uber }
    end
  end
end
