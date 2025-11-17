# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mutations::UpdateVehicle do
  let(:user) { create(:user, :confirmed) }
  let(:vehicle) { create(:vehicle) }

  let(:mutation) do
    <<~GQL
      mutation UpdateVehicle($input: UpdateVehicleInput!, $vehicleId: ID!) {
        updateVehicle(input: $input, vehicleId: $vehicleId) {
          vehicle {
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
          errors {
            message
            field
            code
          }
        }
      }
    GQL
  end

  let(:variables) do
    {
      input: {
        licensePlate: "ABC-123",
        make: "Toyota",
        model: "Camry",
        yearOfManufacture: 2020,
        latestOdometer: 50000,
        latestRange: 300,
        telematicsSource: 0
      },
      vehicleId: vehicle.global_id
    }
  end

  let(:context) { { current_user: user } }

  describe 'successful updates' do
    it 'updates all vehicle fields' do
      expect(mutation).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          vehicle: {
            id: vehicle.global_id,
            globalId: vehicle.global_id,
            licensePlate: "ABC-123",
            make: "Toyota",
            model: "Camry",
            yearOfManufacture: 2020,
            latestOdometer: 50000,
            latestRange: 300,
            telematicsSource: 0,
            displayName: "Toyota Camry ABC-123"
          },
          errors: []
        }.with_indifferent_access)
        .with_effects do
          vehicle.reload
          aggregate_failures do
            expect(vehicle.license_plate).to eq("ABC-123")
            expect(vehicle.make).to eq("Toyota")
            expect(vehicle.model).to eq("Camry")
            expect(vehicle.year_of_manufacture).to eq(2020)
            expect(vehicle.latest_odometer).to eq(50000)
            expect(vehicle.latest_range).to eq(300)
            expect(vehicle.telematics_source).to eq("manual")
          end
        end
    end

    it 'updates only specified fields (partial update)' do
      original_make = vehicle.make
      original_model = vehicle.model

      partial_variables = {
        input: {
          latestOdometer: 75000,
          latestRange: 250
        },
        vehicleId: vehicle.global_id
      }

      expect(mutation).to execute_as_graphql
        .with_variables(partial_variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          vehicle: {
            latestOdometer: 75000,
            latestRange: 250
          }
        }.with_indifferent_access)
        .with_effects do
          vehicle.reload
          expect(vehicle.latest_odometer).to eq(75000)
          expect(vehicle.latest_range).to eq(250)
          expect(vehicle.make).to eq(original_make)
          expect(vehicle.model).to eq(original_model)
        end
    end

    it 'updates telematics_source enum value' do
      # Start with a known value
      vehicle.update!(telematics_source: :manual)
      expect(vehicle.telematics_source).to eq("manual")

      enum_variables = {
        input: {
          telematicsSource: 1 # gps_tracker
        },
        vehicleId: vehicle.global_id
      }

      expect(mutation).to execute_as_graphql
        .with_variables(enum_variables)
        .with_context(context)
        .with_no_errors
        .with_effects do
          vehicle.reload
          expect(vehicle.telematics_source).to eq("gps_tracker")
        end
    end

    it 'updates single field' do
      single_field_variables = {
        input: {
          licensePlate: "XYZ-999"
        },
        vehicleId: vehicle.global_id
      }

      expect(mutation).to execute_as_graphql
        .with_variables(single_field_variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          vehicle: {
            licensePlate: "XYZ-999"
          }
        }.with_indifferent_access)
        .with_effects do
          vehicle.reload
          expect(vehicle.license_plate).to eq("XYZ-999")
        end
    end
  end

  describe 'error cases' do
    context 'when vehicle not found' do
      let(:invalid_variables) do
        {
          input: {
            licensePlate: "ABC-123"
          },
          vehicleId: "Vehicle:InvalidID123"
        }
      end

      it 'returns an error' do
        expect(mutation).to execute_as_graphql
          .with_variables(invalid_variables)
          .with_context(context)
          .with_errors(["An error occurred while fetching the record"])
      end
    end

    context 'when user is not authenticated' do
      let(:context) { {} }

      it 'returns an authentication error' do
        expect(mutation).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_errors(['Authentication is required'])
      end
    end

    context 'with validation errors' do
      context 'with duplicate license plate' do
        let(:existing_vehicle) { create(:vehicle, license_plate: "EXISTING-123") }
        let(:duplicate_variables) do
          {
            input: {
              licensePlate: "EXISTING-123"
            },
            vehicleId: vehicle.global_id
          }
        end

        it 'returns validation errors' do
          existing_vehicle # create the vehicle with duplicate license plate

          expect(mutation).to execute_as_graphql
            .with_variables(duplicate_variables)
            .with_context(context)
            .with_mutation_error([
              { "message" => "License plate has already been taken", "field" => "license_plate", "code" => "taken" }
            ])
        end
      end

      context 'when year is too old' do
        let(:invalid_year_variables) do
          {
            input: {
              yearOfManufacture: 1899
            },
            vehicleId: vehicle.global_id
          }
        end

        it 'returns validation errors' do
          expect(mutation).to execute_as_graphql
            .with_variables(invalid_year_variables)
            .with_context(context)
            .with_mutation_error([
              { "message" => "Year of manufacture must be greater than 1900", "field" => "year_of_manufacture", "code" => "greater_than" }
            ])
        end
      end

      context 'when year is in the future' do
        let(:future_year_variables) do
          {
            input: {
              yearOfManufacture: Date.current.year + 2
            },
            vehicleId: vehicle.global_id
          }
        end

        it 'returns validation errors' do
          expect(mutation).to execute_as_graphql
            .with_variables(future_year_variables)
            .with_context(context)
            .with_no_errors
            .with_mutation_error([
              { "field" => "year_of_manufacture", "message" => /Year of manufacture must be less than or equal to/, "code" => "less_than_or_equal_to" }
            ])
        end
      end

      context 'with negative odometer reading' do
        let(:negative_odometer_variables) do
          {
            input: {
              latestOdometer: -100
            },
            vehicleId: vehicle.global_id
          }
        end

        it 'returns validation errors' do
          expect(mutation).to execute_as_graphql
            .with_variables(negative_odometer_variables)
            .with_context(context)
            .with_mutation_error([
              { "message" => "Latest odometer must be greater than or equal to 0", "field" => "latest_odometer", "code" => "greater_than_or_equal_to" }
            ])
        end
      end

      context 'with negative vehicle range' do
        let(:negative_range_variables) do
          {
            input: {
              latestRange: -50
            },
            vehicleId: vehicle.global_id
          }
        end

        it 'returns validation errors' do
          expect(mutation).to execute_as_graphql
            .with_variables(negative_range_variables)
            .with_context(context)
            .with_mutation_error([
              { "message" => "Latest range must be greater than or equal to 0", "field" => "latest_range", "code" => "greater_than_or_equal_to" }
            ])
        end
      end

      context 'with empty license plate' do
        let(:empty_license_variables) do
          {
            input: {
              licensePlate: ""
            },
            vehicleId: vehicle.global_id
          }
        end

        it 'returns validation errors' do
          expect(mutation).to execute_as_graphql
            .with_variables(empty_license_variables)
            .with_context(context)
            .with_mutation_error([
              { "message" => "License plate can't be blank", "field" => "license_plate", "code" => "blank" }
            ])
        end
      end

      context 'with empty make' do
        let(:empty_make_variables) do
          {
            input: {
              make: ""
            },
            vehicleId: vehicle.global_id
          }
        end

        it 'returns validation errors' do
          expect(mutation).to execute_as_graphql
            .with_variables(empty_make_variables)
            .with_context(context)
            .with_mutation_error([
              { "message" => "Make can't be blank", "field" => "make", "code" => "blank" }
            ])
        end
      end

      context 'with empty model' do
        let(:empty_model_variables) do
          {
            input: {
              model: ""
            },
            vehicleId: vehicle.global_id
          }
        end

        it 'returns validation errors' do
          expect(mutation).to execute_as_graphql
            .with_variables(empty_model_variables)
            .with_context(context)
            .with_mutation_error([
              { "message" => "Model can't be blank", "field" => "model", "code" => "blank" }
            ])
        end
      end

      context 'with multiple validation errors' do
        let(:multiple_errors_variables) do
          {
            input: {
              latestOdometer: -100,
              latestRange: -50,
              yearOfManufacture: 1899
            },
            vehicleId: vehicle.global_id
          }
        end

        it 'returns all validation errors' do
          expect(mutation).to execute_as_graphql
            .with_variables(multiple_errors_variables)
            .with_context(context)
            .with_no_errors
            .with_mutation_error([
              { "field" => "latest_odometer", "message" => /Latest odometer must be greater than or equal to 0/, "code" => "greater_than_or_equal_to" },
              { "field" => "latest_range", "message" => /Latest range must be greater than or equal to 0/, "code" => "greater_than_or_equal_to" },
              { "field" => "year_of_manufacture", "message" => /Year of manufacture must be greater than 1900/, "code" => "greater_than" }
            ])
        end
      end
    end
  end

  describe 'edge cases' do
    it 'handles empty input gracefully' do
      empty_input_variables = {
        input: {},
        vehicleId: vehicle.global_id
      }

      # Empty input should not cause errors, vehicle should remain unchanged
      expect(mutation).to execute_as_graphql
        .with_variables(empty_input_variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          vehicle: {
            id: vehicle.global_id
          }
        }.with_indifferent_access)
        .with_effects do
          original_values = {
            make: vehicle.make,
            model: vehicle.model,
            license_plate: vehicle.license_plate
          }
          vehicle.reload
          expect(vehicle.make).to eq(original_values[:make])
          expect(vehicle.model).to eq(original_values[:model])
          expect(vehicle.license_plate).to eq(original_values[:license_plate])
        end
    end

    it 'updates to same values (idempotent)' do
      original_values = {
        license_plate: vehicle.license_plate,
        make: vehicle.make,
        model: vehicle.model
      }

      idempotent_variables = {
        input: {
          licensePlate: vehicle.license_plate,
          make: vehicle.make,
          model: vehicle.model
        },
        vehicleId: vehicle.global_id
      }

      expect(mutation).to execute_as_graphql
        .with_variables(idempotent_variables)
        .with_context(context)
        .with_no_errors
        .and_return({
          vehicle: {
            licensePlate: original_values[:license_plate],
            make: original_values[:make],
            model: original_values[:model]
          }
        }.with_indifferent_access)
        .with_effects do
          vehicle.reload
          expect(vehicle.license_plate).to eq(original_values[:license_plate])
          expect(vehicle.make).to eq(original_values[:make])
          expect(vehicle.model).to eq(original_values[:model])
        end
    end

    it 'updates all telematics_source enum values' do
      telematics_sources = [
        { value: 0, name: "manual" },
        { value: 1, name: "gps_tracker" },
        { value: 2, name: "obd_device" },
        { value: 3, name: "mobile_app" }
      ]

      telematics_sources.each do |source|
        test_vehicle = create(:vehicle, telematics_source: :manual)
        enum_variables = {
          input: {
            telematicsSource: source[:value]
          },
          vehicleId: test_vehicle.global_id
        }

        expect(mutation).to execute_as_graphql
          .with_variables(enum_variables)
          .with_context(context)
          .with_no_errors
          .with_effects do
            test_vehicle.reload
            expect(test_vehicle.telematics_source).to eq(source[:name])
          end
      end
    end
  end
end
