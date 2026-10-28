

-- 1. TABLAS DEL MÓDULO DE USUARIOS, ROLES Y SEGURIDAD

CREATE TABLE rol (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(255)
);

CREATE TABLE permiso (
    id_permiso SERIAL PRIMARY KEY,
    nombre_permiso VARCHAR(100) NOT NULL,
    modulo VARCHAR(100) NOT NULL,
    CONSTRAINT uq_permiso_modulo UNIQUE (nombre_permiso, modulo)
);

CREATE TABLE rol_permiso (
    id_rol INT REFERENCES rol(id_rol) ON DELETE CASCADE,
    id_permiso INT REFERENCES permiso(id_permiso) ON DELETE CASCADE,
    PRIMARY KEY (id_rol, id_permiso)
);

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) DEFAULT '',
    username VARCHAR(150) UNIQUE NOT NULL, -- Reemplaza a correo para el Login
    contrasena VARCHAR(255) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    id_rol INT REFERENCES rol(id_rol) ON DELETE SET NULL,
    telefono VARCHAR(20),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- 2. TABLAS DEL MÓDULO DE VEHÍCULOS Y MANTENIMIENTO (TALLER)


CREATE TABLE vehiculo (
    id_vehiculo SERIAL PRIMARY KEY,
    placa VARCHAR(20) UNIQUE NOT NULL,
    estado VARCHAR(50) NOT NULL -- Disponible, En Taller, En Viaje
);

CREATE TABLE repuesto (
    id_repuesto SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    stock INT DEFAULT 0,
    descripcion TEXT
);

CREATE TABLE orden_trabajo (
    id_orden SERIAL PRIMARY KEY,
    id_vehiculo INT REFERENCES vehiculo(id_vehiculo) ON DELETE CASCADE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) NOT NULL, -- Pendiente, En Proceso, Finalizada
    descripcion TEXT
);

CREATE TABLE salida_repuesto (
    id_salida SERIAL PRIMARY KEY,
    id_repuesto INT REFERENCES repuesto(id_repuesto) ON DELETE CASCADE,
    id_orden INT REFERENCES orden_trabajo(id_orden) ON DELETE CASCADE,
    cantidad INT NOT NULL,
    fecha DATE NOT NULL
);

CREATE TABLE mantenimiento (
    id_mantenimiento SERIAL PRIMARY KEY,
    id_orden INT REFERENCES orden_trabajo(id_orden) ON DELETE CASCADE,
    tipo_mantenimiento VARCHAR(100) NOT NULL,
    fecha DATE NOT NULL,
    lugar VARCHAR(100)
);


-- 3. TABLAS DEL MÓDULO DE INVENTARIO DE ROLLOS


CREATE TABLE ubicacion (
    id_ubicacion SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    zona VARCHAR(100)
);

CREATE TABLE rollo (
    id_rollo SERIAL PRIMARY KEY,
    peso NUMERIC(10,2) NOT NULL,
    estado VARCHAR(50) NOT NULL, -- Disponible, Cargado, Entregado
    id_ubicacion INT REFERENCES ubicacion(id_ubicacion) ON DELETE SET NULL
);

CREATE TABLE movimiento_rollo (
    id_movimiento SERIAL PRIMARY KEY,
    id_rollo INT REFERENCES rollo(id_rollo) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(50) NOT NULL, -- Entrada, Salida
    cantidad INT NOT NULL,
    observacion TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 4. TABLAS DEL MÓDULO DE VIAJES Y LOGÍSTICA


CREATE TABLE conductor (
    id_conductor SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    estado VARCHAR(50) NOT NULL, -- Activo, Inactivo, En viaje
    telefono VARCHAR(20)
);

CREATE TABLE ruta (
    id_ruta SERIAL PRIMARY KEY,
    destino VARCHAR(150) NOT NULL,
    fecha_salida DATE NOT NULL,
    fecha_entrega DATE,
    estado VARCHAR(50) NOT NULL -- Programada, En Ruta, Completada
);

CREATE TABLE entrega (
    id_entrega SERIAL PRIMARY KEY,
    id_ruta INT REFERENCES ruta(id_ruta) ON DELETE CASCADE,
    id_rollo INT REFERENCES rollo(id_rollo) ON DELETE CASCADE,
    cantidad INT NOT NULL,
    estado_entrega VARCHAR(50) NOT NULL -- Pendiente, Entregado, Rechazado
);


-- 5. TABLA DE BITÁCORA


CREATE TABLE registro_bitacora (
    id_bitacora BIGSERIAL PRIMARY KEY,
    id_usuario INT REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    username_historico VARCHAR(150),
    accion VARCHAR(50) NOT NULL,
    metodo VARCHAR(10) NOT NULL,
    ruta VARCHAR(255) NOT NULL,
    modulo VARCHAR(50) DEFAULT 'General',
    ip_origen INET,
    user_agent VARCHAR(255),
    codigo_respuesta INT,
    datos_enviados JSONB,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_registro_bitacora_fecha ON registro_bitacora(fecha_hora);


-- 1. Catálogo de Permisos del Sistema
INSERT INTO permiso (nombre_permiso, modulo) VALUES
('ver_usuarios', 'Usuarios'),
('ver_bodega', 'Bodega'),
('ver_taller', 'Taller'),
('ver_logistica', 'Logística')
ON CONFLICT (nombre_permiso, modulo) DO NOTHING;

-- 2. Catálogo de Roles del Sistema
INSERT INTO rol (nombre_rol) VALUES
('Administrador'),
('Bodeguero'),
('Taller'),
('Logística')
ON CONFLICT (nombre_rol) DO NOTHING;

-- 3. Asignación Permanente de Permisos a Roles
INSERT INTO rol_permiso (id_rol, id_permiso) VALUES
(1, 1), -- Administrador -> ver_usuarios
(1, 2), -- Administrador -> ver_bodega
(1, 3), -- Administrador -> ver_taller
(1, 4), -- Administrador -> ver_logistica
(2, 2), -- Bodeguero     -> ver_bodega
(3, 3), -- Taller        -> ver_taller
(4, 4)  -- Logística     -> ver_logistica
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
