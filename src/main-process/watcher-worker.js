// This script runs in an Electron UtilityProcess, providing crash isolation for
// the native @parcel/watcher module. If this process crashes, the main process
// and renderer survive and can respawn it.

const fs = require('fs');
const path = require('path');
const parcelWatcher = require('@parcel/watcher');

// Map @parcel/watcher event types to Pulsar's expected action names.
const EVENT_MAP = {
  create: 'created',
  update: 'modified',
  delete: 'deleted'
};

// Active subscriptions: id → { subscription, watchedPath, isFile, dirToWatch }
const subscriptions = new Map();

process.parentPort.on('message', async (e) => {
  const msg = e.data;
  try {
    switch (msg.type) {
      case 'subscribe':
        await handleSubscribe(msg);
        break;
      case 'unsubscribe':
        await handleUnsubscribe(msg);
        break;
      case 'update':
        await handleUpdate(msg);
        break;
    }
  } catch (err) {
    process.parentPort.postMessage({
      type: 'subscribe-error',
      id: msg.id,
      error: err.message
    });
  }
});

async function handleSubscribe({ id, path: watchPath, options }) {
  const ignore = options.ignore || [];

  let isFile;
  try {
    isFile = !fs.lstatSync(watchPath).isDirectory();
  } catch (e) {
    throw new Error(`Cannot watch path: ${watchPath} (${e.message})`);
  }

  const handler = (err, events) => {
    if (err) {
      process.parentPort.postMessage({ type: 'error', id, error: err.message });
      return;
    }

    let normalizedEvents;
    if (isFile) {
      // Filter to only events for the exact file we're watching.
      normalizedEvents = [];
      for (let event of events) {
        if (event.path === watchPath) {
          normalizedEvents.push({
            action: EVENT_MAP[event.type] || `unexpected (${event.type})`,
            path: event.path
          });
        }
      }
      if (normalizedEvents.length === 0) return;
    } else {
      normalizedEvents = events.map(event => ({
        action: EVENT_MAP[event.type] || `unexpected (${event.type})`,
        path: event.path
      }));
    }

    process.parentPort.postMessage({ type: 'events', id, events: normalizedEvents });
  };

  const dirToWatch = isFile ? path.dirname(watchPath) : watchPath;
  const subscribeOptions = ignore.length > 0 ? { ignore } : {};

  const subscription = await parcelWatcher.subscribe(
    dirToWatch,
    handler,
    subscribeOptions
  );

  subscriptions.set(id, {
    subscription,
    watchedPath: watchPath,
    isFile,
    dirToWatch
  });

  process.parentPort.postMessage({ type: 'subscribed', id });
}

async function handleUnsubscribe({ id }) {
  const record = subscriptions.get(id);
  if (!record) return;

  subscriptions.delete(id);
  try {
    await record.subscription.unsubscribe();
  } catch (e) {
    // Best effort — the subscription may already be dead.
  }
}

async function handleUpdate({ id, options }) {
  const record = subscriptions.get(id);
  if (!record) return;

  const { watchedPath } = record;
  await handleUnsubscribe({ id });
  await handleSubscribe({ id, path: watchedPath, options });
}

// Signal to the main process that this worker is ready to accept messages.
process.parentPort.postMessage({ type: 'ready' });
