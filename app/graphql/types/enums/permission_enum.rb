# frozen_string_literal: true

module Types
  module Enums
    class PermissionEnum < Types::BaseEnum
      description "The possible permissions in the system"

      # Dynamically generate enum values from permissions.json
      permissions_data = JSON.parse(File.read(Rails.root.join("db/data/permissions.json")))

      permissions_data.each do |permission_data|
        slug = permission_data["slug"]
        name = permission_data["name"]

        value slug, value: slug, description: name
      end
    end
  end
end
