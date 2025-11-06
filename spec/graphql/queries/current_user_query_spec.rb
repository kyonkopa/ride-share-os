# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Queries::CurrentUserQuery do
  let(:user) { create(:user, :confirmed) }

  let(:query) do
    <<~GQL
      query CurrentUser {
        currentUser {
          id
          globalId
          email
          firstName
          lastName
          fullName
        }
      }
    GQL
  end

  let(:context) { { current_user: user } }

  describe 'when user is authenticated' do
    it 'returns the current user' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .and_return({
          currentUser: {
            id: user.global_id,
            globalId: user.global_id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            fullName: user.full_name
          }
        }.with_indifferent_access)
    end
  end

  describe 'when user is not authenticated' do
    let(:context) { {} }

    it 'returns nil' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .and_return({
          currentUser: nil
        }.with_indifferent_access)
    end
  end
end
