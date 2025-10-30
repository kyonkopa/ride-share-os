# frozen_string_literal: true

class UserService
  class << self
    # Create a new user with minimum required attributes
    # @param attributes [Hash] User attributes (email, first_name, last_name)
    # @return [Hash] Hash containing user and generated password
    def create_user(attributes = {})
      password = generate_password

      user_attributes = {
        email: attributes[:email],
        first_name: attributes[:first_name],
        last_name: attributes[:last_name],
        password:,
        password_confirmation: password
      }

      user = User.create!(user_attributes)

      {
        user:,
        password:
      }
    rescue ActiveRecord::RecordInvalid => e
      raise StandardError, "Failed to create user: #{e.message}"
    end

    # Soft delete a user by setting deleted_at timestamp
    # @param user [User] User instance to delete
    # @return [Boolean] Success status
    def delete_user(user)
      return false unless user&.persisted?

      user.update!(deleted_at: Time.current)
      true
    rescue ActiveRecord::RecordInvalid => e
      raise StandardError, "Failed to delete user: #{e.message}"
    end

    # Create a user with an associated driver record
    # @param attributes [Hash] Combined user and driver attributes
    #   User attributes: email, first_name, last_name
    #   Driver attributes: full_name, dob, phone_number, verified
    # @return [Hash] Hash containing user, driver, and generated password
    def create_user_with_driver(attributes = {})
      raise StandardError, "User already exists" if User.exists?(email: attributes[:email])

      password = generate_password

      ActiveRecord::Base.transaction do
        # Create user
        user = User.create!(
          email: attributes[:email],
          first_name: attributes[:first_name],
          last_name: attributes[:last_name],
          password:,
          password_confirmation: password
        )

        # Create associated driver
        driver = Driver.create!(
          user:,
          full_name: attributes[:full_name] || user.full_name,
          dob: attributes[:dob],
          phone_number: attributes[:phone_number],
          verified: attributes[:verified] || false
        )

        {
          user:,
          driver:,
          password:
        }
      end
    rescue ActiveRecord::RecordInvalid => e
      raise StandardError, "Failed to create user with driver: #{e.message}"
    end

    # Creates a new Driver associated with the given User.
    #
    # @param dob [Date] The date of birth of the driver.
    # @param phone_number [String] The phone number for the driver (must be unique).
    # @param user [User] The user to associate with the driver.
    # @return [Driver] The newly created Driver record.
    # @raise [StandardError] If a driver with the given phone number already exists or creation fails.
    def create_driver(dob:, phone_number:, user:)
      raise StandardError, "Driver already exists" if Driver.exists?(phone_number:)

      Driver.create!(
        full_name: user.full_name,
        dob:,
        phone_number:,
        user:
      )
    rescue ActiveRecord::RecordInvalid => e
      raise StandardError, "Failed to create driver: #{e.message}"
    end

    # Restore a soft-deleted user
    # @param user [User] User instance to restore
    # @return [Boolean] Success status
    def restore_user(user)
      return false unless user&.deleted_at

      user.update!(deleted_at: nil)
      true
    rescue ActiveRecord::RecordInvalid => e
      raise StandardError, "Failed to restore user: #{e.message}"
    end

    # Find users including soft-deleted ones
    # @return [ActiveRecord::Relation] Users including deleted
    def find_all_users_including_deleted
      User.unscoped
    end

    # Find only active (non-deleted) users
    # @return [ActiveRecord::Relation] Active users only
    def find_active_users
      User.where(deleted_at: nil)
    end

    private

    # Generate a secure random password
    # @return [String] Generated password
    def generate_password
      # Generate a secure password with mixed case, numbers, and special characters
      # Use alphanumeric for base, then add numbers and special chars
      base = SecureRandom.alphanumeric(8)
      numbers = SecureRandom.random_number(1000).to_s
      special_chars = "!@#"

      base + numbers + special_chars
    end
  end
end
