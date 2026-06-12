#!/bin/bash
# ============================================
# DiscordForge - Build Script para Vercel
# ============================================
# Detecta automáticamente si usar SQLite o PostgreSQL
# basándose en la variable DATABASE_URL
# ============================================

set -e

echo "🔧 DiscordForge Build Script"
echo "   DATABASE_URL starts with: $(echo $DATABASE_URL | cut -c1-20)..."

# Detectar tipo de base de datos
if echo "$DATABASE_URL" | grep -q "^postgres"; then
  echo "📡 Detectada base de datos PostgreSQL"
  # Cambiar provider a PostgreSQL
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
  echo "   ✅ Schema cambiado a PostgreSQL"
else
  echo "📁 Detectada base de datos SQLite (desarrollo local)"
fi

# Generar cliente de Prisma
echo "📦 Generando Prisma Client..."
npx prisma generate

# Build de Next.js
echo "🏗️  Construyendo Next.js..."
npx next build

echo "✅ Build completado!"
