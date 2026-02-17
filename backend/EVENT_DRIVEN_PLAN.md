# Event-Driven Refactor Plan (Queue-Backed)

## 1) Baseline and scope (completed)
- Identify the top 3 couplings to remove first (notifications, achievements, analytics).
- Pick one high-signal flow as the first refactor (check-ins or messages).

## 2) Queue and event contract (completed)
- Choose the queue tech (RabbitMQ/SQS/Kafka). Default: RabbitMQ for local + Docker.
- Define an event envelope: id, type, occurredAt, actorId, payload, version, traceId.
- Document naming and versioning rules for events.

## 3) Infrastructure layer (completed)
- Add a queue client abstraction with publish() and subscribe().
- Provide an in-memory adapter for tests and local dev.
- Add config for queue connection and credentials.

## 4) Outbox pattern (completed)
- Add outbox_events table in Prisma.
- Update domain services to write events to outbox in the same transaction.
- Build a worker that reads outbox, publishes to queue, marks sent.
- Add retry policy and DLQ handling.

## 5) Handler framework (completed)
- Create a handler registry and base utilities (logging, retry, idempotency).
- Add processed_events tracking per handler to guarantee idempotency.

## 6) Refactor first flow end-to-end (completed)
- Move notifications and achievements logic out of the service into event handlers.
- Emit events from domain service instead of direct calls.
- Confirm functional parity via integration tests.

## 7) Expand coverage (completed)
- Repeat for other flows (friendships, messages, events, check-ins).
- Add or adjust events as needed, keep versions stable.

## 8) Testing and verification (completed)
- Add unit tests for event emission.
- Add integration tests for handlers and queue processing.
- Add a local docker compose path for queue + worker.

## 9) Observability (completed)
- Add structured logs with eventId and traceId.
- Add metrics: publish failures, handler errors, queue depth.
- Configure alerts for DLQ growth.

## 10) Rollout and cleanup
- Feature-flag event-driven behavior per flow.
- Monitor, then remove legacy coupling logic.
- Document the final event catalog and handler ownership.

Completion criteria (local Docker):
- All refactored flows use outbox events only (no direct notification/achievement writes).
- Feature flags removed or defaulted on for all event-driven paths.
- Event catalog documented and handlers mapped to owners.
- Integration tests pass with queue enabled in docker-compose.

## 11) Local Docker extension playbooks

### Add a new notification (local Docker)
- Add a new `EventTypes` entry and payload in `backend/src/events/eventTypes.ts`.
- Emit the domain event from the service inside the same transaction as the write (outbox).
- Add a `NotificationType` enum entry in `backend/prisma/schema.prisma`.
- Create a notification handler in `backend/src/handlers/notifications/`.
- Wire the handler in `backend/src/handlers/handlerRegistry.ts`.
- Add localization strings in `frontend/src/i18n/locales/en.ts` and `frontend/src/i18n/locales/es.ts`.
- Add tests for handler behavior and any service outbox emission.
- Rebuild backend and frontend containers so the schema + translations are picked up.

### Add a new achievement (local Docker)
- Add a new `EventTypes` entry and payload if a new domain event is needed.
- Emit the domain event from the service in the outbox transaction.
- Create or extend the achievement handler in `backend/src/handlers/`.
- Update any achievement lookup or rules in `backend/src/services/achievementService.ts`.
- Add tests for outbox emission and handler award logic.
- Rebuild the backend container.

### Add analytics (event-driven, local Docker)
- Add a lightweight analytics consumer inside the backend container or as a new service in `docker-compose.yml`.
- Keep the consumer idempotent using `ProcessedEvent` tracking.
- Use sampling or aggregation for high-volume events.
- Rebuild the backend container and restart the compose stack.

### Add Prometheus + Grafana (local Docker)
- Expose a `/metrics` endpoint in the backend and register counters and histograms.
- Emit metrics from the outbox publisher, event consumer, and critical handlers.
- Add `prometheus` and `grafana` services to `docker-compose.yml`.
- Point Prometheus at the backend `/metrics` endpoint.
- Rebuild and restart the compose stack.

### Add ELK (Elasticsearch + Logstash + Kibana, local Docker)
- Add `elasticsearch`, `logstash`, and `kibana` services to `docker-compose.yml`.
- Add a log shipper or event consumer in the backend container that sends to Logstash/Elasticsearch.
- Map event fields (eventId, type, actorId, traceId) for searchable documents.
- Keep request/error logs as-is; only business events need event-driven ingestion.
- Rebuild and restart the compose stack, then build Kibana dashboards.
