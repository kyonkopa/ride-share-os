# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Queries::VehiclesQuery do
  let(:user) { create(:user, :confirmed) }

  let(:query) do
    <<~GQL
      query Vehicles {
        vehicles {
          id
          globalId
          licensePlate
          make
          model
          yearOfManufacture
          latestOdometer
          latestRange
          telematicsSource
          displayName
        }
      }
    GQL
  end

  let(:context) { { current_user: user } }

  describe 'when vehicles exist' do
    let(:toyota_camry) { create(:vehicle, license_plate: "ABC-123", make: "Toyota", model: "Camry") }
    let(:honda_accord) { create(:vehicle, license_plate: "XYZ-789", make: "Honda", model: "Accord") }
    let(:ford_focus) { create(:vehicle, license_plate: "DEF-456", make: "Ford", model: "Focus") }

    before do
      toyota_camry
      honda_accord
      ford_focus
    end

    it 'returns all vehicles' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .with_effects do |vehicles, _full_result|
          expect(vehicles.length).to eq(3)
          expect(vehicles.map { |v| v["id"] }).to contain_exactly(
            toyota_camry.global_id,
            honda_accord.global_id,
            ford_focus.global_id
          )
          expect(vehicles.find { |v| v["id"] == toyota_camry.global_id }).to include(
            "licensePlate" => "ABC-123",
            "make" => "Toyota",
            "model" => "Camry"
          )
          expect(vehicles.find { |v| v["id"] == honda_accord.global_id }).to include(
            "licensePlate" => "XYZ-789",
            "make" => "Honda",
            "model" => "Accord"
          )
          expect(vehicles.find { |v| v["id"] == ford_focus.global_id }).to include(
            "licensePlate" => "DEF-456",
            "make" => "Ford",
            "model" => "Focus"
          )
        end
    end
  end

  describe 'when no vehicles exist' do
    it 'returns an empty array' do
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_no_errors
        .and_return([])
    end
  end

  describe 'when user is not authenticated' do
    let(:context) { {} }

    it 'requires authentication' do
      vehicle = create(:vehicle)
      expect(query).to execute_as_graphql
        .with_context(context)
        .with_errors(["Authentication is required"])
    end
  end
end
