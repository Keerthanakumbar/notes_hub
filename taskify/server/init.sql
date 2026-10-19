-- Runs automatically on FIRST startup of the db container
-- (mounted into /docker-entrypoint-initdb.d/ in docker-compose.yml)
-- If the volume already has data, this is skipped — that's expected.

CREATE TABLE names (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
