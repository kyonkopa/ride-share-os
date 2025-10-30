module GloballyIdentifiable
  extend ActiveSupport::Concern

  def global_id
    AppGlobalId.global_id_for(self)
  end

  def hash_id
    AppGlobalId.encode_id(id)
  end

  module ClassMethods
    def find_by_global_id(global_id)
      AppGlobalId.record_from_global_id(global_id)
    end

    def find_by_global_ids(global_ids)
      where(id: global_ids.map { |global_id| AppGlobalId.global_id_to_standard_id(global_id) })
    end
  end
end
