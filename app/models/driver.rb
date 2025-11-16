# == Schema Information
#
# Table name: drivers
#
#  id                   :integer         not null primary key
#  full_name            :string          not null
#  dob                  :date            not null
#  phone_number         :string          not null
#  verified             :boolean         not null default(false)
#  created_at           :datetime        not null
#  updated_at           :datetime        not null
#  user_id              :integer         not null
#  tier                 :string          not null default(tier_1)
#
# Indexes
#
#  index_index_drivers_on_phone_number  (phone_number) UNIQUE
#  index_index_drivers_on_user_id       (user_id)
#  index_index_drivers_on_verified      (verified)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#

class Driver < ApplicationRecord
  belongs_to :user
  has_many :shift_assignments, dependent: :destroy
  has_many :revenue_records, dependent: :destroy

  # Delegate email to user association
  delegate :email, to: :user

  validates :full_name, presence: true
  validates :dob, presence: true
  validates :phone_number, presence: true, uniqueness: true
  validates :verified, inclusion: { in: [true, false] }
end
