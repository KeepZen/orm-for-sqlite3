function getSQLParams(obj, prefix = "$") {
  return Object.keys(obj).reduce(
    (ret, key) => {
      const newKey = prefix + key;
      const value = obj[key];
      if (value !== null) {
        ret[newKey] = value;
      }
      return ret;
    },
    {}
  );
}
let _db;
class Table {
  #deleteSQL = null;
  #primaryKey = null;
  #fields = null;
  static setDB(db) {
    _db = db;
  }
  constructor(fields = [], pks = [], initValues = {}) {
    for (let key of fields) {
      this[key] = initValues[key];
    }
    this.#fields = fields;
    const deleteWhere = fields.map(key => `${key}=$${key}`).join(" AND ")
    this.#deleteSQL = `DELETE FROM ${this.constructor.name}\n` +
      `WHERE ${deleteWhere}`;

    this.#primaryKey = pks;
    return Object.seal(this);
  }
  getInsertSQL() {
    const goodFileds = this.#fields.filter(k => this[k] !== undefined);
    const sqlFields = `(${goodFileds.join(",")})`;
    const paramsNames = goodFileds.map(k => `$${k}`);
    const values = `VALUES(${paramsNames.join(", ")})`;
    return `INSERT INTO ${this.constructor.name}\n ${sqlFields}\n` +
      `${values}`;
  }
  getUpdateSQL() {
    const goodFileds = this.#fields.filter(k => {
      return this[k] !== undefined && !this.#primaryKey.includes(k)
    });
    const udpateFields = goodFileds.map(k => `${k}=$${k}`);
    const updateWhere = this.#primaryKey.map(key => `${key}=$${key}`).join(" AND ");
    return `UPDATE ${this.constructor.name}\n ` +
      `SET ${udpateFields.join(", ")}\n` +
      `WHERE ${updateWhere}`;
  }
  async add(debug = false) {
    const sql = this.getInsertSQL();
    if (debug) {
      console.log(sql);
    }
    if (_db) {
      const ret = await _db.execute(sql, getSQLParams(this));
      if (this.#primaryKey.length == 1 && ret.lastID != null) {
        const id = this.#primaryKey[0];
        this[id] = ret.lastID;
      }
      return ret;
    } else {
      return sql;
    }
  }
  async update(debug = false) {
    const sql = this.getUpdateSQL();
    if (debug) {
      console.log(sql);
    }
    const db = _db;
    if (db) {
      return await db.execute(sql, getSQLParams(this));
    } else {
      return sql;
    }
  }
  async remove(debug = false) {
    const sql = this.#deleteSQL;
    if (debug) {
      console.log(sql);
    }
    if (_db) {
      return await _db.execute(sql, getSQLParams(this));
    } else {
      return sql;
    }
  }
  static async find(
    { select = [], where = "", orderBy = [] } = {},
    debug = false,
  ) {
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
    if (debug) {
      console.log('sql:%s', sql);
    }
    if (_db) {
      return await _db.query(sql, getSQLParams(this));
    } else {
      return sql;
    }
  }
}
module.exports = Table;
