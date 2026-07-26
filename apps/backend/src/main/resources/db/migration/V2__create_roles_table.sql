CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- company_id IS NULL rows are global system roles: dedupe by name alone.
CREATE UNIQUE INDEX roles_system_name_key ON roles (name) WHERE company_id IS NULL;

-- company_id IS NOT NULL rows are a company's own custom roles: dedupe per company.
CREATE UNIQUE INDEX roles_company_name_key ON roles (company_id, name) WHERE company_id IS NOT NULL;

CREATE TRIGGER roles_set_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

INSERT INTO roles (name, description, is_system) VALUES
    ('owner', 'Full control over the company account, including user and role management', true),
    ('admin', 'Manages users, settings, and CRM data for the company', true),
    ('member', 'Regular internal staff access to CRM data', true),
    ('customer', 'Portal login for an external contact to view their own support requests', true);
