import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import User from '../models/User.js';
import Subreddit from '../models/Subreddit.js';
import Thread from '../models/Thread.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');

dotenv.config({ path: path.join(projectRoot, '.env') });

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(list) {
  return list[randomInt(0, list.length - 1)];
}

function buildDateFromOffset(offsetDays) {
  const safeOffset = Number.isInteger(offsetDays)
    ? Math.min(59, Math.max(0, offsetDays))
    : randomInt(0, 59);

  const timestamp = Date.now() - safeOffset * 24 * 60 * 60 * 1000;
  return new Date(timestamp);
}

async function readJsonArray(fileName) {
  const filePath = path.join(dataDir, fileName);
  const raw = await fs.readFile(filePath, 'utf-8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`${fileName} must contain a JSON array.`);
  }

  return parsed;
}

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Add it to your .env file.');
  }

  console.log('[1/6] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
}

async function clearCollections() {
  console.log('[2/6] Clearing existing collections...');

  // Delete child documents first to keep cleanup safe if relations are enforced later.
  await Promise.all([
    Thread.deleteMany({}),
    Subreddit.deleteMany({}),
    User.deleteMany({}),
  ]);

  console.log('Existing data cleared');
}

async function seedUsers() {
  console.log('[3/6] Seeding users...');

  const usersRaw = await readJsonArray('users.json');
  const userDocs = usersRaw.map((user) => ({
    name: user.name,
    email: user.email,
    password: user.password,
    createdAt: buildDateFromOffset(user.createdAtOffsetDays),
  }));

  const insertedUsers = await User.insertMany(userDocs, { ordered: true });
  const userByEmail = new Map(insertedUsers.map((u) => [u.email, u]));

  console.log(`Inserted ${insertedUsers.length} users`);
  return userByEmail;
}

async function seedSubreddits(userByEmail) {
  console.log('[4/6] Seeding subreddits...');

  const subsRaw = await readJsonArray('subreddits.json');
  const subredditDocs = subsRaw.map((sub) => {
    const author = userByEmail.get(sub.authorEmail);

    if (!author) {
      throw new Error(`No user found for subreddit authorEmail: ${sub.authorEmail}`);
    }

    return {
      name: sub.name,
      description: sub.description,
      author: author._id,
      createdAt: buildDateFromOffset(sub.createdAtOffsetDays),
    };
  });

  const insertedSubreddits = await Subreddit.insertMany(subredditDocs, { ordered: true });
  const subredditByName = new Map(insertedSubreddits.map((s) => [s.name, s]));

  console.log(`Inserted ${insertedSubreddits.length} subreddits`);
  return subredditByName;
}

async function seedThreads(userByEmail, subredditByName) {
  console.log('[5/6] Seeding threads...');

  const threadsRaw = await readJsonArray('threads.json');
  const userList = Array.from(userByEmail.values());

  const threadDocs = threadsRaw.map((thread) => {
    const subreddit = subredditByName.get(thread.subredditName);

    if (!subreddit) {
      throw new Error(`No subreddit found for thread subredditName: ${thread.subredditName}`);
    }

    const author = randomFrom(userList);
    const upvotes = randomInt(0, 300);
    const downvotes = randomInt(0, 120);

    return {
      title: thread.title,
      content: thread.content,
      author: author._id,
      subreddit: subreddit._id,
      upvotes,
      downvotes,
      voteCount: upvotes - downvotes,
      createdAt: buildDateFromOffset(thread.createdAtOffsetDays),
    };
  });

  const insertedThreads = await Thread.insertMany(threadDocs, { ordered: true });
  console.log(`Inserted ${insertedThreads.length} threads`);
}

async function seed() {
  try {
    await connectDatabase();
    await clearCollections();

    const userByEmail = await seedUsers();
    const subredditByName = await seedSubreddits(userByEmail);
    await seedThreads(userByEmail, subredditByName);

    console.log('[6/6] Seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();
