CREATE TABLE etl_staging_02_desvio_carregamento (
  id BIGSERIAL PRIMARY KEY,
  data DATE NOT NULL,
  hora_carregamento TIME,
  carregamento TEXT,
  pazeiro TEXT,
  vagao TEXT,
  dieta TEXT,
  ingrediente TEXT,
  tipo_ingrediente TEXT,
  previsto_kg NUMERIC,
  realizado_kg NUMERIC,
  desvio_kg NUMERIC,
  desvio_pc NUMERIC,
  status TEXT,
  batch_id UUID DEFAULT gen_random_uuid(),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);