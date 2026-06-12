# 🚀 Guía de Deploy a Vercel - DiscordForge Dashboard

## Resumen de la Arquitectura en Producción

```
┌──────────────────┐       ┌───────────────────┐       ┌──────────────────┐
│   VERCEL         │       │   RAILWAY/RENDER   │       │   NEON/SUPABASE  │
│                  │       │   (o VPS)          │       │   (PostgreSQL)   │
│  Next.js         │  WS   │                    │       │                  │
│  Dashboard       │◄─────►│  WS Bridge (3003)  │       │  Base de datos   │
│  (Frontend+API)  │       │  Discord Bot       │       │                  │
│                  │       │                    │       │                  │
└────────┬─────────┘       └────────┬──────────┘       └────────┬─────────┘
         │                          │                           │
         │  REST API                │  Discord Gateway          │
         └──────────────────────────┴───────────────────────────┘
                        Comparten la misma DB PostgreSQL
```

**Vercel solo aloja el Next.js Dashboard.** El Discord Bot y el WS Bridge se despliegan aparte.

> 💡 **El proyecto detecta automáticamente el tipo de base de datos:**
> - Si `DATABASE_URL` empieza con `postgres://` → usa PostgreSQL (para Vercel)
> - Si empieza con `file:` → usa SQLite (para desarrollo local)

---

## PASO 1: Preparar la Base de Datos PostgreSQL

Vercel no soporta SQLite (sistema de archivos efímero). Necesitas PostgreSQL.

### Opción A: Neon Database (Recomendado - Gratis)
1. Ve a https://neon.tech y créate una cuenta
2. Crea un nuevo proyecto → Te da una conexión string:
   ```
   postgresql://neondb_owner:xxxxx@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Copia esta URL, la necesitarás después

### Opción B: Supabase (Gratis)
1. Ve a https://supabase.com y créate una cuenta
2. Crea un nuevo proyecto
3. Ve a Settings → Database → Connection string → Copia la URI

### Opción C: Vercel Postgres
1. En tu dashboard de Vercel → Storage → Create Database → Postgres
2. Te da la URL automáticamente

---

## PASO 2: Subir el código a GitHub

### 2.1 Inicializar Git (si no lo tienes)
```bash
cd /home/z/my-project
git init
git add .
git commit -m "DiscordForge Dashboard - Ready for Vercel"
```

### 2.2 Crear repo en GitHub
1. Ve a https://github.com/new
2. Crea un repositorio (ej: `discordforge-dashboard`)
3. NO inicialices con README

### 2.3 Subir el código
```bash
git remote add origin https://github.com/TU_USUARIO/discordforge-dashboard.git
git branch -M main
git push -u origin main
```

---

## PASO 3: Deploy en Vercel

### 3.1 Conectar Vercel con GitHub
1. Ve a https://vercel.com y créate una cuenta (o loguéate con GitHub)
2. Click en **"Add New..."** → **"Project"**
3. Selecciona tu repositorio `discordforge-dashboard`
4. Click en **"Import"**

### 3.2 Configurar el proyecto
En la pantalla de configuración:

| Setting | Valor |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `.` (dejar por defecto) |
| **Build Command** | Dejar por defecto (usa `vercel.json`) |
| **Output Directory** | Dejar vacío, se autodetecta |
| **Install Command** | Dejar por defecto (usa `vercel.json`) |

### 3.3 Añadir Variables de Entorno
En la misma pantalla, ve a **"Environment Variables"** y añade:

| Nombre | Valor | Nota |
|--------|-------|------|
| `DATABASE_URL` | `postgresql://neondb_owner:xxxxx@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require` | Tu URL de PostgreSQL |
| `NEXT_PUBLIC_WS_URL` | (dejar vacío por ahora) | URL del WS Bridge, ver Paso 5 |

### 3.4 Deploy
Click en **"Deploy"** y espera a que termine (2-3 minutos).

---

## PASO 4: Inicializar la Base de Datos

Después del primer deploy, las tablas aún no existen. Necesitas crearlas:

### Opción A: Desde tu PC local
```bash
# Apuntar temporalmente a PostgreSQL
export DATABASE_URL="postgresql://neondb_owner:xxxxx@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Temporalmente cambiar el schema a postgresql
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# Crear las tablas
npx prisma db push

# Volver a SQLite para desarrollo local
sed -i 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.prisma
```

### Opción B: Semilla de datos demo
Una vez creadas las tablas, visita:
```
https://TU-PROYECTO.vercel.app/api/seed
```
Esto creará datos de ejemplo en la base de datos.

---

## PASO 5: Desplegar el WS Bridge + Discord Bot

El WS Bridge y el Bot NO van en Vercel. Necesitas alojarlos aparte.

### Opción A: Railway (Recomendado - Más fácil)

#### 5.1 Desplegar WS Bridge
1. Ve a https://railway.app y conéctate con GitHub
2. **"New Project"** → **"Deploy from GitHub repo"**
3. Selecciona tu repo, pero configura:
   - **Root Directory**: `mini-services/ws-bridge`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.ts`
4. Añade la variable de entorno:
   - `PORT` = `3003`

#### 5.2 Desplegar Discord Bot
1. En el mismo proyecto de Railway → **"New Service"** → **"Deploy from GitHub repo"**
2. Configura:
   - **Root Directory**: `mini-services/discord-bot`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `node --import tsx src/index.ts`
3. Añade las variables de entorno:
   - `DISCORD_BOT_TOKEN` = tu token del bot
   - `DISCORD_CLIENT_ID` = tu client ID
   - `DATABASE_URL` = la misma URL de PostgreSQL
   - `WS_BRIDGE_URL` = la URL del WS Bridge en Railway

### Opción B: Render
1. Ve a https://render.com
2. Crea un **Web Service** para el WS Bridge
3. Crea un **Background Worker** para el Discord Bot
4. Configura las mismas variables de entorno

### Opción C: VPS (DigitalOcean, Hetzner, etc.)
```bash
# En tu VPS
git clone https://github.com/TU_USUARIO/discordforge-dashboard.git
cd discordforge-dashboard

# Instalar dependencias del WS Bridge
cd mini-services/ws-bridge && npm install

# Instalar dependencias del Bot
cd ../discord-bot && npm install && npx prisma generate

# Ejecutar con PM2
npm install -g pm2
pm2 start mini-services/ws-bridge/index.ts --name ws-bridge
pm2 start mini-services/discord-bot/src/index.ts --name discord-bot
pm2 save
pm2 startup
```

---

## PASO 6: Conectar Dashboard con el WS Bridge

### 6.1 Obtener la URL del WS Bridge
Dependiendo de dónde lo alojaste:
- **Railway**: `https://ws-bridge-production-xxxx.up.railway.app`
- **Render**: `https://ws-bridge-xxxx.onrender.com`
- **VPS**: `http://TU_IP:3003`

### 6.2 Actualizar variable en Vercel
1. Ve a tu proyecto en Vercel → **Settings** → **Environment Variables**
2. Añade o actualiza:
   - `NEXT_PUBLIC_WS_URL` = `https://ws-bridge-production-xxxx.up.railway.app`
3. Redeploy: **Deployments** → Click en los `...` del último deploy → **Redeploy**

### 6.3 Actualizar CORS en el WS Bridge
En `mini-services/ws-bridge/index.ts`, cambia:
```typescript
cors: {
  origin: '*', // Cambiar a:
  origin: ['https://TU-PROYECTO.vercel.app'],
  methods: ['GET', 'POST'],
},
```

### 6.4 Actualizar el Bot para conectar al WS Bridge
Asegúrate de que el Bot tenga la variable `WS_BRIDGE_URL` apuntando al WS Bridge en producción.

---

## PASO 7: Verificar que todo funciona

1. ✅ **Dashboard**: Abre `https://TU-PROYECTO.vercel.app` → Debería cargar el login
2. ✅ **Login**: Click en "Iniciar Sesión" → Debería redirigir al dashboard
3. ✅ **Bot Status**: Ve a "Estado del Bot" → Debería mostrar si el bot está online
4. ✅ **WebSocket**: Si el WS Bridge y el Bot están corriendo, debería mostrar "Conectado"

---

## 📁 Archivos Modificados para Vercel

| Archivo | Cambio |
|---------|--------|
| `next.config.ts` | Eliminado `output: "standalone"` (Vercel tiene su propio build) |
| `package.json` | Build: `prisma generate && next build`, añadido `postinstall` |
| `src/components/dashboard/BotStatusPanel.tsx` | WebSocket URL configurable via `NEXT_PUBLIC_WS_URL` |
| `build.sh` | Script que detecta PostgreSQL/SQLite automáticamente |
| `vercel.json` | Configuración de build para Vercel |
| `.vercelignore` | Excluye mini-services del build |
| `.env.example` | Documentación de todas las variables |
| `.gitignore` | Permite subir `.env.example` |

---

## 🔧 Troubleshooting

### Error: "Can't reach database server"
- Verifica que la `DATABASE_URL` sea correcta
- Asegúrate de que la IP de Vercel pueda acceder a tu base de datos

### Error: "Prisma Client could not be generated"
- Verifica que el `build.sh` se ejecuta correctamente
- Revisa los build logs en Vercel

### El WebSocket no conecta
- Verifica `NEXT_PUBLIC_WS_URL` en Vercel
- Verifica CORS en el WS Bridge
- Verifica que el WS Bridge esté corriendo

### El Bot no aparece online
- Verifica `WS_BRIDGE_URL` en el Bot
- Revisa los logs del Bot y del WS Bridge

### Build falla en Vercel
- Revisa los build logs
- Verifica que `build.sh` tiene permisos de ejecución: `git update-index --chmod=+x build.sh`
