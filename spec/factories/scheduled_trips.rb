FactoryBot.define do
  factory :scheduled_trip do
    client_name { "John Doe" }
    client_email { "john@example.com" }
    client_phone { "1234567890" }
    pickup_location { "Location A" }
    dropoff_location { "Location B" }
    pickup_datetime { 2.days.from_now }
    recurrence_config { {} }
    state { "pending" }
    notes { nil }

    trait :confirmed do
      state { "confirmed" }
    end

    trait :accepted do
      state { "accepted" }
    end

    trait :declined do
      state { "declined" }
    end

    trait :auto_declined do
      state { "auto_declined" }
    end

    trait :recurring do
      recurrence_config { { frequency: "weekly", interval: 1 } }
    end
  end
end
