# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Vehicle do
  subject { build(:vehicle) }

  describe 'validations' do
    it { is_expected.to validate_presence_of(:license_plate) }
    it { is_expected.to validate_uniqueness_of(:license_plate) }
    it { is_expected.to validate_presence_of(:make) }
    it { is_expected.to validate_presence_of(:model) }
    it { is_expected.to validate_presence_of(:year_of_manufacture) }
    it { is_expected.to validate_presence_of(:latest_odometer) }
    it { is_expected.to validate_presence_of(:latest_range) }
    it { is_expected.to validate_presence_of(:telematics_source) }

    describe 'year_of_manufacture' do
      context 'when year is greater than 1900' do
        it 'is valid' do
          vehicle = build(:vehicle, year_of_manufacture: 1901)
          expect(vehicle).to be_valid
        end
      end

      context 'when year is 1900' do
        it 'is invalid' do
          vehicle = build(:vehicle, year_of_manufacture: 1900)
          expect(vehicle).not_to be_valid
          expect(vehicle.errors[:year_of_manufacture]).to be_present
        end
      end

      context 'when year is less than 1900' do
        it 'is invalid' do
          vehicle = build(:vehicle, year_of_manufacture: 1899)
          expect(vehicle).not_to be_valid
          expect(vehicle.errors[:year_of_manufacture]).to be_present
        end
      end

      context 'when year is less than or equal to current year + 1' do
        it 'is valid for current year' do
          vehicle = build(:vehicle, year_of_manufacture: Date.current.year)
          expect(vehicle).to be_valid
        end

        it 'is valid for next year' do
          vehicle = build(:vehicle, year_of_manufacture: Date.current.year + 1)
          expect(vehicle).to be_valid
        end
      end

      context 'when year is greater than current year + 1' do
        it 'is invalid' do
          vehicle = build(:vehicle, year_of_manufacture: Date.current.year + 2)
          expect(vehicle).not_to be_valid
          expect(vehicle.errors[:year_of_manufacture]).to be_present
        end
      end
    end

    describe 'latest_odometer' do
      context 'when odometer is zero or greater' do
        it 'is valid with zero' do
          vehicle = build(:vehicle, latest_odometer: 0)
          expect(vehicle).to be_valid
        end

        it 'is valid with positive value' do
          vehicle = build(:vehicle, latest_odometer: 50000)
          expect(vehicle).to be_valid
        end
      end

      context 'when odometer is negative' do
        it 'is invalid' do
          vehicle = build(:vehicle, latest_odometer: -1)
          expect(vehicle).not_to be_valid
          expect(vehicle.errors[:latest_odometer]).to be_present
        end
      end
    end

    describe 'latest_range' do
      context 'when range is zero or greater' do
        it 'is valid with zero' do
          vehicle = build(:vehicle, latest_range: 0)
          expect(vehicle).to be_valid
        end

        it 'is valid with positive value' do
          vehicle = build(:vehicle, latest_range: 300)
          expect(vehicle).to be_valid
        end
      end

      context 'when range is negative' do
        it 'is invalid' do
          vehicle = build(:vehicle, latest_range: -1)
          expect(vehicle).not_to be_valid
          expect(vehicle.errors[:latest_range]).to be_present
        end
      end
    end
  end

  describe 'associations' do
    it { is_expected.to have_many(:shift_assignments).dependent(:destroy) }
    it { is_expected.to have_many(:expenses).dependent(:destroy) }
    it { is_expected.to have_one_attached(:vehicle_image) }
  end

  describe 'enums' do
    describe 'telematics_source' do
      it 'defines correct telematics_source values' do
        expect(described_class.telematics_sources).to eq(
          {
                    'manual' => 0,
                    'gps_tracker' => 1,
                    'obd_device' => 2,
                    'mobile_app' => 3
                  }
)
      end

      it 'allows manual as telematics_source' do
        vehicle = build(:vehicle, telematics_source: :manual)
        expect(vehicle.telematics_source).to eq('manual')
      end

      it 'allows gps_tracker as telematics_source' do
        vehicle = build(:vehicle, telematics_source: :gps_tracker)
        expect(vehicle.telematics_source).to eq('gps_tracker')
      end

      it 'allows obd_device as telematics_source' do
        vehicle = build(:vehicle, telematics_source: :obd_device)
        expect(vehicle.telematics_source).to eq('obd_device')
      end

      it 'allows mobile_app as telematics_source' do
        vehicle = build(:vehicle, telematics_source: :mobile_app)
        expect(vehicle.telematics_source).to eq('mobile_app')
      end
    end
  end

  describe '#in_use?' do
    let(:vehicle) { create(:vehicle) }

    context 'when vehicle has no shift assignments' do
      it 'returns false' do
        expect(vehicle.in_use?).to be false
      end
    end

    context 'when vehicle has only scheduled shift assignments' do
      before do
        create(:shift_assignment, vehicle:, status: :scheduled)
      end

      it 'returns false' do
        expect(vehicle.in_use?).to be false
      end
    end

    context 'when vehicle has only completed shift assignments' do
      before do
        create(:shift_assignment, :completed, vehicle:)
      end

      it 'returns false' do
        expect(vehicle.in_use?).to be false
      end
    end

    context 'when vehicle has only missed shift assignments' do
      before do
        create(:shift_assignment, :missed, vehicle:)
      end

      it 'returns false' do
        expect(vehicle.in_use?).to be false
      end
    end

    context 'when vehicle has an active shift assignment' do
      before do
        create(:shift_assignment, :active, vehicle:)
      end

      it 'returns true' do
        expect(vehicle.in_use?).to be true
      end
    end

    context 'when vehicle has multiple shift assignments with at least one active' do
      before do
        create(:shift_assignment, :scheduled, vehicle:)
        create(:shift_assignment, :active, vehicle:)
        create(:shift_assignment, :completed, vehicle:)
      end

      it 'returns true' do
        expect(vehicle.in_use?).to be true
      end
    end

    context 'when vehicle has multiple shift assignments but none active' do
      before do
        create(:shift_assignment, :scheduled, vehicle:)
        create(:shift_assignment, :completed, vehicle:)
        create(:shift_assignment, :missed, vehicle:)
      end

      it 'returns false' do
        expect(vehicle.in_use?).to be false
      end
    end
  end

  describe 'default values' do
    it 'has default latest_odometer of 0 when not explicitly set' do
      vehicle = Vehicle.new(
        license_plate: 'ABC123',
        make: 'Toyota',
        model: 'Camry',
        year_of_manufacture: 2020,
        latest_range: 200,
        telematics_source: :manual
      )
      vehicle.save(validate: false) # Skip validations to test DB default
      expect(vehicle.reload.latest_odometer).to eq(0)
    end

    it 'has default latest_range of 0 when not explicitly set' do
      vehicle = Vehicle.new(
        license_plate: 'XYZ789',
        make: 'Honda',
        model: 'Civic',
        year_of_manufacture: 2021,
        latest_odometer: 10000,
        telematics_source: :manual
      )
      vehicle.save(validate: false) # Skip validations to test DB default
      expect(vehicle.reload.latest_range).to eq(0)
    end
  end
end
