-- Fofo Green ('fofogreen') Core PostgreSQL Migration Schema
-- Engine: PostgreSQL 16 (Google Cloud SQL europe-west2)
-- Generated for Drizzle ORM / Drizzle Kit Migration Pipeline

CREATE TABLE IF NOT EXISTS "categories" (
  "id" SERIAL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "name_rw" TEXT,
  "icon" TEXT NOT NULL,
  "description" TEXT,
  "item_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "uid" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "role" TEXT NOT NULL DEFAULT 'customer',
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "products" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL REFERENCES "categories"("slug"),
  "price" INTEGER NOT NULL,
  "old_price" INTEGER,
  "spec" TEXT NOT NULL,
  "rating" TEXT NOT NULL DEFAULT '5.0',
  "reviews_count" INTEGER NOT NULL DEFAULT 0,
  "image" TEXT NOT NULL,
  "badge" TEXT,
  "origin" TEXT NOT NULL,
  "farmer" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "in_stock" BOOLEAN NOT NULL DEFAULT TRUE,
  "calories" TEXT,
  "harvested" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "farm_passports" (
  "id" SERIAL PRIMARY KEY,
  "product_id" INTEGER NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "cooperative_name" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "elevation" TEXT NOT NULL,
  "soil_type" TEXT NOT NULL,
  "lead_farmer" TEXT NOT NULL,
  "harvest_time" TEXT NOT NULL,
  "batch_number" TEXT NOT NULL,
  "rsb_certification" TEXT NOT NULL,
  "pesticide_free" BOOLEAN DEFAULT TRUE,
  "water_source" TEXT NOT NULL,
  "farmer_story" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" TEXT PRIMARY KEY,
  "customer_name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "items_json" TEXT NOT NULL,
  "subtotal" INTEGER NOT NULL,
  "discount" INTEGER NOT NULL DEFAULT 0,
  "delivery_fee" INTEGER NOT NULL DEFAULT 1500,
  "total" INTEGER NOT NULL,
  "payment_method" TEXT NOT NULL DEFAULT 'mtn',
  "address" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "courier_name" TEXT,
  "courier_phone" TEXT,
  "courier_vehicle" TEXT,
  "estimated_minutes" INTEGER DEFAULT 35,
  "temperature_celsius" INTEGER DEFAULT 4,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" SERIAL PRIMARY KEY,
  "order_id" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "product_id" INTEGER NOT NULL REFERENCES "products"("id"),
  "product_name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unit_price" INTEGER NOT NULL,
  "total_price" INTEGER NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "delivery_zones" (
  "id" SERIAL PRIMARY KEY,
  "district_name" TEXT NOT NULL UNIQUE,
  "tariff_frw" INTEGER NOT NULL DEFAULT 1500,
  "estimated_eta" TEXT NOT NULL,
  "active_riders" INTEGER NOT NULL DEFAULT 6,
  "coverage_notes" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "meal_kits" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "name_rw" TEXT,
  "tagline" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "prep_time" TEXT NOT NULL,
  "servings" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL DEFAULT 'Easy',
  "price" INTEGER NOT NULL,
  "image" TEXT NOT NULL,
  "ingredients_json" TEXT NOT NULL,
  "instructions_json" TEXT NOT NULL,
  "farmer_partner" TEXT NOT NULL,
  "in_stock" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "reviews" (
  "id" SERIAL PRIMARY KEY,
  "product_id" INTEGER REFERENCES "products"("id") ON DELETE SET NULL,
  "name" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "product_name" TEXT NOT NULL,
  "verified" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "activities" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "detail" TEXT NOT NULL,
  "time" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "actor" TEXT NOT NULL,
  "actor_role" TEXT NOT NULL DEFAULT 'customer',
  "metadata_json" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "schema_migrations" (
  "id" SERIAL PRIMARY KEY,
  "version" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "applied_at" TIMESTAMP DEFAULT NOW(),
  "details" TEXT
);

CREATE TABLE IF NOT EXISTS "store_settings" (
  "id" SERIAL PRIMARY KEY,
  "store_name" TEXT NOT NULL DEFAULT 'Fofo Green',
  "currency" TEXT NOT NULL DEFAULT 'FRW',
  "min_order_amount" INTEGER NOT NULL DEFAULT 3000,
  "free_delivery_threshold" INTEGER NOT NULL DEFAULT 25000,
  "support_phone" TEXT NOT NULL DEFAULT '+250 788 123 456',
  "support_email" TEXT NOT NULL DEFAULT 'hello@fofogreen.rw',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);
