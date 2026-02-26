-- Enable extensions for search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ── Users ──────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    name        VARCHAR(255),
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Collections ───────────────────────────────────────────────────────────────
CREATE TABLE collections (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    color       VARCHAR(7),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    search_vec  TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', name || ' ' || COALESCE(description, ''))) STORED
);

CREATE INDEX idx_collections_user     ON collections(user_id);
CREATE INDEX idx_collections_search   ON collections USING GIN(search_vec);
CREATE INDEX idx_collections_name_trgm ON collections USING GIN(name gin_trgm_ops);

-- ── Folders ───────────────────────────────────────────────────────────────────
CREATE TABLE folders (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id    UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_folders_collection ON folders(collection_id);
CREATE INDEX idx_folders_parent     ON folders(parent_folder_id);
CREATE INDEX idx_folders_name_trgm  ON folders USING GIN(name gin_trgm_ops);

-- ── Requests ──────────────────────────────────────────────────────────────────
CREATE TABLE requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    folder_id     UUID REFERENCES folders(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL DEFAULT 'Untitled Request',
    method        VARCHAR(10) NOT NULL DEFAULT 'GET'
                  CHECK (method IN ('GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS')),
    url           TEXT NOT NULL DEFAULT '',
    description   TEXT,
    body_type     VARCHAR(20) DEFAULT 'none'
                  CHECK (body_type IN ('none','json','text','form-data','urlencoded','xml')),
    body_content  TEXT,
    auth_type     VARCHAR(20) DEFAULT 'none'
                  CHECK (auth_type IN ('none','bearer','basic','api-key')),
    auth_config   JSONB DEFAULT '{}',
    sort_order    INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    search_vec    TSVECTOR GENERATED ALWAYS AS (
                    to_tsvector('english', name || ' ' || url || ' ' || COALESCE(description, ''))
                  ) STORED
);

CREATE INDEX idx_requests_collection ON requests(collection_id);
CREATE INDEX idx_requests_folder     ON requests(folder_id);
CREATE INDEX idx_requests_user       ON requests(user_id);
CREATE INDEX idx_requests_method     ON requests(method);
CREATE INDEX idx_requests_search     ON requests USING GIN(search_vec);
CREATE INDEX idx_requests_url_trgm   ON requests USING GIN(url gin_trgm_ops);
CREATE INDEX idx_requests_name_trgm  ON requests USING GIN(name gin_trgm_ops);

-- ── Request Headers ───────────────────────────────────────────────────────────
CREATE TABLE request_headers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id  UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    key         VARCHAR(255) NOT NULL,
    value       TEXT NOT NULL DEFAULT '',
    description TEXT,
    enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_req_headers_request ON request_headers(request_id);

-- ── Request Params ────────────────────────────────────────────────────────────
CREATE TABLE request_params (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id  UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    key         VARCHAR(255) NOT NULL,
    value       TEXT NOT NULL DEFAULT '',
    description TEXT,
    enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_req_params_request ON request_params(request_id);

-- ── Request Form Fields ───────────────────────────────────────────────────────
CREATE TABLE request_form_fields (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id  UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    key         VARCHAR(255) NOT NULL,
    value       TEXT NOT NULL DEFAULT '',
    description TEXT,
    enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_req_form_request ON request_form_fields(request_id);

-- ── Environments ──────────────────────────────────────────────────────────────
CREATE TABLE environments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_environments_user ON environments(user_id);

-- ── Environment Variables ─────────────────────────────────────────────────────
CREATE TABLE environment_variables (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    key            VARCHAR(255) NOT NULL,
    value          TEXT NOT NULL DEFAULT '',
    description    TEXT,
    enabled        BOOLEAN NOT NULL DEFAULT TRUE,
    secret         BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order     INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_env_vars_environment ON environment_variables(environment_id);
CREATE INDEX idx_env_vars_key         ON environment_variables(key);

-- ── Request History ───────────────────────────────────────────────────────────
CREATE TABLE request_history (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id       UUID REFERENCES requests(id) ON DELETE SET NULL,
    request_name     VARCHAR(255),
    method           VARCHAR(10) NOT NULL,
    url              TEXT NOT NULL,
    headers          JSONB DEFAULT '[]',
    params           JSONB DEFAULT '[]',
    body_type        VARCHAR(20),
    body_content     TEXT,
    auth_type        VARCHAR(20),
    auth_config      JSONB DEFAULT '{}',
    response_status  INT,
    response_headers JSONB DEFAULT '{}',
    response_body    TEXT,
    response_size    INT,
    response_time    INT,
    executed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_history_user        ON request_history(user_id);
CREATE INDEX idx_history_request     ON request_history(request_id);
CREATE INDEX idx_history_executed_at ON request_history(executed_at DESC);
CREATE INDEX idx_history_method      ON request_history(method);
CREATE INDEX idx_history_url_trgm    ON request_history USING GIN(url gin_trgm_ops);

-- ── Response Snapshots ────────────────────────────────────────────────────────
CREATE TABLE response_snapshots (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id     UUID REFERENCES requests(id) ON DELETE CASCADE,
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL DEFAULT 'Snapshot',
    status         INT,
    headers        JSONB DEFAULT '{}',
    body           TEXT,
    size           INT,
    time           INT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_snapshots_request ON response_snapshots(request_id);
CREATE INDEX idx_snapshots_user    ON response_snapshots(user_id);

-- ── Update triggers ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_folders_updated_at     BEFORE UPDATE ON folders     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_requests_updated_at    BEFORE UPDATE ON requests    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_environments_updated_at BEFORE UPDATE ON environments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
