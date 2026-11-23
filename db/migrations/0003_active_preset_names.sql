ALTER TABLE presets DROP CONSTRAINT IF EXISTS presets_organization_id_kind_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS presets_active_name_uidx
  ON presets (organization_id, kind, name)
  WHERE is_active;
