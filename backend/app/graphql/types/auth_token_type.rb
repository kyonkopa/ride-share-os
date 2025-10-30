module Types
  class AuthTokenType < Types::BaseObject
    description "Authentication tokens"

    field :access_token, String, null: false
    field :expires_in, Integer, null: false
    field :refresh_token, String, null: false
    field :token_type, String, null: false
  end
end
