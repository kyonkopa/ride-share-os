# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UserService do
  describe '.create_user' do
    let(:user_attributes) do
      {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      }
    end

    context 'with valid attributes' do
      it 'creates a user successfully' do
        result = described_class.create_user(user_attributes)

        expect(result[:user]).to be_persisted
        expect(result[:user].email).to eq('test@example.com')
        expect(result[:user].first_name).to eq('John')
        expect(result[:user].last_name).to eq('Doe')
        expect(result[:password]).to be_present
        expect(result[:password].length).to be >= 12
      end

      it 'generates a secure password' do
        result = described_class.create_user(user_attributes)

        expect(result[:password]).to match(/[A-Z]/) # Contains uppercase
        expect(result[:password]).to match(/[a-z]/) # Contains lowercase
        expect(result[:password]).to match(/[0-9]/) # Contains numbers
        expect(result[:password]).to match(/[!@#]/) # Contains special characters
      end

      it 'confirms the user automatically' do
        result = described_class.create_user(user_attributes)

        expect(result[:user].confirmed?).to be true
      end
    end

    context 'with invalid attributes' do
      it 'raises an error when email is missing' do
        expect {
          described_class.create_user(first_name: 'John', last_name: 'Doe')
        }.to raise_error(StandardError, /Failed to create user/)
      end

      it 'raises an error when first_name is missing' do
        expect {
          described_class.create_user(email: 'test@example.com', last_name: 'Doe')
        }.to raise_error(StandardError, /Failed to create user/)
      end

      it 'raises an error when last_name is missing' do
        expect {
          described_class.create_user(email: 'test@example.com', first_name: 'John')
        }.to raise_error(StandardError, /Failed to create user/)
      end

      it 'raises an error when email is not unique' do
        create(:user, email: 'test@example.com')

        expect {
          described_class.create_user(user_attributes)
        }.to raise_error(StandardError, /Failed to create user/)
      end
    end
  end

  describe '.delete_user' do
    let(:user) { create(:user) }

    context 'with a valid user' do
      it 'soft deletes the user successfully' do
        result = described_class.delete_user(user)

        expect(result).to be true
        expect(user.reload.deleted_at).to be_present
        expect(user.soft_deleted?).to be true
      end

      it 'sets deleted_at timestamp' do
        travel_to Time.zone.parse('2023-01-01 12:00:00') do
          described_class.delete_user(user)

          expect(user.reload.deleted_at).to eq(Time.current)
        end
      end
    end

    context 'with an invalid user' do
      it 'returns false for nil user' do
        result = described_class.delete_user(nil)

        expect(result).to be false
      end

      it 'returns false for non-persisted user' do
        user = build(:user)
        result = described_class.delete_user(user)

        expect(result).to be false
      end
    end
  end

  describe '.create_user_with_driver' do
    let(:attributes) do
      {
        # User attributes
        email: 'driver@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        # Driver attributes
        full_name: 'Jane Smith',
        dob: Date.new(1990, 5, 15),
        phone_number: '+233123456789',
        verified: false
      }
    end

    context 'with valid attributes' do
      it 'creates both user and driver successfully' do
        result = described_class.create_user_with_driver(attributes)

        expect(result[:user]).to be_persisted
        expect(result[:driver]).to be_persisted
        expect(result[:password]).to be_present

        expect(result[:user].email).to eq('driver@example.com')
        expect(result[:user].first_name).to eq('Jane')
        expect(result[:user].last_name).to eq('Smith')

        expect(result[:driver].full_name).to eq('Jane Smith')
        expect(result[:driver].dob).to eq(Date.new(1990, 5, 15))
        expect(result[:driver].email).to eq('driver@example.com') # Delegated to user
        expect(result[:driver].phone_number).to eq('+233123456789')
        expect(result[:driver].verified).to be false
        expect(result[:driver].user).to eq(result[:user])
      end

      it 'uses user full_name as default driver full_name' do
        attrs = attributes.except(:full_name)
        result = described_class.create_user_with_driver(attrs)

        expect(result[:driver].full_name).to eq('Jane Smith')
      end

      it 'delegates driver email to user email' do
        # Test that driver email is delegated to user email
        result = described_class.create_user_with_driver(attributes)

        expect(result[:user].email).to eq('driver@example.com')
        expect(result[:driver].email).to eq('driver@example.com')
        expect(result[:driver].email).to eq(result[:user].email)

        # Test that driver email is the same as user email
        expect(result[:driver].email).to eq(result[:user].email)
      end

      it 'sets verified to false by default' do
        attrs = attributes.except(:verified)
        result = described_class.create_user_with_driver(attrs)

        expect(result[:driver].verified).to be false
      end

      it 'confirms the user automatically' do
        result = described_class.create_user_with_driver(attributes)

        expect(result[:user].confirmed?).to be true
      end
    end

    context 'with invalid user attributes' do
      it 'raises an error and rolls back transaction' do
        expect {
          described_class.create_user_with_driver({})
        }.to raise_error(StandardError, /Failed to create user with driver/)

        expect(User.count).to eq(0)
        expect(Driver.count).to eq(0)
      end
    end

    context 'with invalid driver attributes' do
      it 'raises an error and rolls back transaction' do
        invalid_attrs = {
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User'
          # Missing required driver attributes like dob and phone_number
        }

        expect {
          described_class.create_user_with_driver(invalid_attrs)
        }.to raise_error(StandardError, /Failed to create user with driver/)

        expect(User.count).to eq(0)
        expect(Driver.count).to eq(0)
      end
    end
  end

  describe '.create_driver' do
    let(:user) { create(:user, first_name: 'John', last_name: 'Doe') }
    let(:driver_attributes) do
      {
        dob: Date.new(1985, 3, 15),
        phone_number: '+233123456789'
      }
    end

    context 'with valid attributes' do
      it 'creates a driver successfully' do
        driver = UserService.create_driver(
          dob: driver_attributes[:dob],
          phone_number: driver_attributes[:phone_number],
          user: user
        )

        expect(driver).to be_persisted
        expect(driver.full_name).to eq('John Doe')
        expect(driver.dob).to eq(Date.new(1985, 3, 15))
        expect(driver.phone_number).to eq('+233123456789')
        expect(driver.user).to eq(user)
        expect(driver.verified).to be false
      end

      it 'uses user full_name as driver full_name' do
        driver = UserService.create_driver(
          dob: driver_attributes[:dob],
          phone_number: driver_attributes[:phone_number],
          user: user
        )

        expect(driver.full_name).to eq('John Doe')
      end

      it 'sets verified to false by default' do
        driver = UserService.create_driver(
          dob: driver_attributes[:dob],
          phone_number: driver_attributes[:phone_number],
          user: user
        )

        expect(driver.verified).to be false
      end
    end

    context 'with invalid attributes' do
      it 'raises an error when phone_number is missing' do
        expect {
          UserService.create_driver(
            dob: driver_attributes[:dob],
            phone_number: nil,
            user: user
          )
        }.to raise_error(StandardError, /Failed to create driver/)
      end

      it 'raises an error when dob is missing' do
        expect {
          UserService.create_driver(
            dob: nil,
            phone_number: driver_attributes[:phone_number],
            user: user
          )
        }.to raise_error(StandardError, /Failed to create driver/)
      end

      it 'raises an error when user is missing' do
        expect {
          UserService.create_driver(
            dob: driver_attributes[:dob],
            phone_number: driver_attributes[:phone_number],
            user: nil
          )
        }.to raise_error(NoMethodError, /undefined method `full_name' for nil:NilClass/)
      end

      it 'raises an error when phone_number is not unique' do
        existing_driver = create(:driver, phone_number: '+233123456789')
        
        expect {
          UserService.create_driver(
            dob: driver_attributes[:dob],
            phone_number: '+233123456789',
            user: user
          )
        }.to raise_error(StandardError, 'Driver already exists')
      end
    end

    context 'with duplicate phone number check' do
      it 'raises an error when driver already exists with same phone number' do
        create(:driver, phone_number: '+233123456789')
        
        expect {
          UserService.create_driver(
            dob: driver_attributes[:dob],
            phone_number: '+233123456789',
            user: user
          )
        }.to raise_error(StandardError, 'Driver already exists')
      end
    end

    context 'with different users' do
      let(:another_user) { create(:user, first_name: 'Jane', last_name: 'Smith') }

      it 'prevents creating drivers with duplicate phone numbers' do
        # Create first driver
        driver1 = UserService.create_driver(
          dob: driver_attributes[:dob],
          phone_number: '+233123456789',
          user: user
        )

        # This should fail because phone_number must be unique across all drivers
        expect {
          UserService.create_driver(
            dob: driver_attributes[:dob],
            phone_number: '+233123456789',
            user: another_user
          )
        }.to raise_error(StandardError, 'Driver already exists')
      end
    end
  end

  describe '.restore_user' do
    let(:user) { create(:user) }

    context 'with a soft-deleted user' do
      before { user.soft_delete! }

      it 'restores the user successfully' do
        result = described_class.restore_user(user)

        expect(result).to be true
        expect(user.reload.deleted_at).to be_nil
        expect(user.soft_deleted?).to be false
      end
    end

    context 'with an active user' do
      it 'returns false for non-deleted user' do
        result = described_class.restore_user(user)

        expect(result).to be false
      end
    end

    context 'with an invalid user' do
      it 'returns false for nil user' do
        result = described_class.restore_user(nil)

        expect(result).to be false
      end
    end
  end

  describe '.find_all_users_including_deleted' do
    let!(:active_user) { create(:user) }
    let!(:deleted_user) { create(:user).tap(&:soft_delete!) }

    it 'returns all users including deleted ones' do
      users = described_class.find_all_users_including_deleted

      expect(users.count).to eq(2)
      expect(users).to include(active_user, deleted_user)
    end
  end

  describe '.find_active_users' do
    let!(:active_user) { create(:user) }
    let!(:deleted_user) { create(:user).tap(&:soft_delete!) }

    it 'returns only active users' do
      users = described_class.find_active_users

      expect(users.count).to eq(1)
      expect(users).to include(active_user)
      expect(users).not_to include(deleted_user)
    end
  end

  describe 'soft delete integration' do
    let(:user) { create(:user) }

    it 'excludes soft-deleted users from default queries' do
      user.soft_delete!

      expect(User.find_by(id: user.id)).to be_nil
      expect(User.count).to eq(0)
    end

    it 'includes soft-deleted users when using unscoped' do
      user.soft_delete!

      expect(User.unscoped.find_by(id: user.id)).to eq(user)
      expect(User.unscoped.count).to eq(1)
    end

    it 'can find soft-deleted users using deleted scope' do
      user.soft_delete!

      expect(User.unscoped.deleted.count).to eq(1)
      expect(User.unscoped.deleted.first).to eq(user)
    end

    it 'can find active users using active scope' do
      # Create a fresh user for this test
      active_user = create(:user)
      deleted_user = create(:user).tap(&:soft_delete!)

      # Since we have a default scope, active scope should only return non-deleted users
      expect(User.active.count).to eq(1)
      expect(User.active.first).to eq(active_user)
      expect(User.active).not_to include(deleted_user)

      # Verify the deleted user is not in active scope
      expect(User.active.where(id: deleted_user.id)).to be_empty
    end
  end
end
