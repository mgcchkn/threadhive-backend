import mongoose from 'mongoose';
import dotenv, { populate } from 'dotenv';

import User from "./models/User.js"
import Subreddit from './models/Subreddit.js';
import Thread from './models/Thread.js';


async function query1() {
    // Write code for Query 1 here
    const users = await User.findOne({ email: "diana@example.com" });
    console.log("Query 1 result:", users);
}


async function query2() {
    // Write code for Query 2 here
    const subreddit = await Subreddit.findOne({ name: "programming" });
    const threads = await Thread.find({ subreddit: subreddit._id });
    console.log("Query 2 result:", threads);
}

async function query3() {
    // Write code for Query 3 here
    const user = await User.findOne({ name: "Ethan" });
    const threads = await Thread.find({ author: user._id });
    console.log("Query 3 result:", threads);
}

async function query4() {
    // Write code for Query 4 here
    const authorIds = await Thread.distinct("author");
    const users = await User.find(
      { _id: { $in: authorIds } },
      { name: 1, _id: 0 }
    );
    console.log("Query 4 result:", users);
}

async function query5() {
    // Write code for Query 5 here
    const count = await Thread.countDocuments({ upvotes: { $gte: 2 } });
    console.log("Query 5 result:", count);
}

async function query6() {
    // Write code for Query 6 here
    const threads = await Thread.find({ createdAt: { $gte: new Date("2024-01-01") } });
    console.log("Query 6 result:", threads);
}

async function query7() {
    // Write code for Query 7 here
    const postThread = await Thread.create({
        title: "New Thread Title",
        content: "This is the content of the new thread",
        author: "64f005e5e5e5e5e5e5e5e5e5", // replace with a valid user _id
        subreddit: "64f10b2b2b2b2b2b2b2b2b2b", // replace with a valid subreddit _id
        createdAt: new Date()
    });
    console.log("Query 7 result:", postThread);
}

async function query8() {
    // Write code for Query 8 here
    const threadUpdate = await Thread.findByIdAndUpdate(
        "69d6ec30b56a06298683ee0b", // replace with a valid thread _id
        { title: "Docker and Kubernetes?" },
        { new: true }
    );
    console.log("Query 8 result:", threadUpdate);}

async function query9() {
    // Write code for Query 9 here
    const deletedThread = await Thread.deleteMany({ author: "64f005e5e5e5e5e5e5e5e5e5" }) // replace with a valid user _id
    console.log("Query 9 result:", deletedThread);
}

async function query10() {
    // Write code for Query 10 here
    const deletedSubreddit = await Subreddit.deleteMany({});
    const deletedThreads = await Thread.deleteMany({});
    console.log("Query 10 result:", deletedSubreddit, deletedThreads);
}

async function query11() {
    // Write code for Query 11 here
    const userpostcount = await Thread.aggregate([
        { $group: { _id: "$author", totalPosts: { $sum: 1 } } },
    ]);
    console.log("Query 11 result:", userpostcount);
}

async function query12() {
    const topAuthor = await Thread.aggregate([
    { $group: { _id: "$author", postCount: { $sum: 1 } } },
    { $sort: { postCount: -1 } },
    { $limit: 1 },
    ]);
  console.log("Query 12: Top author by thread count\n", topAuthor);
}

// more queries

async function runQueries() {
    // Uncomment the query you want to run
    // await query1();
    // await query2();
    // await query3();
    // await query4();
    // await query5();
    // await query6();
    // await query7();
    // await query8();
    // await query9();
    // await query10();
    // await query11();
    // await query12();
    // more
}

async function main() {
  try {
    dotenv.config();
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");
    await runQueries();
  } catch (err) {
    console.error("DB connection failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from DB");
  }
}

main();