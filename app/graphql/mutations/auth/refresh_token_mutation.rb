module Mutations
  module Auth
    class RefreshTokenMutation < BaseMutation
      description "Refresh authentication tokens"

      argument :refresh_token, String, required: true, description: "Refresh token"

      field :errors, [Types::ErrorType], null: false
      field :tokens, Types::AuthTokenType, null: true

      def resolve(refresh_token:)
        begin
          tokens = JwtService.refresh_token(refresh_token)

          {
            tokens:,
            errors: []
          }
        rescue ExceptionHandler::InvalidToken => e
          {
            tokens: nil,
            errors: [{ message: e.message }]
          }
        end
      end
    end
  end
end
