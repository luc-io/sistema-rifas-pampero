-- ====================================================================
-- TABLAS PARA ASIGNACIONES - Sistema de Rifas Pampero
-- Ejecutar en Supabase SQL Editor
-- ====================================================================

-- Crear tabla de asignaciones
CREATE TABLE IF NOT EXISTS public.assignments (
    id BIGSERIAL PRIMARY KEY,
    raffle_id TEXT NOT NULL DEFAULT 'current',
    seller_name TEXT NOT NULL,
    seller_lastname TEXT NOT NULL,
    seller_phone TEXT NOT NULL,
    seller_email TEXT,
    numbers INTEGER[] NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'paid', 'confirmed', 'expired', 'cancelled')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_deadline TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payment_method TEXT CHECK (payment_method IN ('efectivo', 'transferencia', 'pending')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de titulares de números
CREATE TABLE IF NOT EXISTS public.number_owners (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    number_value INTEGER NOT NULL,
    owner_name TEXT DEFAULT '',
    owner_lastname TEXT DEFAULT '',
    owner_phone TEXT DEFAULT '',
    owner_email TEXT DEFAULT '',
    owner_instagram TEXT DEFAULT '',
    membership_area TEXT CHECK (membership_area IN ('no_socio', 'nautica', 'remo', 'ecologia', 'pesca', 'ninguna', '')),
    edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para evitar duplicados de número por asignación
    UNIQUE(assignment_id, number_value)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_assignments_raffle_id ON public.assignments(raffle_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON public.assignments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_number_owners_assignment_id ON public.number_owners(assignment_id);
CREATE INDEX IF NOT EXISTS idx_number_owners_number_value ON public.number_owners(number_value);

-- Habilitar RLS (Row Level Security) - opcional pero recomendado
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_owners ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad (permitir todo por ahora, ajustar según necesidades)
CREATE POLICY "Permitir todas las operaciones en assignments" ON public.assignments
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todas las operaciones en number_owners" ON public.number_owners
    FOR ALL USING (true) WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON TABLE public.assignments IS 'Asignaciones de números a vendedores responsables';
COMMENT ON TABLE public.number_owners IS 'Titulares específicos de cada número asignado';

COMMENT ON COLUMN public.assignments.raffle_id IS 'ID de la rifa (normalmente "current")';
COMMENT ON COLUMN public.assignments.numbers IS 'Array de números asignados al vendedor';
COMMENT ON COLUMN public.assignments.payment_deadline IS 'Fecha límite de rendición (24h antes del sorteo)';
COMMENT ON COLUMN public.assignments.status IS 'Estado: assigned, paid, confirmed, expired, cancelled';

COMMENT ON COLUMN public.number_owners.assignment_id IS 'ID de la asignación a la que pertenece';
COMMENT ON COLUMN public.number_owners.number_value IS 'Número específico (0-999)';
COMMENT ON COLUMN public.number_owners.owner_name IS 'Nombre del titular actual del número';

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_assignments_updated_at 
    BEFORE UPDATE ON public.assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_number_owners_updated_at 
    BEFORE UPDATE ON public.number_owners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificar que las tablas se crearon correctamente
SELECT 
    table_name, 
    table_type,
    is_insertable_into
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('assignments', 'number_owners')
ORDER BY table_name;

-- ====================================================================
-- FIN DEL SCRIPT
-- ====================================================================

-- 📋 INSTRUCCIONES:
-- 1. Copiar todo este script
-- 2. Ir a Supabase Dashboard > SQL Editor
-- 3. Pegar el script y ejecutar
-- 4. Verificar que las tablas se crearon sin errores
-- 5. Probar el sistema de asignaciones en la aplicación
