module Types
  module Inputs
    class CreateSessionInput < Types::BaseInputObject
      description "Input type for creating a new session"

      argument :email, String, required: true, description: "User's email address"
      argument :login_scope, Types::Enums::LoginScopeEnum, required: true, description: "Login scope - either 'user' or 'staff'"
      argument :password, String, required: true, description: "User's password"
    end
  end
end
