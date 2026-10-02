import { randomUUID } from "node:crypto";
import { getDatabase } from "../config/database.js";

const models = new Map();
const identifier = (value) => `"${String(value).replaceAll('"', '""')}"`;
const now = () => new Date().toISOString();
const getPath = (value, field) => field.split(".").reduce((current, part) => current?.[part], value);
const setPath = (value, field, item) => {
  const parts = field.split(".");
  const leaf = parts.pop();
  const parent = parts.reduce((current, part) => (current[part] ??= {}), value);
  parent[leaf] = item;
};

const encode = (field, value, config) => {
  if (value === undefined) return null;
  if (config.jsonFields?.includes(field) && value !== null) return JSON.stringify(value);
  if (config.dateFields?.includes(field) && value !== null) return new Date(value).toISOString();
  if (value instanceof Date) return value.toISOString();
  if (config.booleanFields?.includes(field) && value !== null) return value ? 1 : 0;
  return value;
};

const decode = (row, config) => {
  if (!row) return null;
  const value = { _id: row._id };
  for (const field of config.fields) {
    const stored = row[field];
    if (stored === null || stored === undefined) continue;
    if (config.jsonFields?.includes(field)) setPath(value, field, JSON.parse(stored));
    else if (config.dateFields?.includes(field)) setPath(value, field, new Date(stored));
    else if (config.numberFields?.includes(field)) setPath(value, field, Number(stored));
    else if (config.booleanFields?.includes(field)) setPath(value, field, Boolean(stored));
    else setPath(value, field, stored);
  }
  value.createdAt = new Date(row.createdAt);
  value.updatedAt = new Date(row.updatedAt);
  return value;
};

const filterValue = (field, value, config) => encode(field, value, config);

const compileFilter = (filter, config) => {
  const clauses = [];
  const values = [];

  for (const [field, expected] of Object.entries(filter || {})) {
    if (field === "$or" || field === "$and") {
      const alternatives = expected.map((part) => {
        const compiled = compileFilter(part, config);
        values.push(...compiled.values);
        return compiled.sql || "1 = 1";
      });
      clauses.push(`(${alternatives.join(field === "$or" ? " OR " : " AND ")})`);
      continue;
    }

    if (!["_id", "createdAt", "updatedAt", ...config.fields].includes(field)) {
      throw new Error(`Unknown ${config.name} field: ${field}`);
    }
    const column = identifier(field);
    const operators = expected && typeof expected === "object" && !(expected instanceof Date) && !Array.isArray(expected)
      ? expected
      : { $eq: expected };

    for (const [operator, operand] of Object.entries(operators)) {
      if (operator === "$options") continue;
      if (operator === "$regex") {
        clauses.push(`${column} REGEXP ?`);
        values.push(JSON.stringify({ pattern: String(operand), flags: String(operators.$options || "") }));
        continue;
      }
      if (operator === "$in" || operator === "$nin") {
        const list = Array.isArray(operand) ? operand : [];
        if (list.length === 0) {
          clauses.push(operator === "$in" ? "0 = 1" : "1 = 1");
        } else {
          clauses.push(`${column} ${operator === "$in" ? "IN" : "NOT IN"} (${list.map(() => "?").join(", ")})`);
          values.push(...list.map((item) => filterValue(field, item, config)));
        }
        continue;
      }
      const sqlOperator = ({ $eq: "=", $ne: "!=", $gt: ">", $gte: ">=", $lt: "<", $lte: "<=" })[operator];
      if (!sqlOperator) throw new Error(`Unsupported SQLite filter operator: ${operator}`);
      if (operand === null) {
        clauses.push(`${column} IS ${operator === "$ne" ? "NOT " : ""}NULL`);
      } else {
        clauses.push(`${column} ${sqlOperator} ?`);
        values.push(filterValue(field, operand, config));
      }
    }
  }

  return { sql: clauses.join(" AND "), values };
};

const applyProjection = (record, projection, hiddenFields) => {
  if (!record) return record;
  const fields = projection?.trim().split(/\s+/).filter(Boolean) || [];
  const includes = fields.filter((field) => !field.startsWith("-") && !field.startsWith("+"));
  const excludes = new Set([
    ...hiddenFields,
    ...fields.filter((field) => field.startsWith("-")).map((field) => field.slice(1)),
  ]);
  for (const field of fields.filter((item) => item.startsWith("+"))) excludes.delete(field.slice(1));
  const result = includes.length
    ? Object.fromEntries(["_id", ...includes].filter((field) => field in record).map((field) => [field, record[field]]))
    : { ...record };
  for (const field of excludes) delete result[field];
  return result;
};

class SqliteQuery {
  constructor(model, operation, filter = {}) {
    this.model = model;
    this.operation = operation;
    this.filter = filter;
    this.sortOrder = null;
    this.offset = 0;
    this.maximum = null;
    this.projection = null;
    this.populations = [];
  }

  sort(order) { this.sortOrder = order; return this; }
  skip(amount) { this.offset = Math.max(0, Number(amount) || 0); return this; }
  limit(amount) { this.maximum = Math.max(0, Number(amount) || 0); return this; }
  select(projection) { this.projection = projection; return this; }
  populate(field, projection) { this.populations.push({ field, projection }); return this; }

  async execute() {
    const records = this.model._query(this.filter, this.sortOrder, this.offset, this.maximum);
    const results = this.operation === "one" ? records.slice(0, 1) : records;
    for (const record of results) {
      for (const population of this.populations) {
        await this.model._populate(record, population.field, population.projection);
      }
    }
    const projected = results.map((record) => this.model._attachMethods(
      applyProjection(record, this.projection, this.model.hiddenFields),
      record
    ));
    return this.operation === "one" ? projected[0] || null : projected;
  }

  then(resolve, reject) { return this.execute().then(resolve, reject); }
  catch(reject) { return this.execute().catch(reject); }
  finally(callback) { return this.execute().finally(callback); }
}

export const createSqliteModel = (name, options = {}) => {
  const config = {
    name,
    fields: options.fields || [],
    defaults: options.defaults || {},
    jsonFields: options.jsonFields || [],
    dateFields: options.dateFields || [],
    numberFields: options.numberFields || [],
    booleanFields: options.booleanFields || [],
    requiredFields: options.requiredFields || [],
    enums: options.enums || {},
    uniqueFields: options.uniqueFields || [],
    hiddenFields: options.hiddenFields || [],
    fieldOptions: options.fieldOptions || {},
    references: options.references || {},
    beforeSave: options.beforeSave,
    validate: options.validate,
  };
  const db = getDatabase();
  const columns = [
    "_id TEXT PRIMARY KEY",
    ...config.fields.map((field) => `${identifier(field)}${config.uniqueFields.includes(field) ? " UNIQUE" : ""}`),
    "createdAt TEXT NOT NULL",
    "updatedAt TEXT NOT NULL",
  ];
  db.exec(`CREATE TABLE IF NOT EXISTS ${identifier(name)} (${columns.join(", ")})`);
  for (const index of options.indexes || []) {
    const fields = Object.keys(index.fields);
    const unique = index.options?.unique ? "UNIQUE " : "";
    const indexName = `${name}_${fields.join("_")}_idx`;
    db.exec(`CREATE ${unique}INDEX IF NOT EXISTS ${identifier(indexName)} ON ${identifier(name)} (${fields.map(identifier).join(", ")})`);
  }

  const attachMethods = (record, original = {}) => {
    if (!record) return record;
    const descriptors = {
      save: { configurable: true, enumerable: false, value: async () => Model._save(record, original) },
      toObject: { configurable: true, enumerable: false, value: () => ({ ...record }) },
      isModified: {
        configurable: true,
        enumerable: false,
        value: (field) => JSON.stringify(getPath(record, field)) !== JSON.stringify(getPath(original, field)),
      },
    };
    for (const [method, handler] of Object.entries(options.instanceMethods || {})) {
      descriptors[method] = { configurable: true, enumerable: false, value: (...args) => handler.apply(record, args) };
    }
    Object.defineProperties(record, descriptors);
    return record;
  };

  const Model = {
    modelName: name,
    hiddenFields: config.hiddenFields,
    _attachMethods: (record, original) => attachMethods(record, original),
    _query(filter = {}, sortOrder, offset = 0, maximum = null) {
      const where = compileFilter(filter, config);
      const order = sortOrder && Object.entries(sortOrder).map(([field, direction]) => {
        if (!["_id", "createdAt", "updatedAt", ...config.fields].includes(field)) throw new Error(`Unknown ${name} sort field: ${field}`);
        return `${identifier(field)} ${Number(direction) < 0 ? "DESC" : "ASC"}`;
      }).join(", ");
      let sql = `SELECT * FROM ${identifier(name)}${where.sql ? ` WHERE ${where.sql}` : ""}`;
      if (order) sql += ` ORDER BY ${order}`;
      if (maximum !== null) sql += " LIMIT ?";
      if (offset) sql += maximum === null ? " LIMIT -1 OFFSET ?" : " OFFSET ?";
      const params = [...where.values];
      if (maximum !== null) params.push(maximum);
      if (offset) params.push(offset);
      return db.prepare(sql).all(...params).map((row) => {
        const record = decode(row, config);
        return attachMethods(record, structuredClone(record));
      });
    },
    _save: async (record, original = {}) => {
      const isNew = !record._id || !db.prepare(`SELECT 1 FROM ${identifier(name)} WHERE _id = ?`).get(record._id);
      attachMethods(record, original);
      for (const [field, defaultValue] of Object.entries(config.defaults)) {
        if (getPath(record, field) === undefined && isNew) {
          setPath(record, field, typeof defaultValue === "function" ? defaultValue() : defaultValue);
        }
      }
      for (const field of config.fields) {
        const value = getPath(record, field);
        if (value === undefined || value === null) continue;
        const options = config.fieldOptions[field] || {};
        let castValue = value;
        if (config.numberFields.includes(field) && typeof value !== "number") castValue = Number(value);
        else if (config.dateFields.includes(field) && !(value instanceof Date)) castValue = new Date(value);
        else if (config.booleanFields.includes(field) && typeof value !== "boolean") castValue = value === true || value === 1 || value === "1" || value === "true";
        else if (
          !config.jsonFields.includes(field)
          && !config.numberFields.includes(field)
          && !config.dateFields.includes(field)
          && !config.booleanFields.includes(field)
          && typeof value !== "string"
        ) castValue = String(value);
        if (typeof castValue === "string") {
          if (options.trim) castValue = castValue.trim();
          if (options.lowercase) castValue = castValue.toLowerCase();
        }
        if (config.numberFields.includes(field) && Number.isNaN(castValue)) throw new Error(`${field} must be a number`);
        if (config.dateFields.includes(field) && Number.isNaN(castValue.getTime())) throw new Error(`${field} must be a valid date`);
        setPath(record, field, castValue);
      }
      if (config.beforeSave) await config.beforeSave(record, original, isNew);
      const data = {};
      for (const field of config.fields) {
        const value = getPath(record, field);
        data[field] = value === undefined ? null : value;
      }
      for (const field of config.requiredFields) {
        if (getPath(record, field) === undefined || getPath(record, field) === null || getPath(record, field) === "") {
          throw new Error(`${field} is required`);
        }
      }
      for (const [field, allowedValues] of Object.entries(config.enums)) {
        const value = getPath(record, field);
        if (value !== undefined && value !== null && !allowedValues.includes(value)) {
          throw new Error(`${field} must be one of: ${allowedValues.join(", ")}`);
        }
      }
      for (const [field, options] of Object.entries(config.fieldOptions)) {
        const value = getPath(record, field);
        if (value === undefined || value === null) continue;
        if (typeof value === "number" && options.min !== undefined && value < options.min) throw new Error(`${field} must be at least ${options.min}`);
        if (typeof value === "number" && options.max !== undefined && value > options.max) throw new Error(`${field} must be at most ${options.max}`);
        if (typeof value === "string" && options.maxLength && value.length > options.maxLength) throw new Error(`${field} exceeds its maximum length`);
        if (typeof value === "string" && options.minLength && value.length < options.minLength) throw new Error(`${field} is shorter than its minimum length`);
        if (typeof value === "string" && options.match && !options.match[0].test(value)) throw new Error(`${field} is invalid`);
      }
      if (config.validate) config.validate(record);
      const timestamp = now();
      const id = record._id || randomUUID();
      const createdAt = isNew ? (record.createdAt || new Date(timestamp)).toISOString() : new Date(record.createdAt || timestamp).toISOString();
      const updatedAt = timestamp;
      const columns = ["_id", ...Object.keys(data), "createdAt", "updatedAt"];
      const values = [id, ...Object.entries(data).map(([field, value]) => encode(field, value, config)), createdAt, updatedAt];
      const updates = columns.slice(1).map((column) => `${identifier(column)} = excluded.${identifier(column)}`).join(", ");
      db.prepare(`INSERT INTO ${identifier(name)} (${columns.map(identifier).join(", ")}) VALUES (${columns.map(() => "?").join(", ")}) ON CONFLICT(_id) DO UPDATE SET ${updates}`).run(...values);
      Object.assign(record, decode(db.prepare(`SELECT * FROM ${identifier(name)} WHERE _id = ?`).get(id), config));
      return attachMethods(record, structuredClone(record));
    },
    find(filter = {}) { return new SqliteQuery(Model, "many", filter); },
    findOne(filter = {}) { return new SqliteQuery(Model, "one", filter); },
    findById(id) { return new SqliteQuery(Model, "one", { _id: id }); },
    async create(data) { return Model._save({ ...data, _id: data._id }); },
    async insertMany(records) { return Promise.all(records.map((record) => Model.create(record))); },
    async countDocuments(filter = {}) {
      const where = compileFilter(filter, config);
      const row = db.prepare(`SELECT COUNT(*) AS count FROM ${identifier(name)}${where.sql ? ` WHERE ${where.sql}` : ""}`).get(...where.values);
      return row.count;
    },
    async deleteMany(filter = {}) {
      const where = compileFilter(filter, config);
      const result = db.prepare(`DELETE FROM ${identifier(name)}${where.sql ? ` WHERE ${where.sql}` : ""}`).run(...where.values);
      return { deletedCount: result.changes };
    },
    async updateMany(filter, update) {
      const records = Model._query(filter);
      for (const record of records) await Model._save({ ...record, ...(update.$set || update) }, record);
      return { modifiedCount: records.length };
    },
    async findByIdAndUpdate(id, update, options = {}) {
      const existing = Model._query({ _id: id })[0];
      if (!existing) return null;
      const changes = update.$set || update;
      const updated = await Model._save({ ...existing, ...changes }, existing);
      return options.new || options.returnDocument === "after" ? updated : existing;
    },
    async findOneAndUpdate(filter, update, options = {}) {
      const existing = Model._query(filter)[0];
      if (!existing) return null;
      const updated = await Model.findByIdAndUpdate(existing._id, update, { new: true });
      return options.new ? updated : existing;
    },
    async findByIdAndDelete(id) {
      const existing = Model._query({ _id: id })[0];
      if (existing) db.prepare(`DELETE FROM ${identifier(name)} WHERE _id = ?`).run(id);
      return existing || null;
    },
    async _populate(record, field, projection) {
      const targetName = config.references[field];
      const target = models.get(targetName);
      if (!target || !record[field]) return;
      const related = target._query({ _id: record[field] })[0];
      record[field] = applyProjection(related, projection, target.hiddenFields);
    },
  };

  models.set(name, Model);
  return Model;
};
