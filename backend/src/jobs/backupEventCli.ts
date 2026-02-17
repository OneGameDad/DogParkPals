import { PrismaClient } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { createDomainEvent } from '../events/createDomainEvent';
import { EventTypes } from '../events/eventTypes';
import { addOutboxEvent } from '../infrastructure/outbox/outboxRepository';

type BackupStatus = 'started' | 'succeeded' | 'failed';

type ParsedArgs = {
  status?: BackupStatus;
  backupId?: string;
  target?: string;
  storage?: string;
  sizeBytes?: number;
  durationMs?: number;
  errorMessage?: string;
  errorStack?: string;
};

const prisma = new PrismaClient();

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {};
  if (argv.length === 0) return result;

  result.status = argv[0] as BackupStatus;

  for (let i = 1; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith('--')) continue;

    const [key, value] = raw.includes('=')
      ? raw.slice(2).split('=')
      : [raw.slice(2), argv[i + 1]];

    if (!raw.includes('=') && value) {
      i += 1;
    }

    switch (key) {
      case 'backupId':
        result.backupId = value;
        break;
      case 'target':
        result.target = value;
        break;
      case 'storage':
        result.storage = value;
        break;
      case 'sizeBytes':
        result.sizeBytes = value ? Number(value) : undefined;
        break;
      case 'durationMs':
        result.durationMs = value ? Number(value) : undefined;
        break;
      case 'error':
        result.errorMessage = value;
        break;
      case 'errorStack':
        result.errorStack = value;
        break;
      default:
        break;
    }
  }

  return result;
}

async function emitBackupEvent(args: ParsedArgs) {
  if (!args.status || !['started', 'succeeded', 'failed'].includes(args.status)) {
    throw new Error('Usage: backupEventCli <started|succeeded|failed> [--backupId=...]');
  }

  const backupId = args.backupId ?? `backup-${Date.now()}`;

  if (args.status === 'started') {
    const event = createDomainEvent(EventTypes.BackupStarted, {
      backupId,
      target: args.target,
      storage: args.storage,
    });
    await addOutboxEvent(prisma, event);
    return;
  }

  if (args.status === 'succeeded') {
    const event = createDomainEvent(EventTypes.BackupSucceeded, {
      backupId,
      target: args.target,
      storage: args.storage,
      sizeBytes: args.sizeBytes,
      durationMs: args.durationMs,
    });
    await addOutboxEvent(prisma, event);
    return;
  }

  const errorMessage = args.errorMessage ?? 'Unknown backup failure';
  const event = createDomainEvent(EventTypes.BackupFailed, {
    backupId,
    target: args.target,
    storage: args.storage,
    errorMessage,
    errorStack: args.errorStack,
  });
  await addOutboxEvent(prisma, event);
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    await emitBackupEvent(args);
    typeSafeLogger.info('Backup event emitted', { status: args.status, backupId: args.backupId });
  } catch (error) {
    typeSafeLogger.logError('Failed to emit backup event', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
