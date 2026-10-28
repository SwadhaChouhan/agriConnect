import 'dotenv/config';
/**
 * seedAdmin.js — One-time script to create an admin user in MongoDB
 * ─────────────────────────────────────────────────────────────────
 * Usage:
 *   npm run seed:admin
 *
 * Environment variables are loaded from the .env file (MONGO_URI).
 * The script is safe to re-run — it will skip creation if the email
 * already exists in the database.
 */

import mongoose from 'mongoose';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import User from '../models/User.js';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const prompt = async (rl, question, defaultValue = '') => {
  const answer = await rl.question(question);
  return answer.trim() || defaultValue;
};

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */
async function seedAdmin() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌  MONGO_URI is not set in your .env file. Aborting.');
    process.exit(1);
  }

  console.log('\n🌱  AgriConnect — Admin Seed Script (MongoDB)');
  console.log('────────────────────────────────────────────\n');

  await mongoose.connect(mongoUri);
  console.log('✅  Connected to MongoDB\n');

  // Gather admin credentials (support env vars or interactive prompt)
  let name = process.env.ADMIN_NAME;
  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    const rl = readline.createInterface({ input, output });
    name     = name || await prompt(rl, 'Admin name     [AgriConnect Admin]: ', 'AgriConnect Admin');
    email    = email || await prompt(rl, 'Admin email    [admin@agriconnect.in]: ', 'admin@agriconnect.in');
    password = password || await prompt(rl, 'Admin password [min 8 chars]: ');
    rl.close();
  }

  if (!password || password.length < 8) {
    console.error('\n❌  Password must be at least 8 characters. Aborting.');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Check for duplicate
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    if (existing.role === 'admin') {
      console.log(`\n⚠️   An admin with email "${email}" already exists. Skipping.`);
    } else {
      console.log(`\n⚠️   A user with email "${email}" exists but has role "${existing.role}".`);
      console.log('     To promote them, run:\n');
      console.log(`     db.users.updateOne({ email: "${email}" }, { $set: { role: "admin" } })`);
    }
    await mongoose.disconnect();
    return;
  }

  // Create admin — password hashed by the User pre-save hook
  const admin = new User({
    name,
    email,
    password,
    role: 'admin',
  });

  await admin.save();

  console.log(`\n✅  Admin created successfully!`);
  console.log(`    Name  : ${admin.name}`);
  console.log(`    Email : ${admin.email}`);
  console.log(`    Role  : ${admin.role}`);
  console.log(`    ID    : ${admin._id}\n`);

  await mongoose.disconnect();
  console.log('🔌  Disconnected from MongoDB. Done.\n');
}

seedAdmin().catch(async (err) => {
  console.error('❌  Seed script failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
