-- Database schemas for authentication with roles system
-- Implements tables for users, associations, and sessions with constraints
-- Requirements: 1.2, 1.3, 2.2

-- Enable UUID extension for PostgreSQL (if using PostgreSQL)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - stores all user accounts with role-based information
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('patron', 'taxista')),
    numero_taxista VARCHAR(10) UNIQUE, -- solo para taxistas
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_numero_taxista_for_taxista 
        CHECK (
            (rol = 'taxista' AND numero_taxista IS NOT NULL) OR 
            (rol = 'patron' AND numero_taxista IS NULL)
        ),
    CONSTRAINT check_email_format 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT check_nombre_not_empty 
        CHECK (LENGTH(TRIM(nombre)) > 0),
    CONSTRAINT check_numero_taxista_format 
        CHECK (numero_taxista IS NULL OR numero_taxista ~* '^TX[0-9]{3}$')
);

-- Associations table - manages patron-taxista relationships
CREATE TABLE asociaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patron_id UUID NOT NULL,
    taxista_id UUID NOT NULL,
    fecha_asociacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT true,
    
    -- Foreign key constraints
    CONSTRAINT fk_asociaciones_patron 
        FOREIGN KEY (patron_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_asociaciones_taxista 
        FOREIGN KEY (taxista_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Business logic constraints
    CONSTRAINT unique_active_association 
        UNIQUE(patron_id, taxista_id),
    CONSTRAINT check_different_users 
        CHECK (patron_id != taxista_id)
);

-- Sessions table - manages JWT refresh tokens and session information
CREATE TABLE sesiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    refresh_token VARCHAR(500) NOT NULL UNIQUE,
    dispositivo VARCHAR(255),
    ip_address INET,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    activa BOOLEAN DEFAULT true,
    
    -- Foreign key constraints
    CONSTRAINT fk_sesiones_usuario 
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Business logic constraints
    CONSTRAINT check_expiration_after_creation 
        CHECK (fecha_expiracion > fecha_creacion)
);

-- Indexes for performance optimization

-- Users table indexes
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_numero_taxista ON usuarios(numero_taxista) WHERE numero_taxista IS NOT NULL;
CREATE INDEX idx_usuarios_activo ON usuarios(activo);
CREATE INDEX idx_usuarios_fecha_creacion ON usuarios(fecha_creacion);

-- Associations table indexes
CREATE INDEX idx_asociaciones_patron_id ON asociaciones(patron_id);
CREATE INDEX idx_asociaciones_taxista_id ON asociaciones(taxista_id);
CREATE INDEX idx_asociaciones_activa ON asociaciones(activa);
CREATE INDEX idx_asociaciones_fecha ON asociaciones(fecha_asociacion);
CREATE INDEX idx_asociaciones_patron_activa ON asociaciones(patron_id, activa);

-- Sessions table indexes
CREATE INDEX idx_sesiones_usuario_id ON sesiones(usuario_id);
CREATE INDEX idx_sesiones_refresh_token ON sesiones(refresh_token);
CREATE INDEX idx_sesiones_activa ON sesiones(activa);
CREATE INDEX idx_sesiones_expiracion ON sesiones(fecha_expiracion);
CREATE INDEX idx_sesiones_usuario_activa ON sesiones(usuario_id, activa);

-- Triggers for automatic timestamp updates

-- Update fecha_actualizacion on usuarios table
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usuarios_update_timestamp
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

-- Additional constraints to ensure data integrity

-- Constraint to ensure only taxistas can be associated
ALTER TABLE asociaciones ADD CONSTRAINT check_taxista_role
    CHECK (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = taxista_id AND rol = 'taxista'
        )
    );

-- Constraint to ensure only patrones can create associations
ALTER TABLE asociaciones ADD CONSTRAINT check_patron_role
    CHECK (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = patron_id AND rol = 'patron'
        )
    );

-- Function to generate unique taxista numbers
CREATE OR REPLACE FUNCTION generate_numero_taxista()
RETURNS VARCHAR(10) AS $$
DECLARE
    new_number VARCHAR(10);
    counter INTEGER := 1;
BEGIN
    LOOP
        new_number := 'TX' || LPAD(counter::TEXT, 3, '0');
        
        -- Check if this number already exists
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE numero_taxista = new_number) THEN
            RETURN new_number;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 999 THEN
            RAISE EXCEPTION 'No more taxista numbers available';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate numero_taxista for new taxistas
CREATE OR REPLACE FUNCTION auto_generate_numero_taxista()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rol = 'taxista' AND NEW.numero_taxista IS NULL THEN
        NEW.numero_taxista := generate_numero_taxista();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_numero_taxista
    BEFORE INSERT ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_numero_taxista();

-- Views for common queries

-- View for active associations with user details
CREATE VIEW vista_asociaciones_activas AS
SELECT 
    a.id,
    a.patron_id,
    a.taxista_id,
    a.fecha_asociacion,
    p.nombre AS patron_nombre,
    p.email AS patron_email,
    t.nombre AS taxista_nombre,
    t.email AS taxista_email,
    t.numero_taxista,
    t.telefono AS taxista_telefono
FROM asociaciones a
JOIN usuarios p ON a.patron_id = p.id
JOIN usuarios t ON a.taxista_id = t.id
WHERE a.activa = true 
  AND p.activo = true 
  AND t.activo = true;

-- View for available taxistas (not associated with any patron)
CREATE VIEW vista_taxistas_disponibles AS
SELECT 
    u.id,
    u.email,
    u.nombre,
    u.telefono,
    u.numero_taxista,
    u.fecha_creacion
FROM usuarios u
WHERE u.rol = 'taxista' 
  AND u.activo = true
  AND NOT EXISTS (
      SELECT 1 FROM asociaciones a 
      WHERE a.taxista_id = u.id AND a.activa = true
  );

-- View for patron dashboard data
CREATE VIEW vista_patron_dashboard AS
SELECT 
    p.id AS patron_id,
    p.nombre AS patron_nombre,
    p.email AS patron_email,
    COUNT(a.id) AS total_taxistas_asociados,
    COUNT(CASE WHEN a.fecha_asociacion >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) AS nuevas_asociaciones_mes
FROM usuarios p
LEFT JOIN asociaciones a ON p.id = a.patron_id AND a.activa = true
WHERE p.rol = 'patron' AND p.activo = true
GROUP BY p.id, p.nombre, p.email;

-- Cleanup procedures for expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sesiones 
    WHERE fecha_expiracion < CURRENT_TIMESTAMP 
       OR activa = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE usuarios IS 'Stores all user accounts with role-based information (patrones and taxistas)';
COMMENT ON TABLE asociaciones IS 'Manages relationships between patrones and taxistas';
COMMENT ON TABLE sesiones IS 'Manages JWT refresh tokens and session information for authentication';

COMMENT ON COLUMN usuarios.numero_taxista IS 'Unique identifier for taxistas, auto-generated in format TX001-TX999';
COMMENT ON COLUMN usuarios.rol IS 'User role: patron (can manage taxistas) or taxista (driver)';
COMMENT ON COLUMN asociaciones.activa IS 'Indicates if the association is currently active';
COMMENT ON COLUMN sesiones.refresh_token IS 'JWT refresh token for session management';

-- Initial data setup (optional - for development/testing)
-- This section can be uncommented for initial setup with sample data

/*
-- Insert sample patron
INSERT INTO usuarios (email, password_hash, nombre, telefono, rol) 
VALUES ('patron@example.com', '$2b$10$example_hash', 'Juan Pérez', '+1234567890', 'patron');

-- Insert sample taxistas
INSERT INTO usuarios (email, password_hash, nombre, telefono, rol) 
VALUES 
    ('taxista1@example.com', '$2b$10$example_hash', 'Carlos García', '+1234567891', 'taxista'),
    ('taxista2@example.com', '$2b$10$example_hash', 'María López', '+1234567892', 'taxista');
*/