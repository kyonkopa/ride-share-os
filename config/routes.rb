Rails.application.routes.draw do
  post "/graphql", to: "graphql#execute"

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Catch-all route to serve the frontend SPA for any route that doesn't match above routes
  # This ensures client-side routes work when users reload the page
  get '*path', to: 'static#index', constraints: ->(req) do
    # Exclude API routes and static assets (files with extensions)
    !req.path.start_with?('/graphql') && 
    !req.path.start_with?('/up') &&
    !req.xhr? &&
    req.path.match?(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|xml|txt|pdf|zip)$/i).nil?
  end
end
