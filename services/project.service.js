import { z } from "zod";
import { NotFoundError, ValidationError } from "../errors/index.js";
import Project from "../models/project.model.js";
import {
  createProjectValidation,
  listProjectValidation,
  updateProjectValidation,
} from "../validations/project.validation.js";

export default class ProjectService {
  static async list(query) {
    const parsed = listProjectValidation.safeParse(query);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const { q, page, limit } = parsed.data;
    const filter = { deletedAt: null };

    if (q) {
      filter.nama = { $regex: q, $options: "i" };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Project.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  static async getById(id) {
    const project = await Project.findOne({ _id: id, deletedAt: null });
    if (!project) {
      throw new NotFoundError({ details: "Proyek tidak ditemukan" });
    }
    return project;
  }

  static async create(body) {
    const parsed = createProjectValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }
    return Project.create(parsed.data);
  }

  static async update(id, body) {
    const parsed = updateProjectValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const project = await Project.findOne({ _id: id, deletedAt: null });
    if (!project) {
      throw new NotFoundError({ details: "Proyek tidak ditemukan" });
    }

    Object.assign(project, parsed.data);
    return project.save();
  }

  static async delete(id) {
    const project = await Project.findOne({ _id: id, deletedAt: null });
    if (!project) {
      throw new NotFoundError({ details: "Proyek tidak ditemukan" });
    }
    project.deletedAt = new Date();
    await project.save();
    return { message: "Proyek berhasil dihapus" };
  }
}
