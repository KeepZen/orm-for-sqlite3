const fs = require('fs');
const sqlite3 = require('sqlite3');
async function createDB(dbPath, sqlScript) {
  if (!fs.existsSync(dbPath)) {
    const db = new sqlite3.Database(dbPath);
    if (sqlScript != null) {
      await sqlitePromsieRunScripte(db, sqlScript);
    }
    return db;
  }
  return new sqlite3.Database(dbPath);
}
async function sqlitePromsieRunScripte(db, scriptPath) {
  const sqls = fs.readFileSync(scriptPath).
    toString().
    split(";").
    map(t => t.trim()).
    filter(t => t);
  try {
    for (let sql of ["BEGIN", ...sqls, "COMMIT"]) {
      await sqlitePromise(db, 'run', sql);
    }
  } catch (err) {
    await sqlitePromise(db, 'run', "ROLLBACK");
    throw err;
  }
}
function sqlitePromise(db, methold, ...params) {
  const [sql] = params;
  return new Promise((resolve, reject) => {
    db[methold](...params, function (err, result) {
      if (err) {
        const message = `[SQL:${sql}]\n${err.message}: \n` + err.stack;
        console.trace(message);
        reject(message);
      } else {
        resolve(result || this);
      }
    })
  })
}
async function createPromiseDB(dbPath, sqlScript = null) {
  const db = await createDB(dbPath, sqlScript);
  return {
    query: sqlitePromise.bind(null, db, 'all'),
    execute: sqlitePromise.bind(null, db, "run"),
    begin: sqlitePromise.bind(null, db, 'run', "BEGIN"),
    commit: sqlitePromise.bind(null, db, 'run', "COMMIT"),
    rollback: sqlitePromise.bind(null, db, 'run', 'ROLLBACK'),
    runScript: sqlitePromsieRunScripte.bind(null, db),
  };
}
module.exports = {
  createPromiseDB,
}
