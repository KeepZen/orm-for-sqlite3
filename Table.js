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
      const value = initValues[key];
      this[key] = value != undefined ? value : null;
    }
    const sqlFields = `(${fields.join(",")})`;
    const paramsNames = fields.map(k => `$${k}`);
    const values = `VALUES(${paramsNames.join(", ")})`;
    this.#insertSQL = `INSERT INTO ${this.constructor.name}\n ${sqlFields}\n` +
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
      const ret = await _db.execute(this.#insertSQL, getSQLParams(this));
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
  static async find({ select = [], where = "", orderBy = [] } = {}) {
    const whereCause = typeof (where) == "string" ?
      where :
      Object.entries(where).map(([key, value]) => {
        return `${key}=${JSON.stringify(value)}`
      }).join(" AND ")

    let orderCause = '';
    if (orderBy.length > 0) {
      orderCause = `ORDER BY ` + orderBy.join(",");
    }
    const sql = `SELECT ${select.join(",") || "*"} \n` +
      `FROM ${this.name}\n` +
      `${whereCause == '' ? whereCause : "WHERE " + whereCause}\n` +
      `${orderCause}`;
    if (_db) {
      return await _db.query(sql, getSQLParams(this));
    } else {
      return sql;
    }
  }
}
module.exports = Table;
