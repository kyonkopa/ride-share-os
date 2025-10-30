# frozen_string_literal: true

FactoryBot.define do
  factory :driver do
    full_name { Faker::Name.name }
    dob { Faker::Date.birthday(min_age: 18, max_age: 65) }
    phone_number { Faker::PhoneNumber.phone_number }
    verified { false }
    user

    trait :verified do
      verified { true }
    end

    trait :unverified do
      verified { false }
    end
  end
end
