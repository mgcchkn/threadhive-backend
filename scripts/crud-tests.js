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

dotenv.config({ path: path.join(projectRoot, '.env') });

const state = {
  createdUser: null,
  createdSubreddit: null,
  createdThread: null,
  bulkThreadIds: [],
  email: `crud-test-${Date.now()}@example.com`,
  subredditName: `crud-test-subreddit-${Date.now()}`,
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTest(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(error.message);
  }
}

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Add it to your .env file.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
}

async function cleanup() {
  await Thread.deleteMany({ _id: { $in: [state.createdThread?._id, ...state.bulkThreadIds].filter(Boolean) } });

  if (state.createdSubreddit?._id) {
    await Subreddit.deleteOne({ _id: state.createdSubreddit._id });
  }

  if (state.createdUser?._id) {
    await User.deleteOne({ _id: state.createdUser._id });
  }
}

async function runAllTests() {
  await runTest('1. Create user with required fields', async () => {
    state.createdUser = await User.create({
      name: 'CRUD Test User',
      email: state.email,
      password: 'password123',
      createdAt: new Date(),
    });

    assert(Boolean(state.createdUser?._id), 'Expected user to have an _id');
    assert(state.createdUser.email === state.email, 'Expected saved email to match');
  });

  await runTest('2. Reject duplicate user email', async () => {
    let duplicateRejected = false;

    try {
      await User.create({
        name: 'Duplicate User',
        email: state.email,
        password: 'password123',
        createdAt: new Date(),
      });
    } catch (error) {
      duplicateRejected = error?.code === 11000;
    }

    assert(duplicateRejected, 'Expected duplicate email to fail with unique index error');
  });

  await runTest('3. Create subreddit with valid author reference', async () => {
    assert(Boolean(state.createdUser?._id), 'User prerequisite missing');

    state.createdSubreddit = await Subreddit.create({
      name: state.subredditName,
      description: 'Subreddit created by CRUD test script',
      author: state.createdUser._id,
      createdAt: new Date(),
    });

    assert(Boolean(state.createdSubreddit?._id), 'Expected subreddit to have an _id');
  });

  await runTest('4. Reject subreddit creation without author', async () => {
    let validationRejected = false;

    try {
      await Subreddit.create({
        name: `${state.subredditName}-invalid`,
        description: 'Invalid subreddit',
        createdAt: new Date(),
      });
    } catch (error) {
      validationRejected = error?.name === 'ValidationError';
    }

    assert(validationRejected, 'Expected missing author to trigger validation error');
  });

  await runTest('5. Create thread with valid user and subreddit', async () => {
    assert(Boolean(state.createdUser?._id), 'User prerequisite missing');
    assert(Boolean(state.createdSubreddit?._id), 'Subreddit prerequisite missing');

    state.createdThread = await Thread.create({
      title: `CRUD Test Thread ${Date.now()}`,
      content: 'Initial thread content',
      author: state.createdUser._id,
      subreddit: state.createdSubreddit._id,
      createdAt: new Date(),
    });

    assert(Boolean(state.createdThread?._id), 'Expected thread to have an _id');
    assert(state.createdThread.upvotes === 0, 'Expected default upvotes to be 0');
    assert(state.createdThread.downvotes === 0, 'Expected default downvotes to be 0');
    assert(state.createdThread.voteCount === 0, 'Expected default voteCount to be 0');
  });

  await runTest('6. Read user by email', async () => {
    const foundUser = await User.findOne({ email: state.email });
    assert(Boolean(foundUser), 'Expected to find user by email');
    assert(String(foundUser._id) === String(state.createdUser._id), 'Expected found user to match created user');
  });

  await runTest('7. Read subreddit by name and populate author', async () => {
    const foundSubreddit = await Subreddit.findOne({ name: state.subredditName }).populate('author');
    assert(Boolean(foundSubreddit), 'Expected to find subreddit by name');
    assert(Boolean(foundSubreddit.author), 'Expected author to be populated');
    assert(foundSubreddit.author.email === state.email, 'Expected populated author email to match');
  });

  await runTest('8. Read thread by id and populate refs', async () => {
    const foundThread = await Thread.findById(state.createdThread._id)
      .populate('author')
      .populate('subreddit');

    assert(Boolean(foundThread), 'Expected to find thread by id');
    assert(foundThread.author.email === state.email, 'Expected populated author email to match');
    assert(foundThread.subreddit.name === state.subredditName, 'Expected populated subreddit name to match');
  });

  await runTest('9. Read threads by subreddit filter', async () => {
    const threads = await Thread.find({ subreddit: state.createdSubreddit._id });
    assert(threads.length >= 1, 'Expected at least one thread in created subreddit');
  });

  await runTest('10. Aggregate thread count by author in subreddit', async () => {
    const result = await Thread.aggregate([
      { $match: { subreddit: state.createdSubreddit._id } },
      { $group: { _id: '$author', totalThreads: { $sum: 1 } } },
    ]);

    assert(result.length >= 1, 'Expected at least one grouped author result');
    assert(result[0].totalThreads >= 1, 'Expected author thread count to be >= 1');
  });

  await runTest('11. Update user name', async () => {
    const updatedUser = await User.findByIdAndUpdate(
      state.createdUser._id,
      { name: 'CRUD Updated User' },
      { new: true }
    );

    assert(Boolean(updatedUser), 'Expected updated user document');
    assert(updatedUser.name === 'CRUD Updated User', 'Expected user name to be updated');
  });

  await runTest('12. Update subreddit description', async () => {
    const updatedSubreddit = await Subreddit.findByIdAndUpdate(
      state.createdSubreddit._id,
      { description: 'Updated subreddit description' },
      { new: true }
    );

    assert(Boolean(updatedSubreddit), 'Expected updated subreddit document');
    assert(
      updatedSubreddit.description === 'Updated subreddit description',
      'Expected subreddit description to be updated'
    );
  });

  await runTest('13. Increment thread votes', async () => {
    const updatedThread = await Thread.findByIdAndUpdate(
      state.createdThread._id,
      { $inc: { upvotes: 5, voteCount: 5 } },
      { new: true }
    );

    assert(Boolean(updatedThread), 'Expected updated thread document');
    assert(updatedThread.upvotes === 5, 'Expected upvotes to be incremented to 5');
    assert(updatedThread.voteCount === 5, 'Expected voteCount to be incremented to 5');
  });

  await runTest('14. Update many threads in created subreddit', async () => {
    const extraThreads = await Thread.insertMany([
      {
        title: `CRUD BULK A ${Date.now()}`,
        content: 'Bulk thread A',
        author: state.createdUser._id,
        subreddit: state.createdSubreddit._id,
        createdAt: new Date(),
      },
      {
        title: `CRUD BULK B ${Date.now()}`,
        content: 'Bulk thread B',
        author: state.createdUser._id,
        subreddit: state.createdSubreddit._id,
        createdAt: new Date(),
      },
    ]);

    state.bulkThreadIds = extraThreads.map((t) => t._id);

    const updateResult = await Thread.updateMany(
      { _id: { $in: state.bulkThreadIds } },
      { $set: { content: 'Bulk content updated' } }
    );

    assert(updateResult.modifiedCount >= 2, 'Expected at least 2 threads to be updated');
  });

  await runTest('15. Reject thread update that violates required title', async () => {
    const threadDoc = await Thread.findById(state.createdThread._id);
    assert(Boolean(threadDoc), 'Thread prerequisite missing');

    threadDoc.title = undefined;

    let validationRejected = false;
    try {
      await threadDoc.save();
    } catch (error) {
      validationRejected = error?.name === 'ValidationError';
    }

    assert(validationRejected, 'Expected title validation error when setting title to undefined');
  });

  await runTest('16. Delete one bulk thread by id', async () => {
    assert(state.bulkThreadIds.length >= 1, 'Bulk thread prerequisite missing');

    const threadIdToDelete = state.bulkThreadIds.shift();
    const deleted = await Thread.findByIdAndDelete(threadIdToDelete);
    assert(Boolean(deleted), 'Expected one bulk thread to be deleted');
  });

  await runTest('17. Delete remaining bulk threads with deleteMany', async () => {
    const deleteResult = await Thread.deleteMany({ _id: { $in: state.bulkThreadIds } });
    assert(deleteResult.deletedCount >= 1, 'Expected remaining bulk threads to be deleted');
    state.bulkThreadIds = [];
  });

  await runTest('18. Delete main thread by id', async () => {
    const deletedThread = await Thread.findByIdAndDelete(state.createdThread._id);
    assert(Boolean(deletedThread), 'Expected main test thread to be deleted');
  });

  await runTest('19. Delete created subreddit by id', async () => {
    const deletedSubreddit = await Subreddit.findByIdAndDelete(state.createdSubreddit._id);
    assert(Boolean(deletedSubreddit), 'Expected test subreddit to be deleted');
  });

  await runTest('20. Delete created user and verify all test docs are gone', async () => {
    const deletedUser = await User.findByIdAndDelete(state.createdUser._id);
    assert(Boolean(deletedUser), 'Expected test user to be deleted');

    const [userAfterDelete, subredditAfterDelete, threadAfterDelete] = await Promise.all([
      User.findById(state.createdUser._id),
      Subreddit.findById(state.createdSubreddit._id),
      Thread.findById(state.createdThread._id),
    ]);

    assert(userAfterDelete === null, 'Expected user to not exist after delete');
    assert(subredditAfterDelete === null, 'Expected subreddit to not exist after delete');
    assert(threadAfterDelete === null, 'Expected thread to not exist after delete');
  });
}

async function main() {
  try {
    await connectDatabase();
    await runAllTests();
  } catch (error) {
    console.error('Fatal error while running tests:', error);
    process.exitCode = 1;
  } finally {
    await cleanup();
    await mongoose.disconnect();

    const total = passed + failed;
    console.log('\n------------------------------');
    console.log(`Total tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('------------------------------');

    if (failed > 0) {
      process.exitCode = 1;
    }
  }
}

main();