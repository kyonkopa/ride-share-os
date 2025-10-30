# frozen_string_literal: true

FactoryBot.define do
  factory :shift_assignment do
    city { :accra }
    driver
    vehicle
    start_time { 1.hour.from_now }
    end_time { 9.hours.from_now }
    status { :scheduled }

    trait :active do
      status { :active }
    end

    trait :completed do
      status { :completed }
    end

    trait :missed do
      status { :missed }
    end

    trait :in_kumasi do
      city { :kumasi }
    end

    trait :in_takoradi do
      city { :takoradi }
    end

    trait :with_recurrence do
      recurrence_rule { "FREQ=DAILY;INTERVAL=1" }
    end
  end
end
