# Campus Notification System Design

## Stage 1: Basic Features

### Main Functions

The notification system should support:

1. Viewing notifications.
2. Filtering notifications by type (Event, Result, Placement).
3. Marking a notification as read.
4. Marking all notifications as read.
5. Viewing unread notification counts.
6. Deleting notifications.
7. Receiving notifications instantly through WebSocket.

### API Endpoints

#### Get Notifications

`GET /api/notifications`

Returns all notifications. Users can filter results by notification type.

#### Get Priority Notifications

`GET /api/notifications/priority`

Returns the most important notifications based on notification type and how recent they are.

#### Mark One Notification as Read

`PATCH /api/notifications/{id}/read`

Updates the selected notification as read.

#### Mark All Notifications as Read

`PATCH /api/notifications/read-all`

Marks every unread notification as read.

#### Get Unread Counts

`GET /api/notifications/unread-count`

Shows the total number of unread notifications and count by category.

#### Delete Notification

`DELETE /api/notifications/{id}`

Removes a notification from the system.
`http://localhost:3001/api/notifications/priority?n=10
`
{
    "notifications": [
        {
            "id": "b538677e-ff7b-4c28-b334-04e733f96fb3",
            "type": "Placement",
            "message": "Nvidia Corporation hiring",
            "timestamp": "2026-05-30 05:11:03",
            "relevanceScore": 0.33269721420608483
        },
        {
            "id": "2072c89f-47e5-4d83-88a3-f8e923878482",
            "type": "Result",
            "message": "mid-sem",
            "timestamp": "2026-05-30 04:11:43",
            "relevanceScore": 0.19987813541127383
        },
        {
            "id": "0547741b-3c54-49fd-a97b-53e02ce0a392",
            "type": "Placement",
            "message": "Amgen Inc. hiring",
            "timestamp": "2026-05-29 19:40:33",
            "relevanceScore": 0.16193858721987567
        },
        {
            "id": "ec98a0f0-3956-4ddb-ade2-85c79d47e3f1",
            "type": "Placement",
            "message": "Tesla Inc. hiring",
            "timestamp": "2026-05-29 18:41:53",
            "relevanceScore": 0.15381997158346936
        },
        {
            "id": "74f69de5-1cb8-468f-bec6-a3aabb808cb0",
            "type": "Placement",
            "message": "Apple Inc. hiring",
            "timestamp": "2026-05-29 18:40:43",
            "relevanceScore": 0.1536667686890698
        },
        {
            "id": "0f30bc84-61ca-4b1d-8003-133745f65141",
            "type": "Placement",
            "message": "Amazon.com Inc. hiring",
            "timestamp": "2026-05-29 15:11:48",
            "relevanceScore": 0.13040808832501183
        },
        {
            "id": "b62b4163-2112-40be-8050-020711c1de29",
            "type": "Placement",
            "message": "Marvell Technology Inc. hiring",
            "timestamp": "2026-05-29 14:41:13",
            "relevanceScore": 0.1275812326541944
        },
        {
            "id": "72661876-b076-44a2-98fe-7fa14f928304",
            "type": "Event",
            "message": "farewell",
            "timestamp": "2026-05-30 06:11:28",
            "relevanceScore": 0.12483983655829888
        },
        {
            "id": "7757f3df-5ad1-4250-ae25-17e640368d44",
            "type": "Placement",
            "message": "CSX Corporation hiring",
            "timestamp": "2026-05-29 12:41:08",
            "relevanceScore": 0.11757412060354847
        },
        {
            "id": "64e83042-0015-4d70-8a0f-f613380cb5b3",
            "type": "Placement",
            "message": "Apple Inc. hiring",
            "timestamp": "2026-05-29 10:41:38",
            "relevanceScore": 0.1090612213045158
        }
    ]
}
### Real-Time Updates

The system uses WebSocket connections to send notifications instantly. Students do not need to refresh the page because new notifications are pushed automatically by the server.

---

## Stage 2: Database Design

### Database Selection

PostgreSQL is used because it is reliable, secure, and performs well with large amounts of data. It also supports indexing, JSON storage, and real-time notification features.

### Tables

#### Students Table

Stores student information such as:

* Student ID
* Name
* Email

#### Notifications Table

Stores:

* Notification ID
* Student ID
* Notification Type
* Message
* Read Status
* Creation Time
* Additional Metadata

### Performance Challenges

#### Large Amount of Data

As the number of notifications grows, searching becomes slower.

**Solution:**

* Partition tables by month.
* Archive old records.
* Use indexes for faster searching.

#### High Number of Writes

Sending notifications to thousands of students at once creates heavy database load.

**Solution:**

* Insert records in batches.
* Use connection pooling.
* Process notifications asynchronously.

#### High Number of Reads

Many students checking notifications can overload the database.

**Solution:**

* Cache frequently accessed data using Redis.
* Use read replicas.
* Store precomputed counts.

---

## Stage 3: Query Optimization

### Existing Query

The original query retrieves all unread notifications for a student.

### Problems

* Retrieves unnecessary columns.
* Shows oldest notifications first.
* No limit on returned records.
* Can become slow when the table contains millions of rows.

### Improvements

Create a composite index on:

* Student ID
* Read Status
* Creation Time

Optimized query improvements:

* Select only required columns.
* Show newest notifications first.
* Limit results to the latest 20 notifications.

### Why Not Index Every Column?

Adding indexes everywhere increases storage usage and slows down inserts and updates. Indexes should only be created for frequently used queries.

---

## Stage 4: System Scaling

### Current Issue

Every page load sends requests directly to the database. This creates unnecessary load and reduces performance.

### Proposed Solutions

#### Redis Cache

Store frequently requested notifications in memory.

**Benefits**

* Faster responses.
* Reduced database load.

**Drawback**

* Data may be slightly outdated for a short period.

#### Read Replicas

Use additional database servers for read operations.

**Benefits**

* Better scalability.
* Reduced load on the primary database.

#### Connection Pooling

Reuse database connections instead of creating new ones for every request.

**Benefits**

* Lower overhead.
* Better performance.

#### Notification Count Table

Store unread counts separately instead of calculating them every time.

**Benefits**

* Instant unread badge updates.

#### Keyset Pagination

Use timestamps as cursors instead of OFFSET.

**Benefits**

* Faster performance on large datasets.

### Recommended Approach

Combine:

* Redis caching
* Connection pooling
* Keyset pagination
* Precomputed unread counts

This provides good performance and scalability.

---

## Stage 5: Notification Processing Improvements

### Problems in the Original Design

1. Notifications are processed one by one.
2. A single failure can stop the entire process.
3. Duplicate notifications may occur after system restarts.
4. Large batches consume too much memory.
5. Different services depend heavily on each other.

### Improved Design

#### Batch Processing

Process students in smaller groups instead of all at once.

#### Message Queues

Store email and push notification jobs in queues for background processing.

#### Retry Mechanism

Automatically retry temporary failures using exponential backoff.

#### Dead Letter Queue

Store permanently failed jobs for later review.

#### Idempotency

Track processed requests to avoid duplicates.

### Benefits

* Faster processing
* Better reliability
* Easier recovery from failures
* Independent scaling of email and push services

---

## Stage 6: Priority Notification Ranking

### Priority Formula

Priority Score = Notification Weight ÷ (1 + Hours Since Creation)

### Notification Weights

| Type      | Weight |
| --------- | ------ |
| Placement | 3      |
| Result    | 2      |
| Event     | 1      |

Placement notifications receive the highest priority because they are most important for students.

### Process

1. Retrieve notifications.
2. Calculate a score for each notification.
3. Sort notifications by score.
4. Return the top N notifications.

### Efficient Top-10 Storage

A Min-Heap is used to keep only the 10 highest-ranked notifications in memory. This improves performance and reduces resource usage.

---

## Stage 7: Frontend Design

### Technologies

* React 18
* Vite
* Material UI
* Fetch API

### Features

* View all notifications.
* Filter notifications by category.
* Mark notifications as read.
* Delete notifications.
* View priority notifications.
* Responsive design for mobile and desktop.

### User Interface

#### All Notifications Page

Contains:

* Notification list
* Filter options
* Refresh button
* Mark all as read button

Unread notifications are highlighted for better visibility.

#### Priority Inbox Page

Contains:

* Top N selector
* Ranked notifications
* Priority score display

### Design Style

* Blue color for Placement notifications.
* Green color for Results.
* Orange color for Events.
* Progress bars for priority scores.
* Responsive layout using Flexbox.
* Material UI components for a modern appearance.

### Conclusion

The proposed system provides reliable notification delivery, real-time updates, efficient database management, and a user-friendly interface. The design is scalable and capable of supporting thousands of students while maintaining good performance.
