#!/usr/bin/env node

/**
 * Production: Import Seed Data
 * Use this to populate the live database with initial users, products, addresses, etc.
 * Run once after schema is initialized
 */

import "dotenv/config.js";
import { query } from "./db.js";
import fs from "fs";

const seedData = {
  // Admin role with full permissions
  adminRole: `
    INSERT INTO admin_roles (name, permissions)
    VALUES ('Super Admin', '{"view_products": true, "edit_products": true, "view_orders": true, "edit_orders": true, "view_customers": true, "manage_customers": true, "manage_team": true, "view_analytics": true, "manage_settings": true}'::jsonb)
    ON CONFLICT (name) DO NOTHING;
  `,

  // Production users
  users: [
    {
      id: 2,
      name: "Admin",
      email: "admin@priyasafashion.com",
      phone: "9650841442",
      passwordHash:
        "7443e9a00c30b2697c5036998c4eec83:39a34a7fc75da9ee35ae4cfedac275d0a6f1116b98c7bfd65aec1cac91eff783571f284fb5fdd7ac3216ae6b100204875b812608cbda94dd4d75c4d7df9135ee",
      role: "admin",
    },
  ],

  // Sample jewelry products
  products: [
    {
      id: "p_bang_kavi",
      title: "Kavi Charm Bracelet",
      category: "Bangles",
      tagline: "Start with one charm",
      description:
        "A fine chain bracelet designed to grow — add a charm for every year, or leave it as it is.",
      price: "5.00",
      discount: "0.00",
      images: [
        "https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?q=80&w=1200&auto=format&fit=crop",
      ],
      material: "925 silver",
      stock: 40,
    },
    {
      id: "p_bang_tara",
      title: "Tara Cuff Bangle",
      category: "Bangles",
      tagline: "One piece, hand-hammered",
      description:
        "Cut from a single sheet and hand-hammered for texture, the Tara cuff is adjustable to most wrist sizes.",
      price: "10.00",
      discount: "5.00",
      images: [
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1200&auto=format&fit=crop",
      ],
      material: "Brass, 18k gold plated",
      stock: 14,
    },
    {
      id: "p_neck_iris",
      title: "Iris Pearl Strand",
      category: "Necklaces",
      tagline: "Freshwater pearls, hand-knotted",
      description:
        "Each pearl is individually knotted on silk thread — the traditional way, so a broken strand never means a lost necklace.",
      price: "1.00",
      discount: "0.00",
      images: ["https://i.postimg.cc/0yrSx6Dw/necklace1.png"],
      material: "Freshwater pearl, silk thread",
      stock: 20,
    },
    {
      id: "p_ring_amara",
      title: "Amara Solitaire Ring",
      category: "Rings",
      tagline: "A single stone, quietly stated",
      description:
        "Hand-set in 18k gold vermeil, the Amara carries one lab-grown solitaire on a tapered band. Comfortable enough for every day, formal enough for the nights that matter.",
      price: "1.00",
      discount: "10.00",
      images: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1200&auto=format&fit=crop",
      ],
      material: "18k gold vermeil, lab-grown diamond",
      stock: 12,
    },
  ],

  // Admin manager
  adminUsers: [
    {
      id: 1,
      name: "Manager",
      email: "prateekarya100@gmail.com",
      passwordHash:
        "d28bab5a69d41659299963b613a505b2:a2b80d7d3cc3bb521d6c08774dec4b71bd24333df01857e8577d4d8b500e2d37858f918bd9637be0c4aa16c78319098737eb0a6f81513b4a1b34d9d84dd5df51",
      roleId: 1,
    },
  ],

  // Sample delivery address
  addresses: [
    {
      userId: 1,
      label: "Home",
      name: "Prateek Arya",
      phone: "9650841442",
      address: "C 25 MOTIKUNJ EXTENSION",
      city: "Mathura",
      state: "Uttar Pradesh",
      pincode: "281001",
      isDefault: true,
    },
  ],
};

async function importSeedData() {
  console.log("\n🚀 Importing production seed data...\n");

  try {
    // 1. Admin role
    console.log("→ Creating admin role...");
    await query(seedData.adminRole);
    console.log("✓ Admin role created\n");

    // 2. Users
    console.log("→ Importing users...");
    for (const user of seedData.users) {
      await query(
        `
        INSERT INTO users (id, name, email, phone, password_hash, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        ON CONFLICT (email) DO NOTHING
        `,
        [
          user.id,
          user.name,
          user.email,
          user.phone,
          user.passwordHash,
          user.role,
        ],
      );
    }
    console.log(`✓ ${seedData.users.length} user(s) imported\n`);

    // 3. Products
    console.log("→ Importing products...");
    for (const product of seedData.products) {
      await query(
        `
        INSERT INTO products
        (id, title, category, tagline, description, price, discount, images, material, stock)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
        `,
        [
          product.id,
          product.title,
          product.category,
          product.tagline,
          product.description,
          product.price,
          product.discount,
          product.images,
          product.material,
          product.stock,
        ],
      );
    }
    console.log(`✓ ${seedData.products.length} product(s) imported\n`);

    // 4. Admin users
    console.log("→ Importing admin staff...");
    for (const adminUser of seedData.adminUsers) {
      await query(
        `
        INSERT INTO admin_users (id, name, email, password_hash, role_id, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (email) DO NOTHING
        `,
        [
          adminUser.id,
          adminUser.name,
          adminUser.email,
          adminUser.passwordHash,
          adminUser.roleId,
        ],
      );
    }
    console.log(
      `✓ ${seedData.adminUsers.length} admin staff member(s) imported\n`,
    );

    // 5. Sample address
    console.log("→ Importing addresses...");
    for (const address of seedData.addresses) {
      await query(
        `
        INSERT INTO addresses (user_id, label, name, phone, address, city, state, pincode, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
        `,
        [
          address.userId,
          address.label,
          address.name,
          address.phone,
          address.address,
          address.city,
          address.state,
          address.pincode,
          address.isDefault,
        ],
      );
    }
    console.log(`✓ ${seedData.addresses.length} address(es) imported\n`);

    console.log("✨ Seed data import complete!\n");
    console.log("📊 Database ready for production use.");
    process.exit(0);
  } catch (e) {
    console.error(`\n❌ Error: ${e.message}`);
    process.exit(1);
  }
}

importSeedData();
