# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::CreateSession, type: :request do
  let(:user) { create(:user, :confirmed, email: 'test@example.com', password: 'password123') }
  let(:mutation) do
    <<~GQL
      mutation CreateSession($input: CreateSessionInput!) {
        createSession(input: $input) {
          user {
            id
            email
            firstName
            lastName
          }
          authToken {
            accessToken
            refreshToken
          }
        }
      }
    GQL
  end

  let(:variables) do
    {
      input: {
        email: user.email,
        password: 'password123',
        loginScope: 'user'
      }
    }
  end

  describe 'successful authentication' do
    it 'creates a session and returns user data with tokens' do
      expect(mutation).to execute_as_graphql
        .with_variables(variables)
        .with_no_errors
        .and_return({
          user: {
            id: user.global_id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name
          },
          authToken: {
            accessToken: match(/\A[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\z/),
            refreshToken: match(/\A[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\z/)
          }
        }.with_indifferent_access)
    end
  end

  describe 'failed authentication' do
    context 'with invalid email' do
      let(:variables) do
        {
          input: {
            email: 'nonexistent@example.com',
            password: 'password123',
            loginScope: 'user'
          }
        }
      end

      it 'returns an error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_mutation_error(['Invalid email or password'])
      end
    end

    context 'with invalid password' do
      let(:variables) do
        {
          input: {
            email: user.email,
            password: 'wrongpassword',
            loginScope: 'user'
          }
        }
      end

      it 'returns an error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_mutation_error(['Invalid email or password'])
      end
    end
  end

  describe 'account locking' do
    let(:user) { create(:user, :confirmed, email: 'test@example.com', password: 'password123', failed_attempts: 4) }

    context 'when maximum attempts reached' do
      let(:variables) do
        {
          input: {
            email: user.email,
            password: 'wrongpassword',
            loginScope: 'user'
          }
        }
      end

      it 'locks the account' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_mutation_error(['Your account has been locked'])
          .with_effects do
            expect(user.reload.locked?).to be true
          end
      end
    end
  end

  describe 'login scope validation' do
    context 'with staff scope' do
      let(:variables) do
        {
          input: {
            email: user.email,
            password: 'password123',
            loginScope: 'staff'
          }
        }
      end

      it 'allows staff login' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_no_errors
          .and_return({
          user: {
            id: user.global_id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name
          },
          authToken: {
            accessToken: match(/\A[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\z/),
            refreshToken: match(/\A[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\z/)
          }
        }.with_indifferent_access)
      end
    end
  end
end
