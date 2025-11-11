# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Permission do
  subject { build(:permission) }

  describe 'associations' do
    it { is_expected.to have_many(:user_permissions).dependent(:destroy) }
    it { is_expected.to have_many(:users).through(:user_permissions) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:slug) }
    it { is_expected.to validate_uniqueness_of(:slug) }
  end
end
