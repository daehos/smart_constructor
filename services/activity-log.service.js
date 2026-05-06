import ActivityLog from "../models/activity-log.model.js";

/**
 * Fire-and-forget: never throws, never awaited by callers.
 */
export function logActivity({ actorId, action, resource, resourceId, metadata, ip, userAgent }) {
  ActivityLog.create({
    actor: actorId,
    action,
    resource: resource ?? null,
    resourceId: resourceId ?? null,
    metadata: metadata ?? null,
    ip: ip ?? null,
    userAgent: userAgent ?? null,
  }).catch((err) => {
    console.error("[ActivityLog] failed to write log:", err?.message);
  });
}

export async function listLogs(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.user) filter.actor = query.user;
  if (query.resource) filter.resource = query.resource;
  if (query.action) filter.action = { $regex: query.action, $options: "i" };

  const [data, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate("actor", "nama email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ActivityLog.countDocuments(filter),
  ]);

  return { data, total, page, limit };
}

export async function listMyLogs(query, actorId) {
  return listLogs({ ...query, user: actorId });
}
