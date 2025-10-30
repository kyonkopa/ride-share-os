# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ShiftAssignment do
  # Subject for uniqueness validation
  subject { build(:shift_assignment) }

  describe 'validations' do
    it { is_expected.to validate_presence_of(:city) }
    it { is_expected.to validate_presence_of(:start_time) }
    it { is_expected.to validate_presence_of(:end_time) }
    it { is_expected.to validate_presence_of(:status) }
  end

  describe 'associations' do
    it { is_expected.to belong_to(:driver) }
    it { is_expected.to belong_to(:vehicle).optional }
    it { is_expected.to have_many(:shift_events).dependent(:destroy) }
    it { is_expected.to have_many(:revenue_records).dependent(:destroy) }
  end

  describe 'enums' do
    describe 'city' do
      it 'defines correct city values' do
        expect(described_class.cities).to eq({
          'accra' => 0,
          'kumasi' => 1,
          'takoradi' => 2
        })
      end
    end

    describe 'status' do
      it 'defines correct status values' do
        expect(described_class.statuses).to eq({
          'scheduled' => 0,
          'active' => 1,
          'completed' => 2,
          'missed' => 3
        })
      end
    end
  end

  describe 'validations' do
    describe 'end_time_after_start_time' do
      let(:shift_assignment) { build(:shift_assignment) }

      context 'when end_time is after start_time' do
        it 'is valid' do
          shift_assignment.start_time = 1.hour.from_now
          shift_assignment.end_time = 9.hours.from_now
          expect(shift_assignment).to be_valid
        end
      end

      context 'when end_time is before start_time' do
        it 'is invalid' do
          shift_assignment.start_time = 9.hours.from_now
          shift_assignment.end_time = 1.hour.from_now
          expect(shift_assignment).not_to be_valid
          expect(shift_assignment.errors[:end_time]).to include('must be after start time')
        end
      end

      context 'when end_time equals start_time' do
        it 'is invalid' do
          time = 1.hour.from_now
          shift_assignment.start_time = time
          shift_assignment.end_time = time
          expect(shift_assignment).not_to be_valid
          expect(shift_assignment.errors[:end_time]).to include('must be after start time')
        end
      end
    end
  end

  describe '#actual_start_time' do
    let(:shift_assignment) { create(:shift_assignment) }

    context 'when there is a clock_in event' do
      let!(:clock_in_event) { create(:shift_event, :clock_in, shift_assignment: shift_assignment) }

      it 'returns the created_at time of the clock_in event' do
        expect(shift_assignment.actual_start_time).to eq(clock_in_event.created_at)
      end
    end

    context 'when there is no clock_in event' do
      it 'returns nil' do
        expect(shift_assignment.actual_start_time).to be_nil
      end
    end

    context 'when there are multiple events but no clock_in' do
      before do
        create(:shift_event, :telemetry_snapshot, shift_assignment: shift_assignment)
        create(:shift_event, :clock_out, shift_assignment: shift_assignment)
      end

      it 'returns nil' do
        expect(shift_assignment.actual_start_time).to be_nil
      end
    end

    context 'when there are multiple clock_in events' do
      let!(:first_clock_in) { create(:shift_event, :clock_in, shift_assignment: shift_assignment, created_at: 2.hours.ago) }
      let!(:second_clock_in) { create(:shift_event, :clock_in, shift_assignment: shift_assignment, created_at: 1.hour.ago) }

      it 'returns the first clock_in event created_at time' do
        expect(shift_assignment.actual_start_time).to eq(first_clock_in.created_at)
      end
    end
  end

  describe '#actual_end_time' do
    let(:shift_assignment) { create(:shift_assignment) }

    context 'when there is a clock_out event' do
      let!(:clock_out_event) { create(:shift_event, :clock_out, shift_assignment: shift_assignment) }

      it 'returns the created_at time of the clock_out event' do
        expect(shift_assignment.actual_end_time).to eq(clock_out_event.created_at)
      end
    end

    context 'when there is no clock_out event' do
      it 'returns nil' do
        expect(shift_assignment.actual_end_time).to be_nil
      end
    end

    context 'when there are multiple events but no clock_out' do
      before do
        create(:shift_event, :clock_in, shift_assignment: shift_assignment)
        create(:shift_event, :telemetry_snapshot, shift_assignment: shift_assignment)
      end

      it 'returns nil' do
        expect(shift_assignment.actual_end_time).to be_nil
      end
    end

    context 'when there are multiple clock_out events' do
      let!(:first_clock_out) { create(:shift_event, :clock_out, shift_assignment: shift_assignment, created_at: 2.hours.ago) }
      let!(:second_clock_out) { create(:shift_event, :clock_out, shift_assignment: shift_assignment, created_at: 1.hour.ago) }

      it 'returns the first clock_out event created_at time' do
        expect(shift_assignment.actual_end_time).to eq(first_clock_out.created_at)
      end
    end
  end

  describe 'integration with shift events' do
    let(:shift_assignment) { create(:shift_assignment) }

    context 'when a shift has both clock_in and clock_out events' do
      let!(:clock_in_event) { create(:shift_event, :clock_in, shift_assignment: shift_assignment, created_at: 2.hours.ago) }
      let!(:clock_out_event) { create(:shift_event, :clock_out, shift_assignment: shift_assignment, created_at: 1.hour.ago) }

      it 'returns correct actual start and end times' do
        expect(shift_assignment.actual_start_time).to eq(clock_in_event.created_at)
        expect(shift_assignment.actual_end_time).to eq(clock_out_event.created_at)
      end

      it 'has actual_start_time before actual_end_time' do
        expect(shift_assignment.actual_start_time).to be < shift_assignment.actual_end_time
      end
    end

    context 'when shift events are created in different order' do
      let!(:clock_out_event) { create(:shift_event, :clock_out, shift_assignment: shift_assignment, created_at: 1.hour.ago) }
      let!(:clock_in_event) { create(:shift_event, :clock_in, shift_assignment: shift_assignment, created_at: 2.hours.ago) }

      it 'still returns correct times based on event type, not creation order' do
        expect(shift_assignment.actual_start_time).to eq(clock_in_event.created_at)
        expect(shift_assignment.actual_end_time).to eq(clock_out_event.created_at)
      end
    end
  end
end
