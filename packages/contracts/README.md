# @smart-constructor/contracts

Shared contracts package for the Smart Constructor monorepo. Imported by `api` and `whatsapp` via pnpm workspaces.

## What is here

- `src/queues/schedule.js` — queue name, job name, concurrency constant, Zod payload schema for `scheduled-whatsapp`.
- `src/schedule/schema.js` — `createScheduleSchema(mongoose)` factory: call with your service's own `mongoose` instance to get the `schedules` collection schema without cross-package singleton issues.

## Usage

In your service's `package.json`:

```json
"@smart-constructor/contracts": "workspace:*"
```

Then:

```js
import { QUEUE_SCHEDULED_WHATSAPP, JOB_SEND_WHATSAPP } from "@smart-constructor/contracts/queues";
import { createScheduleSchema } from "@smart-constructor/contracts/schedule";
import mongoose from "mongoose";

const Schedule = mongoose.model("Schedule", createScheduleSchema(mongoose));
```

## Peer dependencies

`mongoose >= 9` and `zod >= 4` must be installed in the consuming service — they are **not** bundled here.
