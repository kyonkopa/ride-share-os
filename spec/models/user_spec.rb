# frozen_string_literal: true

require 'rails_helper'

RSpec.describe User do
  # Subject for uniqueness validation
  subject { build(:user) }

  describe 'validations' do
    it { is_expected.to validate_presence_of(:first_name) }
    it { is_expected.to validate_presence_of(:last_name) }
    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:email).case_insensitive }
  end


  describe 'associations' do
    it { is_expected.to have_one(:driver).dependent(:destroy) }
  end

  describe 'devise modules' do
    it 'includes required devise modules' do
      expect(described_class.devise_modules).to include(:database_authenticatable)
      expect(described_class.devise_modules).to include(:registerable)
      expect(described_class.devise_modules).to include(:recoverable)
      expect(described_class.devise_modules).to include(:rememberable)
      expect(described_class.devise_modules).to include(:validatable)
      expect(described_class.devise_modules).to include(:confirmable)
      expect(described_class.devise_modules).to include(:lockable)
      expect(described_class.devise_modules).to include(:trackable)
    end
  end

  describe '#full_name' do
    let(:user) { build(:user, first_name: 'John', last_name: 'Doe') }

    it 'returns the full name' do
      expect(user.full_name).to eq('John Doe')
    end
  end

  describe '#update_sign_in_info!' do
    let(:user) { create(:user, sign_in_count: 5) }

    it 'updates sign in information' do
      expect { user.update_sign_in_info! }
        .to change(user, :sign_in_count).by(1)
        .and change(user, :last_sign_in_at)
    end
  end

  describe 'automatic confirmation' do
    it 'confirms user after creation' do
      user = create(:user)
      expect(user.confirmed?).to be true
    end
  end
end
