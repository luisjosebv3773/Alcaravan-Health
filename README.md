# Alcaraván Health

Alcaraván Health es una plataforma integral de gestión de salud diseñada para conectar pacientes con profesionales médicos y nutricionistas de manera eficiente. El sistema facilita la programación de citas, el seguimiento de métricas de salud, la gestión de historias clínicas y ofrece un asistente virtual potenciado por IA.

## 🚀 Características Principales

### 👥 Roles de Usuario
El sistema maneja tres roles principales con interfaces y funcionalidades personalizadas:
- **Pacientes**: Dashboard personal, solicitud de citas, visualización de historial médico y consultas con IA.
- **Médicos**: Panel clínico, gestión de agenda, historias médicas y configuración de perfil profesional.
- **Nutricionistas**: Dashboard especializado, evaluaciones nutricionales y seguimiento de pacientes.

### ✨ Funcionalidades Clave
- **Gestión de Citas**: Flujo completo para solicitar, agendar y cancelar citas (presenciales o virtuales).
- **Onboarding Profesional**: Flujo de registro validado para médicos y nutricionistas, incluyendo carga de credenciales y firmas digitales.
- **Dashboard Clínico**: Visualización de métricas de pacientes, historial de consultas y herramientas de evaluación.
- **Notificaciones en Tiempo Real**: Sistema de alertas integrado con Firebase Cloud Messaging (FCM).
- **Asistente IA (Gemini)**: Chatbot integrado para responder dudas generales de salud y navegar por la plataforma.
- **Evaluaciones Nutricionales**: Herramientas específicas para seguimiento de composición corporal y planes alimenticios.

## 🛠️ Stack Tecnológico

### Frontend
- **React 19**: Biblioteca UI principal.
- **Vite**: Build tool y entorno de desarrollo rápido.
- **Tailwind CSS**: Framework de estilos para un diseño moderno y responsivo.
- **React Router**: Manejo de navegación y rutas protegidas.

### Backend y Servicios
- **Supabase**:
  - **Base de Datos**: PostgreSQL para persistencia de datos relacional.
  - **Auth**: Gestión de usuarios y sesiones.
  - **Storage**: Almacenamiento de documentos (credenciales, firmas, avatares).
  - **Edge Functions**: Lógica de servidor serverless (opcional).
- **Firebase Cloud Messaging**: Para notificaciones push y en la app.
- **Google Gemini AI**: Motor de inteligencia artificial para el asistente virtual.

## 📂 Estructura del Proyecto

```
/
├── components/           # Componentes de UI (Dashboards, Formularios, etc.)
│   ├── ProfessionalOnboarding.tsx # Flujo de registro profesionales
│   ├── RequestAppointment.tsx     # Solicitud de citas pacientes
│   └── ...
├── services/             # Lógica de negocio y conectores de API
│   ├── supabase.ts       # Cliente Supabase
│   ├── firebase.ts       # Configuración FCM
│   └── geminiService.ts  # Cliente IA
├── supabase/             # Migraciones y scripts SQL
│   ├── migrations_onboarding.sql # Schema para onboarding
│   └── ...
├── types.ts              # Definiciones de tipos TypeScript globales
├── App.tsx               # Componente raíz y configuración de rutas
└── package.json          # Dependencias y scripts
```

## 🚦 Configuración e Instalación

1.  **Clonar el repositorio**
    ```bash
    git clone <repositorio>
    cd Alcaravan-Health
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Configuración de Variables de Entorno**
    Crea un archivo `.env` en la raíz basado en el `.env.example` (si existe) o con las siguientes variables:
    ```env
    VITE_SUPABASE_URL=tu_url_supabase
    VITE_SUPABASE_ANON_KEY=tu_clave_anonima
    VITE_FIREBASE_API_KEY=...
    # Otras credenciales necesarias
    ```

4.  **Ejecutar en Desarrollo**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:5173` o `http://localhost:3000`.

## 🗄️ Base de Datos (Supabase)

El sistema utiliza tablas relacionales clave:
- `profiles`: Almacena información extendida de usuarios (roles, credenciales, bio).
- `appointments`: Registro de citas médicas.
- `specialties` & `doctor_specialties`: Relación de especialidades médicas (Muchos a Muchos).
- `notificaciones`: Historial de alertas para usuarios.
- `evaluations`: Registros de evaluaciones nutricionales.

## 🔒 Seguridad

- **Row Level Security (RLS)**: Todas las tablas en Supabase tienen políticas RLS activas para asegurar que los usuarios solo accedan a los datos permitidos según su rol e ID.
- **Protección de Rutas**: El frontend implementa `AuthGuard` (en `App.tsx`) para redirigir usuarios no autenticados o sin permisos.

---
*Alcaraván Health - Innovación en Salud Digital*
