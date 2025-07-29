-- ESQUEMA DE TABLAS PARA ASIGNACIONES - Sistema de Rifas Pampero
-- Ejecutar este SQL en Supabase si planeas usar asignaciones

-- Tabla para asignaciones de números a vendedores
CREATE TABLE IF NOT EXISTS assignments (
    id BIGSERIAL PRIMARY KEY,
    raffle_id TEXT NOT NULL DEFAULT 'current',
    seller_name TEXT NOT NULL,
    seller_lastname TEXT NOT NULL,
    seller_phone TEXT NOT NULL,
    seller_email TEXT,
    numbers INTEGER[] NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'paid', 'expired', 'cancelled')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_deadline TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payment_method TEXT CHECK (payment_method IN ('efectivo', 'transferencia')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla para titulares individuales de números asignados
CREATE TABLE IF NOT EXISTS number_owners (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT REFERENCES assignments(id) ON DELETE CASCADE,
    number_value INTEGER NOT NULL,
    owner_name TEXT NOT NULL DEFAULT '',
    owner_lastname TEXT NOT NULL DEFAULT '',
    owner_phone TEXT NOT NULL DEFAULT '',
    owner_email TEXT DEFAULT '',
    owner_instagram TEXT DEFAULT '',
    membership_area TEXT CHECK (membership_area IN ('no_socio', 'nautica', 'remo', 'ecologia', 'pesca', 'ninguna', '')),
    edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_assignments_raffle_id ON assignments(raffle_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_seller_phone ON assignments(seller_phone);
CREATE INDEX IF NOT EXISTS idx_number_owners_assignment_id ON number_owners(assignment_id);
CREATE INDEX IF NOT EXISTS idx_number_owners_number_value ON number_owners(number_value);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_number_owners_updated_at ON number_owners;
CREATE TRIGGER update_number_owners_updated_at
    BEFORE UPDATE ON number_owners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE assignments IS 'Asignaciones de números a vendedores responsables';
COMMENT ON TABLE number_owners IS 'Titulares individuales de cada número asignado';
COMMENT ON COLUMN assignments.numbers IS 'Array de números asignados al vendedor';
COMMENT ON COLUMN assignments.status IS 'Estado: assigned, paid, expired, cancelled';
COMMENT ON COLUMN number_owners.membership_area IS 'Área de membresía del club: no_socio, nautica, remo, ecologia, pesca, ninguna';
