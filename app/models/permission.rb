# == Schema Information
#
# Table name: permissions
#
#  id                   :integer         not null primary key
#  name                 :string          not null
#  slug                 :string          not null
#  created_at           :datetime        not null
#  updated_at           :datetime        not null
#
# Indexes
#
#  index_index_permissions_on_slug      (slug) UNIQUE
#
class Permission < ApplicationRecord
  has_many :user_permissions, dependent: :destroy
  has_many :users, through: :user_permissions

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
end
