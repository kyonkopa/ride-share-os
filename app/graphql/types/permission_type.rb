module Types
  class PermissionType < Types::BaseObject
    include Types::Concerns::BaseActiveRecordFields

    description "A permission in the system"

    field :name, String, null: false
    field :slug, Types::Enums::PermissionEnum, null: false
  end
end
