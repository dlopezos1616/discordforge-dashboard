#!/bin/bash
# ============================================
# DiscordForge - Script de Pre-Deploy para Vercel
# ============================================
# Este script prepara el proyecto para deploy en Vercel:
# 1. Cambia Prisma de SQLite a PostgreSQL
# 2. Genera el cliente de Prisma
# ============================================

set -e

echo "🚀 Preparando DiscordForge para Vercel..."
echo ""

# Cambiar provider de SQLite a PostgreSQL en schema.prisma
echo "📝 Cambiando Prisma de SQLite a PostgreSQL..."
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
echo "   ✅ Schema actualizado a PostgreSQL"

echo ""
echo "✅ ¡Proyecto listo para Vercel!"
echo ""
echo "📋 Siguientes pasos:"
echo "   1. Asegúrate de tener DATABASE_URL apuntando a PostgreSQL en Vercel"
echo "   2. Haz push a GitHub"
echo "   3. Vercel build command: prisma generate && next build"
echo ""
echo "⚠️  NOTA: Si quieres volver a desarrollo local con SQLite, ejecuta:"
echo "   sed -i 's/provider = \"postgresql\"/provider = \"sqlite\"/' prisma/schema.prisma"
