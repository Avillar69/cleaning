# KD Cleaning - Sistema de Gestión de Limpieza

Sistema moderno de gestión de limpieza construido con React, TypeScript, Supabase y Chakra UI.

## 🚀 Características

- **Autenticación segura** con Supabase Auth
- **Base de datos PostgreSQL** con Row Level Security
- **Interfaz moderna** con Chakra UI
- **Responsive design** para móviles y desktop
- **Gestión completa** de:
  - Personal/Trabajadores
  - Clientes
  - Unidades y tipos de unidades
  - Servicios de limpieza
  - Pagos
  - Facturas
  - Reportes

## 🛠️ Tecnologías

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Chakra UI, Emotion
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Routing**: React Router DOM
- **Icons**: Chakra UI Icons

## 📋 Prerrequisitos

- Node.js 18+ 
- Cuenta de Supabase
- Git

## ⚙️ Configuración

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd Nvix_Cleaning2
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

1. Crear un nuevo proyecto en [Supabase](https://supabase.com)
2. Ir a Settings > API
3. Copiar la URL del proyecto y la clave anónima
4. Crear un archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. Configurar la base de datos

1. Ir a SQL Editor en tu proyecto de Supabase
2. Ejecutar el script `supabase-schema.sql` que está en la raíz del proyecto
3. Esto creará todas las tablas, índices, políticas RLS y triggers necesarios

### 5. Ejecutar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📊 Estructura de la Base de Datos

### Tablas principales:

- **unit_types**: Tipos de unidades (departamento, casa, etc.)
- **clients**: Clientes
- **units**: Unidades de limpieza
- **workers**: Personal/trabajadores
- **extras**: Servicios adicionales
- **services**: Servicios de limpieza
- **payments**: Pagos a trabajadores
- **invoices**: Facturas
- **user_config**: Configuración del usuario

### Características de seguridad:

- **Row Level Security (RLS)** habilitado en todas las tablas
- **Políticas de acceso** que garantizan que los usuarios solo vean sus propios datos
- **Triggers automáticos** para actualizar timestamps
- **Índices optimizados** para mejor rendimiento

## 🎨 Diseño

El sistema utiliza Chakra UI con un tema personalizado que incluye:

- **Colores**: Paleta de azules profesionales
- **Tipografía**: Inter font para mejor legibilidad
- **Componentes**: Diseño consistente y accesible
- **Responsive**: Adaptable a móviles y desktop

## 📱 Funcionalidades

### Dashboard
- Resumen de estadísticas
- Acceso rápido a todas las secciones
- Métricas clave del negocio

### Gestión de Personal
- CRUD completo de trabajadores
- Tarifas por hora y por unidad
- Información de contacto

### Gestión de Clientes
- CRUD completo de clientes
- Información de contacto y direcciones
- Notas adicionales

### Servicios
- Programación de servicios
- Asignación de trabajadores
- Cálculo automático de costos
- Tipos de servicio (Departure Clean, Prearrival, Touch Up, etc.)

### Pagos
- Registro de pagos a trabajadores
- Asociación con servicios
- Números de operación

### Facturas
- Generación automática de números correlativos
- Estados de facturación
- Asociación con servicios

## 🔧 Desarrollo

### Estructura del proyecto:

```
src/
├── components/          # Componentes reutilizables
├── contexts/           # Contextos de React (Auth, Data)
├── lib/               # Configuración de Supabase
├── pages/            # Páginas de la aplicación
├── types/             # Definiciones de TypeScript
└── App.tsx           # Componente principal
```

### Scripts disponibles:

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Vista previa de producción
npm run lint         # Linter de código
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conectar el repositorio a Vercel
2. Configurar las variables de entorno
3. Desplegar automáticamente

### Netlify

1. Conectar el repositorio a Netlify
2. Configurar build command: `npm run build`
3. Configurar publish directory: `dist`
4. Configurar las variables de entorno

## 📝 Notas importantes

- **Autenticación**: El sistema usa Supabase Auth con email/password
- **Seguridad**: Todas las operaciones están protegidas por RLS
- **Escalabilidad**: Diseñado para manejar múltiples usuarios
- **Performance**: Optimizado con índices y consultas eficientes

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisar la documentación de [Supabase](https://supabase.com/docs)
2. Revisar la documentación de [Chakra UI](https://chakra-ui.com/docs)
3. Crear un issue en el repositorio

---

**Desarrollado con ❤️ para la gestión eficiente de servicios de limpieza**
