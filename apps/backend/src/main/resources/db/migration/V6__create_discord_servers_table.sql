CREATE TABLE discord_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    icon_url VARCHAR(512),
    owner_id VARCHAR(64),
    member_count INT NOT NULL DEFAULT 0,
    bot_joined BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX discord_servers_guild_id_idx ON discord_servers (guild_id);
CREATE INDEX discord_servers_bot_joined_idx ON discord_servers (bot_joined);

CREATE TRIGGER discord_servers_set_updated_at
    BEFORE UPDATE ON discord_servers
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
