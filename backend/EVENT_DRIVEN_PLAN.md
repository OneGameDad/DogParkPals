# Event-Driven Refactor Plan (Queue-Backed)

## 1) Baseline and scope
- Identify the top 3 couplings to remove first (notifications, achievements, analytics).
- Pick one high-signal flow as the first refactor (check-ins or messages).

## 2) Queue and event contract
- Choose the queue tech (RabbitMQ/SQS/Kafka). Default: RabbitMQ for local + Docker.
- Define an event envelope: id, type, occurredAt, actorId, payload, version, traceId.
- Document naming and versioning rules for events.

## 3) Infrastructure layer
- Add a queue client abstraction with publish() and subscribe().
- Provide an in-memory adapter for tests and local dev.
- Add config for queue connection and credentials.

## 4) Outbox pattern
- Add outbox_events table in Prisma.
- Update domain services to write events to outbox in the same transaction.
- Build a worker that reads outbox, publishes to queue, marks sent.
- Add retry policy and DLQ handling.

## 5) Handler framework
- Create a handler registry and base utilities (logging, retry, idempotency).
- Add processed_events tracking per handler to guarantee idempotency.

## 6) Refactor first flow end-to-end
- Move notifications and achievements logic out of the service into event handlers.
- Emit events from domain service instead of direct calls.
- Confirm functional parity via integration tests.

## 7) Expand coverage
- Repeat for other flows (friendships, messages, events, check-ins).
- Add or adjust events as needed, keep versions stable.

## 8) Testing and verification
- Add unit tests for event emission.
- Add integration tests for handlers and queue processing.
- Add a local docker compose path for queue + worker.

## 9) Observability
- Add structured logs with eventId and traceId.
- Add metrics: publish failures, handler errors, queue depth.
- Configure alerts for DLQ growth.

## 10) Rollout and cleanup
- Feature-flag event-driven behavior per flow.
- Monitor, then remove legacy coupling logic.
- Document the final event catalog and handler ownership.
