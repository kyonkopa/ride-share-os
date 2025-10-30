class JwtService
  SECRET_KEY = Rails.application.credentials.secret_key_base || "your-secret-key"

  def self.encode(payload, exp = 24.hours.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET_KEY)
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY)[0]
    HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError => e
    raise ExceptionHandler::InvalidToken, e.message
  end

  def self.generate_tokens(user)
    access_token = encode({ user_id: user.id, email: user.email })
    refresh_token = encode({ user_id: user.id, type: "refresh" }, 7.days.from_now)

    {
      access_token:,
      refresh_token:,
      token_type: "Bearer",
      expires_in: 24.hours.to_i
    }
  end

  def self.refresh_token(token)
    decoded = decode(token)
    raise ExceptionHandler::InvalidToken, "Invalid refresh token" unless decoded[:type] == "refresh"

    user = User.find(decoded[:user_id])
    generate_tokens(user)
  end
end
