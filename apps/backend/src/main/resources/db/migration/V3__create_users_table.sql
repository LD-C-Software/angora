CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(320) NOT NULL,
    password_hash TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'suspended', 'deactivated')),
    email_verified_at TIMESTAMPTZ,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_secret TEXT,
    last_login_at TIMESTAMPTZ,
    failed_login_attempts SMALLINT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (company_id, email)
);

CREATE INDEX users_company_id_idx ON users (company_id);
CREATE INDEX users_role_id_idx ON users (role_id);

-- Covers the common "list this company's active users" shape directly; the plain
-- company_id index above stays for anything that needs to see soft-deleted rows too.
CREATE INDEX users_company_id_status_idx ON users (company_id, status) WHERE deleted_at IS NULL;

CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
