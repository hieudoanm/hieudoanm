# System Design

System design is not a hundred things. It's six problems, and every system you'll ever design is a mix of them.

## Quick reference

| #   | Problem                   | Solutions                                           |
| --- | ------------------------- | --------------------------------------------------- |
| 1   | Too many reads            | Cache, read replicas, database indexes              |
| 2   | Too many writes           | Batching, sharding, async writes                    |
| 3   | Real-time updates         | WebSockets, server-sent events, long polling        |
| 4   | Slow jobs                 | Queue plus workers                                  |
| 5   | Things will fail          | Retries with backoff, idempotency, circuit breakers |
| 6   | Reads and writes fighting | CQRS                                                |

## The six problems

### 1. Too many reads

- Cache it
- Add read replicas
- Index your database

### 2. Too many writes

- Batch them
- Shard the data
- Save it later (async)

### 3. Real-time

- WebSockets
- Server-sent events
- Long polling

### 4. Slow jobs

- Throw them in a queue
- Workers pick them up

### 5. Things will fail

- Retries with backoff
- Idempotency
- Circuit breakers

### 6. Reads and writes fighting

- Split them apart: this is **CQRS** (Command Query Responsibility Segregation)

## Takeaway

When designing any system, ask which of these six problems you're facing. Most real systems are a mix of several.
