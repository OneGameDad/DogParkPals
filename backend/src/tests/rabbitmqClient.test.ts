import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import amqplib from 'amqplib';
import { RabbitMqClient } from '../infrastructure/queue/rabbitmqClient';

type ConsumeCallback = (message: any) => Promise<void>;

jest.mock('amqplib', () => {
  const connect = jest.fn();
  return {
    __esModule: true,
    default: { connect },
    connect,
  };
});

describe('RabbitMqClient', () => {
  let channel: any;
  let consumeCallback: ConsumeCallback | null;

  beforeEach(() => {
    const connectMock = (amqplib as any).connect as jest.Mock;
    consumeCallback = null;
    channel = {
      assertQueue: jest.fn().mockResolvedValue(undefined),
      sendToQueue: jest.fn(),
      ack: jest.fn(),
      consume: jest.fn((_queue: string, callback: ConsumeCallback) => {
        consumeCallback = callback;
        return Promise.resolve({});
      }),
      close: jest.fn().mockResolvedValue(undefined),
    };

    connectMock.mockResolvedValue({
      createChannel: jest.fn().mockResolvedValue(channel),
      close: jest.fn().mockResolvedValue(undefined),
    });
  });

  test('retries failed messages with incremented header', async () => {
    const client = new RabbitMqClient('amqp://test', 'dogpark.events', { maxRetries: 2 });
    const handler = jest.fn().mockRejectedValue(new Error('boom'));

    await client.subscribe(handler);

    expect(consumeCallback).not.toBeNull();

    const event = { id: 'e1', type: 'event.created', occurredAt: new Date().toISOString(), payload: {}, version: 1 };
    const message = {
      content: Buffer.from(JSON.stringify(event)),
      properties: { headers: {} },
    };

    await consumeCallback?.(message);

    expect(channel.sendToQueue).toHaveBeenCalledWith(
      'dogpark.events',
      message.content,
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-retries': 1,
        }),
        persistent: true,
      })
    );
    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  test('sends message to DLQ after max retries', async () => {
    const client = new RabbitMqClient('amqp://test', 'dogpark.events', { maxRetries: 0, dlqName: 'dogpark.events.dlq' });
    const handler = jest.fn().mockRejectedValue(new Error('boom'));

    await client.subscribe(handler);

    expect(consumeCallback).not.toBeNull();

    const event = { id: 'e1', type: 'event.created', occurredAt: new Date().toISOString(), payload: {}, version: 1 };
    const message = {
      content: Buffer.from(JSON.stringify(event)),
      properties: { headers: {} },
    };

    await consumeCallback?.(message);

    expect(channel.sendToQueue).toHaveBeenCalledWith(
      'dogpark.events.dlq',
      message.content,
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-final-error': 'boom',
          'x-retries': 0,
        }),
        persistent: true,
      })
    );
    expect(channel.ack).toHaveBeenCalledWith(message);
  });
});
