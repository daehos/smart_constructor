#!/usr/bin/env node
/**
 * Seeder entrypoint
 *
 * Usage:
 *   node seeders/index.js                    — seed all (skips if data exists)
 *   node seeders/index.js --reset            — drop collections then seed all
 *   node seeders/index.js --only=users,vendors
 */
import mongoose from "mongoose";
import { config } from "../configs/env.js";
import ActivityLog from "../models/activity-log.model.js";
import Attendance from "../models/attendance.model.js";
import Material from "../models/material.model.js";
import Order from "../models/order.model.js";
import Payroll from "../models/payroll.model.js";
import Project from "../models/project.model.js";
import User from "../models/user.model.js";
import VendorAudit from "../models/vendor-audit.model.js";
import Vendor from "../models/vendor.model.js";
import Worker from "../models/worker.model.js";
import { seedActivityLogs } from "./activity-logs.seed.js";
import { seedAttendance } from "./attendance.seed.js";
import { seedMaterials } from "./materials.seed.js";
import { seedOrders } from "./orders.seed.js";
import { seedPayroll } from "./payroll.seed.js";
import { seedProjects } from "./projects.seed.js";
import { seedUsers } from "./users.seed.js";
import { seedVendors } from "./vendors.seed.js";
import { seedWorkers } from "./workers.seed.js";

const args = process.argv.slice(2);
const shouldReset = args.includes("--reset");
const onlyArg = args.find((a) => a.startsWith("--only="));
const onlyList = onlyArg ? onlyArg.replace("--only=", "").split(",").map((s) => s.trim()) : null;

const ALL_MODELS = [
  { name: "users", model: User },
  { name: "workers", model: Worker },
  { name: "projects", model: Project },
  { name: "materials", model: Material },
  { name: "vendors", model: Vendor },
  { name: "vendor-audits", model: VendorAudit },
  { name: "orders", model: Order },
  { name: "attendance", model: Attendance },
  { name: "payroll", model: Payroll },
  { name: "activity-logs", model: ActivityLog },
];

function shouldRun(name) {
  if (!onlyList) return true;
  return onlyList.includes(name);
}

/** Returns true only when the collection is empty (or --reset was used). */
async function isEmpty(model) {
  if (shouldReset) return true;
  const count = await model.countDocuments({});
  return count === 0;
}

async function main() {
  await mongoose.connect(config.mongodb.uri);
  console.log("Connected to MongoDB");

  if (shouldReset) {
    console.log("Resetting collections...");
    for (const { name, model } of ALL_MODELS) {
      await model.deleteMany({});
      console.log(`  ✓ cleared ${name}`);
    }
  }

  // Drop stale indexes that no longer match the current schema (e.g. nik_1 left
  // over from before nik was removed from User). Safe to run every time — drops
  // only if the index exists and is not defined in the current schema.
  try {
    const userCollection = mongoose.connection.collection("users");
    const existingIndexes = await userCollection.indexes();
    const stale = ["nik_1"];
    for (const idxName of stale) {
      if (existingIndexes.some((i) => i.name === idxName)) {
        await userCollection.dropIndex(idxName);
        console.log(`  ✓ dropped stale index: users.${idxName}`);
      }
    }
  } catch (err) {
    console.warn("  ⚠ could not clean stale indexes:", err?.message);
  }

  let usersByRole = {};
  let workers = [];
  let projects = [];
  let materials = [];
  let vendors = [];

  if (shouldRun("users") && await isEmpty(User)) {
    usersByRole = await seedUsers();
  } else {
    const all = await User.find({}).lean();
    for (const u of all) {
      if (!usersByRole[u.role]) usersByRole[u.role] = [];
      usersByRole[u.role].push(u._id);
    }
    if (!shouldReset) console.log(`  – users: skipped (${Object.values(usersByRole).flat().length} already exist)`);
  }

  if (shouldRun("workers") && await isEmpty(Worker)) {
    workers = await seedWorkers();
  } else {
    workers = await Worker.find({}).lean();
    if (!shouldReset) console.log(`  – workers: skipped (${workers.length} already exist)`);
  }

  if (shouldRun("projects") && await isEmpty(Project)) {
    projects = await seedProjects();
  } else {
    projects = await Project.find({}).lean();
    if (!shouldReset) console.log(`  – projects: skipped (${projects.length} already exist)`);
  }

  if (shouldRun("materials") && await isEmpty(Material)) {
    materials = await seedMaterials();
  } else {
    materials = await Material.find({}).lean();
    if (!shouldReset) console.log(`  – materials: skipped (${materials.length} already exist)`);
  }

  const adminUserId =
    (usersByRole["admin_pengadaan"] ?? usersByRole["owner"] ?? [])[0] ?? null;

  if (shouldRun("vendors") && await isEmpty(Vendor)) {
    vendors = await seedVendors({ materials, projects, adminUserId });
  } else {
    vendors = await Vendor.find({}).lean();
    if (!shouldReset) console.log(`  – vendors: skipped (${vendors.length} already exist)`);
  }

  const buyerId =
    (usersByRole["admin_pengadaan"] ?? usersByRole["owner"] ?? [])[0] ?? null;
  const pilarBaja = vendors.find((v) => v.namaPerusahaan === "PT Pilar Baja Nusantara");

  if (shouldRun("orders") && await isEmpty(Order) && pilarBaja && buyerId) {
    await seedOrders({ vendor: pilarBaja, buyerId, materials });
  } else if (!shouldReset) {
    console.log(`  – orders: skipped`);
  }

  const pekerjaIds = usersByRole["pekerja"] ?? [];
  const twoWorkerUsers = pekerjaIds.slice(0, 2);

  if (shouldRun("attendance") && await isEmpty(Attendance) && twoWorkerUsers.length) {
    await seedAttendance({ userIds: twoWorkerUsers });
  } else if (!shouldReset) {
    console.log(`  – attendance: skipped`);
  }

  const financeId = (usersByRole["admin_finance"] ?? [])[0] ?? null;
  if (shouldRun("payroll") && await isEmpty(Payroll) && twoWorkerUsers.length) {
    await seedPayroll({ userIds: twoWorkerUsers, paidById: financeId });
  } else if (!shouldReset) {
    console.log(`  – payroll: skipped`);
  }

  const allUserIds = Object.values(usersByRole).flat();
  if (shouldRun("activity-logs") && await isEmpty(ActivityLog) && allUserIds.length) {
    await seedActivityLogs({
      userIds: allUserIds.slice(0, 3),
      vendorId: pilarBaja?._id ?? null,
    });
  } else if (!shouldReset) {
    console.log(`  – activity-logs: skipped`);
  }

  console.log("\nSeeding complete.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeder error:", err);
  process.exit(1);
});
