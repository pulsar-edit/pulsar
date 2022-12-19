# dalek

**EXTERMINATEs** core packages installed in `~/.pulsar/packages`.

## Why worry?

When people install core Pulsar packages as if they are community packages, it can cause many problems that are very hard to diagnose. This package is intended to notify people when they are in this precarious position so they can take corrective action.

## I got a warning, what do I do?

1. Note down the packages named in the notification
2. Exit Pulsar
3. Open a command prompt
4. For each package named in the notification, execute `pulsar -p uninstall [package-name]`
5. Start Pulsar again normally to verify that the warning notification no longer appears

## I have more questions. Where can I ask them?

Please feel free to ask in any of our [Community Areas](https://pulsar-edit.dev/community.html).
