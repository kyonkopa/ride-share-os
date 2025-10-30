# frozen_string_literal: true

# rubocop:disable GraphQL/ObjectDescription
module Authenticatable
  extend ActiveSupport::Concern

  class_methods do
    def requires_auth(required = true)
      @requires_auth = required
    end

    def requires_auth?
      @requires_auth.nil? ? true : @requires_auth
    end
  end

  def current_user
    @current_user ||= context[:current_user]
  end

  def sign_in(user)
    user.update_sign_in_info!
    context[:current_user] = user
  end

  def sign_out
    context[:current_user] = nil
  end

  def signed_in?
    current_user.present?
  end

  private

  included do
    def ready?(**args)
      if self.class.requires_auth? && !signed_in?
        raise UnAuthenticatedError, "Authentication is required"
      end

      true
    end
  end

  class UnAuthenticatedError < GraphQL::ExecutionError
    def to_h
      super.merge("extensions" => { "code" => "UNAUTHENTICATED" })
    end
  end
end
# rubocop:enable GraphQL/ObjectDescription
