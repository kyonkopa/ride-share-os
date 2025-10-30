# frozen_string_literal: true

module AppGlobalId
  SEPARATOR = ":"

  HASHID_SALT = Rails.application.credentials.hashid_salt || "HID_SALT_XD"
  HASHIDS = Hashids.new(HASHID_SALT, 10)

  def self.global_id_for(record)
    "#{record.class.name}#{SEPARATOR}#{encode_id(record.id)}"
  end

  def self.record_from_global_id(global_id)
    model_name, encoded_id = global_id.split(SEPARATOR, 2)
    return nil unless model_name && encoded_id

    model = model_name.safe_constantize
    return nil unless model

    id = decode_id(encoded_id)
    model.find_by(id:)
  end

  def self.encode_id(id)
    HASHIDS.encode(id)
  end

  def self.decode_id(encoded_id)
    decoded = HASHIDS.decode(encoded_id).first
    decoded.to_i if decoded
  end

  def self.global_id_to_standard_id(global_id)
    decode_id(global_id.split(SEPARATOR, 2).last)
  end
end
