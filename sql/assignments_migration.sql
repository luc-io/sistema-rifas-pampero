-- MIGRACIÓN: Sistema de Asignaciones Obligatorias
-- Fecha: 2025-01-28
-- Descripción: Nuevas tablas para asignación de números con edición de titulares

-- 1. Tabla de asignaciones (vendedores responsables de números)
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    raffle_id INTEGER REFERENCES raffles(id) ON DELETE CASCADE,
    seller_name VARCHAR(255) NOT NULL,
    seller_lastname VARCHAR(255) NOT NULL,
    seller_phone VARCHAR(50) NOT NULL,
    seller_email VARCHAR(255),
    numbers INTEGER[] NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'paid', 'confirmed')),
    assigned_at TIMESTAMP DEFAULT NOW(),
    payment_deadline TIMESTAMP,
    paid_at TIMESTAMP,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabla de titulares de números (editables por vendedor)
CREATE TABLE IF NOT EXISTS number_owners (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    number_value INTEGER NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    owner_lastname VARCHAR(255) NOT NULL,
    owner_phone VARCHAR(50),
    owner_email VARCHAR(255),
    owner_instagram VARCHAR(100),
    membership_area VARCHAR(50),
    edited_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(assignment_id, number_value)
);

-- 3. Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_assignments_raffle_id ON assignments(raffle_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_seller_phone ON assignments(seller_phone);
CREATE INDEX IF NOT EXISTS idx_number_owners_assignment_id ON number_owners(assignment_id);
CREATE INDEX IF NOT EXISTS idx_number_owners_number_value ON number_owners(number_value);

-- 4. Trigger para actualizar updated_at en assignments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assignments_updated_at 
    BEFORE UPDATE ON assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Modificar tabla sales existente para referenciar asignaciones
ALTER TABLE sales ADD COLUMN IF NOT EXISTS assignment_id INTEGER REFERENCES assignments(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS seller_name VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_from_assignment BOOLEAN DEFAULT FALSE;

-- 6. Comentarios para documentación
COMMENT ON TABLE assignments IS 'Asignaciones de números a vendedores con compromiso de pago';
COMMENT ON TABLE number_owners IS 'Titulares editables de números asignados';
COMMENT ON COLUMN assignments.status IS 'assigned: Asignado, paid: Pagado, confirmed: Confirmado para sorteo';
COMMENT ON COLUMN number_owners.number_value IS 'Número específico de la rifa';

-- 7. Datos de ejemplo (opcional - comentar en producción)
/*
INSERT INTO assignments (raffle_id, seller_name, seller_lastname, seller_phone, numbers, total_amount, payment_deadline) 
VALUES 
(1, 'Juan', 'Pérez', '+54341123456', ARRAY[1,2,3,4,5], 50.00, NOW() + INTERVAL '7 days'),
(1, 'María', 'García', '+54341789012', ARRAY[6,7,8,9,10], 50.00, NOW() + INTERVAL '7 days');
*/
