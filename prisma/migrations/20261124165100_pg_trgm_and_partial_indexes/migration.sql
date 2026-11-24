-- Enable pg_trgm for Korean partial-match search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Partial unique indexes for VaultItem deduplication per user
CREATE UNIQUE INDEX IF NOT EXISTS vault_items_user_content_uniq
  ON vault_items (user_id, content_id)
  WHERE content_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS vault_items_user_normalized_url_uniq
  ON vault_items (user_id, normalized_url)
  WHERE normalized_url IS NOT NULL;

-- Hybrid search GIN indexes (tsvector + pg_trgm)
CREATE INDEX IF NOT EXISTS contents_search_vector_gin
  ON contents USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS contents_title_trgm_gin
  ON contents USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS contents_summary_trgm_gin
  ON contents USING GIN (summary gin_trgm_ops);

CREATE INDEX IF NOT EXISTS tags_name_trgm_gin
  ON tags USING GIN (name gin_trgm_ops);
