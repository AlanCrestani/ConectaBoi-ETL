CREATE TABLE etl_staging_03_desvio_distribuicao (
  id INTEGER NOT NULL,
  data DATE,
  hora TIME,
  trato TEXT,
  tratador TEXT,
  vagao TEXT,
  curral TEXT,
  dieta TEXT,
  plano_alimentar NUMERIC,
  lote TEXT,
  distribuido_kg NUMERIC,
  previsto_kg NUMERIC,
  desvio_kg NUMERIC,
  desvio_pct NUMERIC,
  status TEXT
);