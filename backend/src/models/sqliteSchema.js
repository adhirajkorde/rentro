import { createSqliteModel } from "./sqliteModel.js";

class ObjectIdField {}
class MixedField {}

const modelRegistry = Object.create(null);
const isPlainObject = (value) => value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
const supportedType = (type) => [String, Number, Boolean, Date, Array, Object, ObjectIdField, MixedField].includes(type);

class Schema {
  constructor(definition, options = {}) {
    this.definition = definition;
    this.options = options;
    this.methods = {};
    this.hooks = [];
    this.indexDefinitions = [];
    this.paths = {};
    this._collectPaths(definition);
  }

  _collectPaths(definition, prefix = "") {
    for (const [name, field] of Object.entries(definition)) {
      const fieldPath = prefix ? `${prefix}.${name}` : name;
      const isFieldDefinition = isPlainObject(field)
        && Object.hasOwn(field, "type")
        && (supportedType(field.type) || Array.isArray(field.type));
      if (isFieldDefinition) {
        this.paths[fieldPath] = { type: field.type, options: field };
      } else if (isPlainObject(field)) {
        this._collectPaths(field, fieldPath);
      } else {
        this.paths[fieldPath] = { type: field, options: {} };
      }
    }
  }

  index(fields, options = {}) {
    this.indexDefinitions.push({ fields, options });
    return this;
  }

  pre(event, handler) {
    if (event === "save") this.hooks.push(handler);
    return this;
  }
}

Schema.Types = { ObjectId: ObjectIdField, Mixed: MixedField };

const saveHooks = (hooks) => async (record, original) => {
  for (const hook of hooks) {
    await new Promise((resolve, reject) => {
      let settled = false;
      const next = (error) => {
        if (settled) return;
        settled = true;
        if (error) reject(error);
        else resolve();
      };
      try {
        const result = hook.call(record, next);
        if (result && typeof result.then === "function") {
          result.then(() => {
            if (hook.length === 0) next();
          }, next);
        } else if (hook.length === 0) {
          next();
        }
      } catch (error) {
        next(error);
      }
    });
  }
};

const fieldType = (type) => {
  if (Array.isArray(type) || type === Array || type === Object || type === MixedField) return "json";
  if (type === Date) return "date";
  if (type === Number) return "number";
  if (type === Boolean) return "boolean";
  return "string";
};

export const model = (name, schema) => {
  if (modelRegistry[name]) return modelRegistry[name];
  const fields = Object.keys(schema.paths);
  const defaults = {};
  const enums = {};
  const references = {};
  const fieldOptions = {};
  const jsonFields = [];
  const dateFields = [];
  const numberFields = [];
  const booleanFields = [];
  const requiredFields = [];
  const hiddenFields = [];
  const uniqueFields = [];

  for (const [field, definition] of Object.entries(schema.paths)) {
    const options = definition.options;
    const type = fieldType(definition.type);
    fieldOptions[field] = options;
    if (Object.hasOwn(options, "default")) defaults[field] = options.default;
    if (options.required) requiredFields.push(field);
    if (options.select === false) hiddenFields.push(field);
    if (options.enum) enums[field] = options.enum;
    if (options.ref) references[field] = options.ref;
    if (options.unique) uniqueFields.push(field);
    if (type === "json") jsonFields.push(field);
    if (type === "date") dateFields.push(field);
    if (type === "number") numberFields.push(field);
    if (type === "boolean") booleanFields.push(field);
  }

  const indexes = schema.indexDefinitions.map(({ fields: indexFields, options }) => ({ fields: indexFields, options }));
  const instanceMethods = Object.fromEntries(
    Object.entries(schema.methods).map(([methodName, handler]) => [methodName, handler])
  );
  const sqliteModel = createSqliteModel(name, {
    fields,
    defaults,
    enums,
    references,
    jsonFields,
    dateFields,
    numberFields,
    booleanFields,
    requiredFields,
    hiddenFields,
    uniqueFields,
    indexes,
    fieldOptions,
    beforeSave: saveHooks(schema.hooks),
    instanceMethods,
    timestamps: schema.options.timestamps !== false,
  });
  modelRegistry[name] = sqliteModel;
  return sqliteModel;
};

export const models = modelRegistry;

export default { Schema, model, models };
