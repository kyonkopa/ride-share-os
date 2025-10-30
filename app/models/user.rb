# == Schema Information
#
# Table name: users
#
#  id                   :integer         not null primary key
#  email                :string          not null
#  first_name           :string          not null
#  last_name            :string          not null
#  last_sign_in_at      :datetime       
#  sign_in_count        :integer         not null default(0)
#  created_at           :datetime        not null
#  updated_at           :datetime        not null
#  encrypted_password   :string          not null default()
#  reset_password_token :string         
#  reset_password_sent_at :datetime       
#  remember_created_at  :datetime       
#  current_sign_in_at   :datetime       
#  current_sign_in_ip   :string         
#  last_sign_in_ip      :string         
#  confirmation_token   :string         
#  confirmed_at         :datetime       
#  confirmation_sent_at :datetime       
#  unconfirmed_email    :string         
#  failed_attempts      :integer         not null default(0)
#  unlock_token         :string         
#  locked_at            :datetime       
#  deleted_at           :datetime       
#
# Indexes
#
#  index_index_users_on_confirmation_token (confirmation_token) UNIQUE
#  index_index_users_on_deleted_at      (deleted_at)
#  index_index_users_on_email           (email) UNIQUE
#  index_index_users_on_reset_password_token (reset_password_token) UNIQUE
#  index_index_users_on_unlock_token    (unlock_token) UNIQUE
#

class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable, :lockable, :trackable

  validates :first_name, presence: true
  validates :last_name, presence: true

  has_one :driver, dependent: :destroy

  scope :active, -> { where(deleted_at: nil) }
  scope :deleted, -> { where.not(deleted_at: nil) }
  scope :recently_signed_in, -> { where("last_sign_in_at > ?", 1.week.ago) }

  # Default scope to exclude soft-deleted users
  default_scope { where(deleted_at: nil) }

  # Automatically confirm users when they are created
  after_create :confirm_user

  def full_name
    "#{first_name} #{last_name}".strip
  end

  def update_sign_in_info!
    update!(
      last_sign_in_at: Time.current,
      sign_in_count: sign_in_count + 1
    )
  end

  def soft_delete!
    update!(deleted_at: Time.current)
  end

  def soft_deleted?
    deleted_at.present?
  end

  def restore!
    update!(deleted_at: nil)
  end

  private

  def confirm_user
    confirm
  end
end
