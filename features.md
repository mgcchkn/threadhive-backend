# ThreadHive Features - MoSCoW Priority

## MUST HAVE (MVP Core - Weeks 1-2)

### 1. User Authentication & Profiles
- **User Capability**: Users can sign up, log in, and create unique usernames with profile sections
- **Implementation Complexity**: Simple
- **Priority Justification**: Foundation for all features; already have basic user model. Essential for identity tracking and content management.

### 2. Create & View Subreddits (Communities)
- **User Capability**: Users can create niche communities around specific topics and browse existing subreddits
- **Implementation Complexity**: Simple
- **Priority Justification**: Core Reddit mechanic; already implemented. Enables content organization and niche focus.

### 3. Create, Read, Edit, Delete Threads
- **User Capability**: Users can post discussion threads, view thread content, edit their own threads, and delete posts
- **Implementation Complexity**: Simple
- **Priority Justification**: Core content creation; mostly implemented. Essential for engagement and user-generated content.

### 4. Upvote/Downvote System
- **User Capability**: Users can upvote/downvote threads to signal quality; threads sort by vote count
- **Implementation Complexity**: Simple
- **Priority Justification**: Already have voting fields. Critical for content ranking and user engagement.

### 5. View Thread Comments & Nested Discussion
- **User Capability**: Users can read threaded comments to see conversation progression without scrolling through flat lists
- **Implementation Complexity**: Moderate
- **Priority Justification**: Essential Reddit UX; enables meaningful dialogue. Requires new Comment model and nesting logic.

### 6. User Search & Discovery
- **User Capability**: Users can search for subreddits, threads by keyword, and discover trending topics
- **Implementation Complexity**: Moderate
- **Priority Justification**: Critical for content discovery and findability; enables niche communities to be found.

---

## SHOULD HAVE (Enhanced MVP - Weeks 3-4)

### 7. Anonymous Posting Mode
- **User Capability**: Users can post threads/comments anonymously while still participating in voting and community reputation
- **Implementation Complexity**: Moderate
- **Priority Justification**: Key differentiator for privacy; enables vulnerable discussions (mental health, industry secrets). Builds trust in niche communities.

### 8. Thread Sort Options
- **User Capability**: Users can sort threads by newest, oldest, most upvoted, most discussed, trending (velocity)
- **Implementation Complexity**: Simple
- **Priority Justification**: Improves UX and content discovery; multiple sort strategies engage different user needs.

### 9. Subreddit Moderation (Basic)
- **User Capability**: Subreddit creators can set rules, pin important threads, approve/remove rule-breaking content
- **Implementation Complexity**: Moderate
- **Priority Justification**: Enables niche communities to maintain quality and culture; prevents spam/harassment.

### 10. User Reputation System
- **User Capability**: Users earn karma reputation based on thread/comment votes; high-rep users get recognition badges
- **Implementation Complexity**: Moderate
- **Priority Justification**: Incentivizes quality contributions; builds community trust. Differentiates from pure anonymity.

### 11. Thread Notifications
- **User Capability**: Users receive alerts when threads they posted in get replies/upvotes
- **Implementation Complexity**: Moderate
- **Priority Justification**: Drives engagement; keeps users returning. Encourages continued discussion.

### 12. User Blocking & Reporting
- **User Capability**: Users can block other users/content and report rule violations to mods
- **Implementation Complexity**: Moderate
- **Priority Justification**: Critical for niche + privacy communities; prevents harassment and maintains safe spaces.

### 13. Subreddit Membership & Permissions
- **User Capability**: Users can join/leave subreddits; private subreddits require approval
- **Implementation Complexity**: Moderate
- **Priority Justification**: Enables niche community gatekeeping; essential for private/exclusive communities.

---

## Implementation Phases

**Phase 1 (Week 1-2): MVP Core**
- Features 1-6 (auth, subreddits, threads, voting, comments, search)

**Phase 2 (Week 3-4): Privacy & Moderation**
- Features 7-13 (anonymous posting, sorting, moderation, reputation, notifications, blocking, membership)
