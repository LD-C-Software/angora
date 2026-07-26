CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(320),
    phone VARCHAR(50),
    job_title VARCHAR(150),
    lifecycle_stage VARCHAR(20) NOT NULL DEFAULT 'lead' CHECK (lifecycle_stage IN ('lead', 'prospect', 'customer', 'churned')),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX contacts_account_id_idx ON contacts (account_id);
CREATE INDEX contacts_owner_id_idx ON contacts (owner_id);

-- (company_id, lifecycle_stage) also serves plain company_id lookups (leading
-- column), so it replaces a standalone company_id index rather than sitting
-- alongside one. This is the core CRM list-view shape (Leads/Prospects/Customers).
CREATE INDEX contacts_company_id_lifecycle_stage_idx ON contacts (company_id, lifecycle_stage);

-- Scoped by company rather than a bare email index: lookups are always "does
-- company X already have a contact with this email", never cross-tenant.
CREATE INDEX contacts_company_id_email_idx ON contacts (company_id, email) WHERE email IS NOT NULL;

CREATE TRIGGER contacts_set_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
