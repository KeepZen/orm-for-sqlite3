function getSQLParams(obj, prefix = "$") {
  return Object.keys(obj).reduce(
    (ret, key) => {
      const newKey = prefix + key;
      const value = obj[key];
      ret[newKey] = value;
      return ret;
    },
    {}
  );
}
let _db;
class Table {
  #insertSQL = null;
  #updateSQL = null;
  #deleteSQL = null;
  #primaryKey = null;
  static setDB(db) {
    _db = db;
  }
  constructor(fields = [], pks = [], initValues = {}) {
    for (let key of fields) {
      const v = initValues[key] || null;
      this[key] = v;
    }
    const sqlFields = `(${fields.join(",")})`;
    const paramsNames = fields.map(k => `$${k}`);
    const values = `VALUES(${paramsNames.join(", ")})`;
    this.#insertSQL = `${INSERT} ${this.constructor.name}\n ${sqlFields}\n` +
      `${values}`;

    const udpateFields = fields.map(k => `${k}=$${k}`);
    const updateWhere = pks.map(key => `${key}=$${key}`).join(" AND ");
    this.#updateSQL = `UPDATE ${this.constructor.name}\n ` +
      `SET ${udpateFields.join(", ")}\n` +
      `WHERE ${updateWhere}`;

    const deleteWhere = fields.map(key => `${key}=$${key}`).join(" AND ")
    this.#deleteSQL = `DELETE FROM ${this.constructor.name}\n` +
      `WHERE ${deleteWhere}`;

    this.#primaryKey = pks;
    return Object.seal(this);
  }
  async add() {
    if (_db) {
      const ret = await db.execute(this.#insertSQL, getSQLParams(this));
      if (this.#primaryKey.length == 1 && ret.lastID != null) {
        const id = this.#primaryKey[0];
        this[id] = ret.lastID;
      }
      return ret;
    } else {
      return this.#insertSQL;
    }
  }
  async update() {
    const sql = this.#updateSQL;
    const db = _db;
    if (db) {
      return await db.execute(sql, getSQLParams(this));
    } else {
      return sql;
    }
  }
  async remove() {
    const sql = this.#deleteSQL;
    if (_db) {
      return await _db.execute(sql, getSQLParams(this));
    } else {
      return sql;
    }
  }
  static async find({ fields = [], condtion = {}, order = [] } = {}) {
    let whereCause = '';
    const entries = Object.entries(condtion);
    if (entries.length > 0) {
      whereCause = `WHERE ` + entries.map(([key, value]) => {
        return `${key}=${JSON.stringify(value)}`
      }).join(" AND ")
    }
    let orderCause = '';
    if (order.length > 0) {
      orderCause = `ORDER BY ` + order.join(",");
    }
    const sql = `SELECT ${fields.join(",") || "*"} \n` +
      `FROM ${this.name}\n` +
      `${whereCause} ${orderCause}`;
    if (_db) {
      return await _db.query(sql, getSQLParams(this));
    } else {
      return sql;
    }
  }
}
module.exports = Table;
