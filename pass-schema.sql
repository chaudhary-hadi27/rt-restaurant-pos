-- Admin Settings Table
CREATE TABLE IF NOT EXISTS admin_settings (
                                              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    );

-- OTP Verification Table
CREATE TABLE IF NOT EXISTS otp_verification (
                                                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact VARCHAR(255) NOT NULL, -- phone or email
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
    );

-- Insert default admin (password: admin123)
INSERT INTO admin_settings (email, phone, password_hash)
VALUES (
           'admin@restaurant.com',
           '+923219343489',
           '$2a$10$YourHashedPasswordHere' -- Use bcrypt to generate
       )
    ON CONFLICT DO NOTHING;

-- Auto-delete expired OTPs
CREATE OR REPLACE FUNCTION delete_expired_otps()
RETURNS void AS $$
BEGIN
DELETE FROM otp_verification WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;