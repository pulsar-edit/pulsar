# Events specification

This document specifies all the data (along with the format) which gets sent from the Fuzzy Finder package to the GitHub analytics pipeline. This document follows the same format and nomenclature as the [Atom Core Events spec](https://github.com/atom/metrics/blob/master/docs/events.md).

## Counters

| counter name | description |
|-------|-------|
| `show-enable-prompt` | Number of times the prompt to enable fast mode is shown |
| `click-enable-prompt` | Number of clicks on the "enable fast mode" prompt |
| `confirm-enable-prompt` | Number of confirmations on the "enable fast mode" notification |
| `cancel-enable-prompt` | Number of cancels on the "enable fast mode" notification |
| `show-disable-prompt` | Number of times the prompt to disable fast mode is shown |
| `click-disable-prompt` | Number of clicks on the "disable fast mode" prompt |
| `confirm-disable-prompt` | Number of confirmations on the "disable fast mode" notification |
| `cancel-disable-prompt` | Number of cancels on the "disable fast mode" notification |

## Timing events

#### Time to crawl the project

* **eventType**: `fuzzy-finder-v1`
* **metadata**

  | field | value |
  |-------|-------|
  | `ec` | `time-to-crawl`
  | `el` | Crawler type (`ripgrep` or `fs`)
  | `ev` | Number of crawled files

#### Time to filter results

* **eventType**: `fuzzy-finder-v1`
* **metadata**

  | field | value |
  |-------|-------|
  | `ec` | `time-to-filter`
  | `el` | Scoring system (`alternate` or `fast`)
  | `ev` | Number of items in the list

## Standard events

Currently the Fuzzy Finder does not log any standard events.
