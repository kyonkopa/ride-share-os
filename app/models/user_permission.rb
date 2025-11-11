# == Schema Information
#
# Table name: user_permissions
#
#  id            :integer         not null primary key
#  user_id       :integer         not null
#  permission_id :integer         not null
#  created_at    :datetime        not null
#  updated_at    :datetime        not null
#
# Indexes
#
#  index_user_permissions_on_permission_id                    (permission_id)
#  index_user_permissions_on_user_id                          (user_id)
#  index_user_permissions_on_user_id_and_permission_id        (user_id, permission_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (permission_id => permissions.id)
#  fk_rails_...  (user_id => users.id)
#
class UserPermission < ApplicationRecord
  belongs_to :user
  belongs_to :permission

  validates :user_id, uniqueness: { scope: :permission_id }
end

