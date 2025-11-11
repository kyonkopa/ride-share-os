module Types
  class PermissionType < Types::BaseObject
    include Types::Concerns::BaseActiveRecordFields

    description "A permission in the system"

    field :name, String, null: false
    field :slug, String, null: false
  end
end
