module Queries
  class CurrentUserQuery < BaseQuery
    description "Get the current authenticated user"

    type Types::UserType, null: true

    def resolve
      current_user
    end
  end
end
