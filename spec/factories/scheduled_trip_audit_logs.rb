FactoryBot.define do
  factory :scheduled_trip_audit_log do
    scheduled_trip_id { "" }
    previous_state { "MyString" }
    new_state { "MyString" }
    changed_by_id { "" }
    change_reason { "MyString" }
    metadata { "" }
  end
end
