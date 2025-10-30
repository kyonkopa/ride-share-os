class ApplicationController < ActionController::API
  include Devise::Controllers::Helpers

  def frontend
    if Rails.env.production?
      render file: Rails.root.join("..", "frontend", "dist", "index.html"), layout: false
    else
      render plain: "Frontend not built. Run 'npm run build' in the frontend directory.", status: :not_found
    end
  end
end
