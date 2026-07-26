CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    industry VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'active', 'churned')),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- (company_id, status) also serves plain company_id lookups (leading column),
-- so it replaces a standalone company_id index rather than sitting alongside one.
CREATE INDEX accounts_company_id_status_idx ON accounts (company_id, status);
CREATE INDEX accounts_owner_id_idx ON accounts (owner_id);

-- Supports the domain dedup check ("does company X already have an account for
-- this domain") that `domain` exists for; partial since most rows may have none.
CREATE INDEX accounts_company_id_domain_idx ON accounts (company_id, domain) WHERE domain IS NOT NULL;

CREATE TRIGGER accounts_set_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
