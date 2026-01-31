# Alcaraván Health

Alcaraván Health es una plataforma integral de gestión de salud diseñada para conectar pacientes con profesionales médicos y nutricionistas de manera eficiente. El sistema facilita la programación de citas, el seguimiento de métricas de salud, la gestión de historias clínicas y ofrece un ecosistema de IA avanzada para la asistencia médica.

## 🚀 Características Principales

### 👥 Roles de Usuario
El sistema maneja cuatro roles principales con interfaces y funcionalidades personalizadas:
- **Pacientes**: Dashboard personal, solicitud de citas, visualización de historial médico y consultas con IA.
- **Médicos**: Panel clínico, gestión de agenda, historias médicas normalizadas y configuración de perfil profesional.
- **Nutricionistas**: Dashboard especializado, evaluaciones nutricionales y seguimiento de pacientes.
- **Administradores**: Panel de control global, gestión de usuarios avanzada (RBAC) y auditoría técnica de perfiles.

### ✨ Funcionalidades Clave
- **Inteligencia Artificial (Gemini Core)**: 
    - **Asistente Virtual**: Chatbot integrado para responder dudas de salud y navegación.
    - **Gestión Autónoma**: Capacidad de la IA para buscar y gestionar citas médicas mediante Edge Functions.
- **Gestión de Consultas Normalizada**: Nuevo esquema de almacenamiento de signos vitales (presión, frecuencia, etc.) en columnas planas para analítica avanzada.
- **Recetario Digital**: Tabla dedicada de `prescriptions` para un seguimiento preciso de tratamientos farmacológicos.
- **Administración Pro**: Vista detallada de usuario para administradores con edición de perfiles, roles y estados de verificación en tiempo real.
- **Onboarding y Verificación**: Proceso de registro validado para profesionales con estados de auditoría administrativa.
- **Notificaciones Multi-Canal**: Notificaciones push y en-app vía Firebase Cloud Messaging (FCM) y Supabase Realtime.
- **Telemedicina**: Soporte integrado para videollamadas vía Google Meet.

## 🛠️ Stack Tecnológico

### Frontend
- **React 19**: Biblioteca UI principal.
- **Vite**: Build tool y entorno de desarrollo.
- **Tailwind CSS**: Estilizado responsivo con soporte para modo oscuro "Emerald".
- **React Router**: Navegación SPA y rutas protegidas.

### Backend y Servicios (Serverless Architecture)
- **Supabase**:
  - **PostgreSQL**: Base de datos relacional con RLS.
  - **Edge Functions (Deno)**: Lógica serverless para integración con IA (Gemini) y orquestación de servicios.
  - **Auth**: Gestión de identidades y JWT.
  - **Storage**: Gestión de expedientes y avatares.
- **Firebase Cloud Messaging**: Notificaciones push distribuidas.
- **Google Gemini 1.5 Pro/Flash**: Motor de IA generativa para lógica médica y asistente.

## 📂 Estructura del Proyecto

```
/
├── components/           # Componentes de UI y Vistas
│   ├── AdminUserDetail.tsx        # Edición avanzada de usuarios (Admin)
│   ├── Consultation.tsx           # Interfaz de consulta médica (Doctor)
│   ├── AppointmentDetails.tsx     # Vista detallada de citas (Paciente/Doctor)
│   └── ...
├── services/             # Lógica de negocio y conectores de API
│   ├── geminiService.ts  # Cliente IA y herramientas de función
│   └── supabase.ts       # Configuración cliente Supabase
├── supabase/             # Backend Edge de Supabase
│   ├── functions/        # Edge Functions (gemini-chat, manage-appointment)
│   └── migrations/       # Scripts SQL y evolución del esquema
├── App.tsx               # Orquestador de rutas y seguridad
└── package.json          # Dependencias (React 19, Lucide, Framer Motion)
```

## 🗄️ Base de Datos (Evolución del Esquema)

El sistema utiliza un diseño de base de datos robusto y normalizado:
- `profiles`: Datos de usuario, roles y estado de verificación.
- `consultations`: Registros médicos detallados con signos vitales planos (`bp_systolic`, `heart_rate`, `temp_c`, etc.).
- `prescriptions`: Tabla dedicada para medicamentos (Dosis, Frecuencia, Duración).
- `appointments`: Gestión de estados de citas (Pending, Confirmed, Completed, Cancelled).
- `diagnosticos_cie10`: Catálogo local de diagnósticos para búsqueda rápida.

## 🔒 Seguridad y Privacidad

- **JWT Auth**: Todas las comunicaciones entre Frontend y Edge Functions están protegidas por JSON Web Tokens.
- **Row Level Security (RLS)**: Las políticas de base de datos garantizan que solo el dueño del dato (o su médico autorizado) pueda leer/escribir información sensible.
- **Auditoría**: Registro de actividad para cambios de estados críticos en perfiles y citas.

---
*Alcaraván Health - Transformando la atención médica con Innovación Digital*
