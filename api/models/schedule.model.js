import mongoose from "mongoose";
import { createScheduleSchema } from "@smart-constructor/contracts/schedule";

const Schedule =
  mongoose.models.Schedule ?? mongoose.model("Schedule", createScheduleSchema(mongoose));

export default Schedule;
