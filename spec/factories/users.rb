# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    email { Faker::Internet.email }
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    password { 'password123' }
    password_confirmation { 'password123' }

    transient do
      can { nil }
    end

    after(:create) do |user, evaluator|
      if evaluator.can.present?
        permission = Permission.find_or_create_by!(slug: evaluator.can) do |p|
          p.name = evaluator.can.humanize
        end
        user.permissions << permission unless user.permissions.include?(permission)
      end
    end

    trait :confirmed do
      after(:create) do |user|
        user.confirm
      end
    end

    trait :unconfirmed do
      # User remains unconfirmed (default behavior)
    end

    trait :locked do
      after(:create) do |user|
        user.lock_access!
      end
    end

    trait :with_driver do
      after(:create) do |user|
        create(:driver, user:)
      end
    end
  end
end
