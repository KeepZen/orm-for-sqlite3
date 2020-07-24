const {
  createPromiseDB,
} = require('./index.js');
const {
  join: pathJoin
} = require('path');
const fs = require('fs');

const getTablesSQL = `SELECT name from sqlite_master where type="table" and name not like 'sqlite_%';`
async function getTables(db) {
  return (
    await db.query(getTablesSQL)
  ).map(({ name }) => name);
}
async function getMetaOf(db, tableName) {
  const sql = `SELECT name, pk as isPK FROM Pragma_table_info('${tableName}')`;
  return (await db.query(sql)).
    reduce(
      (ret, { name, isPK }) => {
        const { fields, pks } = ret;
        if (isPK) {
          pks.push(name);
        }
        fields.push(name);
        return ret;
      },
      { fields: [], pks: [], table: tableName }
    )
}

function createClass({ fields, pks, table }, toDir = "./") {
  const classContent = `const Table=require('@keepzen/orm-for-sqlite3/Table.js');
class ${table} extends Table {
  constructor(initValues = {}) {
    super(
      [${fields.map(JSON.stringify).join(',')}],
      [${pks.map(JSON.stringify).join(',')}],
      initValues
    );
  }
}
module.exports = ${table};
`;
  fs.writeFileSync(pathJoin(toDir, `${table}.table.js`), classContent);
}
async function main(dbPath, sqlScriptPath, toDir = "./") {
  let db = await createPromiseDB(dbPath, sqlScriptPath);
  const tables = await getTables(db);
  for (let table of tables) {
    let meta = await getMetaOf(db, table);
    createClass(meta, toDir);
  }
  const files = tables.map(t => `${t}.table.js`);
  return `Have create fellow files:\n ${files.join("\n ")}.`;
}
if (module == require.main) {
  const argv = process.argv;
  if (argv.length < 3) {
    console.log(process.argv0);
    console.log(`Usage:
    Just export table from db:
      ${argv[0]} ${argv[1]} db-path [export-class-dir="./"]
    Run sql script and export table scheme:
    ${argv[0]} ${argv[1]} db-path script-path [export-class-dir]
    `);
    return;
  }
  main(argv[2], argv[3]).then(console.log, console.error);
}
