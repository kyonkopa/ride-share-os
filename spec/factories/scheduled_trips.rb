FactoryBot.define do
  factory :scheduled_trip do
    client_name { "MyString" }
    client_email { "MyString" }
    client_phone { "MyString" }
    pickup_location { "MyString" }
    dropoff_location { "MyString" }
    pickup_date { "2025-11-18" }
    pickup_time { "2025-11-18 17:02:06" }
    recurrence_config { "" }
    price { "9.99" }
    state { "MyString" }
    acceptance_token { "MyString" }
    decline_token { "MyString" }
    reviewed_by_id { "" }
    reviewed_at { "2025-11-18 17:02:06" }
    notes { "MyText" }
  end
end
