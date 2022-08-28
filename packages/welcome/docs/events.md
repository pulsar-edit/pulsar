# Events specification

This document specifies all the data (along with the format) which gets sent from the Welcome package to the GitHub analytics pipeline. This document follows the same format and nomenclature as the [Pulsar Core Events spec](https://github.com/Pulsar/metrics/blob/master/docs/events.md).

## Counters

Currently the Welcome package does not log any counter events.

## Timing events

Currently the Welcome package does not log any timing events.

## Standard events

#### Welcome package shown

* **eventType**: `welcome-v1`
* **metadata**

  | field | value |
  |-------|-------|
  | `ea` | `show-on-initial-load`


#### Click on links

* **eventType**: `welcome-v1`
* **metadata**

  | field | value |
  |-------|-------|
  | `ea` | link that was clicked

(There are many potential values for the `ea` param, e.g: `clicked-welcome-Pulsar-docs-link`,`clicked-welcome-Pulsar-org-link`, `clicked-project-cta`, `clicked-init-script-cta`, ...).


