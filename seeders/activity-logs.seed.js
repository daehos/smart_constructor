import ActivityLog from "../models/activity-log.model.js";

export async function seedActivityLogs({ userIds, vendorId }) {
  const docs = [];

  for (const uid of userIds) {
    docs.push({
      actor: uid,
      action: "LOGIN",
      resource: "User",
      resourceId: uid,
      ip: "127.0.0.1",
      userAgent: "Seeder/1.0",
    });
  }

  if (vendorId && userIds[0]) {
    docs.push({
      actor: userIds[0],
      action: "VENDOR_CREATE",
      resource: "Vendor",
      resourceId: vendorId,
      metadata: { vendorCode: "VEND-BST-001" },
      ip: "127.0.0.1",
      userAgent: "Seeder/1.0",
    });
  }

  const created = await ActivityLog.insertMany(docs, { ordered: true });
  console.log(`  ✓ activity-logs: ${created.length}`);
  return created;
}
