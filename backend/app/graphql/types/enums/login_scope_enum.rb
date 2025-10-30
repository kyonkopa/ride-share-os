# frozen_string_literal: true

module Types
  module Enums
    class LoginScopeEnum < Types::BaseEnum
      description "The possible login scopes for authentication"

      value "user", value: "user", description: "Regular user login scope"
      value "staff", value: "staff", description: "Staff login scope"
    end
  end
end
