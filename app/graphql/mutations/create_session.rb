# frozen_string_literal: true

module Mutations
  class CreateSession < Mutations::BaseMutation
    requires_auth false

    attr_reader :user

    description "Login a user/create a session"

    argument :input, Types::Inputs::CreateSessionInput, required: true, description: "Input for creating a new session"

    field :auth_token, Types::AuthTokenType, null: true
    field :user, Types::UserType, null: true

    def execute(**args)
      input = args[:input]
      @user = User.find_for_authentication(email: input[:email])

      if user.nil?
        error!("Invalid email or password", code: "INVALID_CREDENTIALS", field: "email")
      elsif !user.valid_password?(input[:password])
        return handle_failed_login
      end

      validate_login_scope(input[:login_scope])

      user.unlock_access!
      sign_in(user)

      # Generate JWT tokens
      tokens = JwtService.generate_tokens(user)

      {
        user:,
        auth_token: tokens
      }
    end

    private

    def validate_login_scope(login_scope)
      case login_scope
      when "staff"
        # For now, we'll allow all users to access staff scope
        # error!("Access denied.") unless user.can?(:staff)
      when "user"
        # For now, we'll allow all users to access user scope
        # error!("Access denied.") if user.can?(:staff)
      end
    end

    def handle_failed_login
      increment_failed_attempts
      return handle_locked_account if account_locked?

      error!("Invalid email or password.", code: "INVALID_CREDENTIALS", field: "email")
    end

    def increment_failed_attempts
      user.failed_attempts += 1
      user.save!
    end

    def account_locked?
      user.failed_attempts >= Devise.maximum_attempts
    end

    def handle_locked_account
      user.lock_access!
      Rails.logger.info "User #{user.id} locked after #{user.failed_attempts} failed attempts"

      error!(
        "Your account has been locked",
        code: "ACCOUNT_LOCKED",
        field: "email"
      )
    end

    def remaining_attempts_left
      Devise.maximum_attempts - user.failed_attempts
    end

    def nil_user
      { user: nil }
    end
  end
end
