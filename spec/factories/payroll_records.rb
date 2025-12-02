# frozen_string_literal: true

FactoryBot.define do
  factory :payroll_record do
    driver
    paid_by_user { association :user, :confirmed }
    amount_paid { 100.0 }
    period_start_date { Date.current.beginning_of_month }
    period_end_date { Date.current.end_of_month }
    paid_at { Time.current }
    notes { nil }
  end
end
