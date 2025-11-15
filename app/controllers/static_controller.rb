class StaticController < ApplicationController
  def index
    file_path = Rails.root.join("public", "index.html")

    if File.exist?(file_path)
      # Set proper headers for SPA
      response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
      response.headers["Pragma"] = "no-cache"
      response.headers["Expires"] = "0"
      response.headers["Content-Type"] = "text/html; charset=utf-8"

      send_file file_path, type: "text/html", disposition: "inline"
    else
      head :not_found
    end
  end
end
