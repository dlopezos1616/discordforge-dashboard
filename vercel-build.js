// DiscordForge - Vercel Build Script
// Detects PostgreSQL vs SQLite and adjusts Prisma schema accordingly

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const dbUrl = process.env.DATABASE_URL || '';

console.log('🔧 DiscordForge Build Script');
console.log('   DATABASE_URL starts with:', dbUrl.substring(0, 20) + '...');

// Detect database type
if (dbUrl.startsWith('postgres')) {
  console.log('📡 Detected PostgreSQL database');
  let schema = fs.readFileSync(schemaPath, 'utf8');
  schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, schema);
  console.log('   ✅ Schema switched to PostgreSQL');
} else {
  console.log('📁 Detected SQLite database (local development)');
}

// Generate Prisma Client
console.log('📦 Generating Prisma Client...');
execSync('npx prisma generate', { stdio: 'inherit' });

// Build Next.js
console.log('🏗️  Building Next.js...');
execSync('npx next build', { stdio: 'inherit' });

console.log('✅ Build complete!');
