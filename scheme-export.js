#!/usr/bin/env node
const {
  createPromiseDB,
} = require('./index.js');
const {
  join: pathJoin
} = require('path');
const fs = require('fs');

const getTablesSQL = `SELECT name,type from sqlite_master
where (type="table" or type="view") and name not like 'sqlite_%';`
async function getTables(db) {
  return (
    await db.query(getTablesSQL)
  );
}
async function getMetaOf(db, table) {
  const { name, type } = table;
  const sql = `SELECT name, pk as isPK FROM Pragma_table_info('${name}')`;
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
      { fields: [], pks: [], name, type }
    )
}

function createClass({ fields, pks, name, type }, toDir = "./") {
  const otherFun = name => `${name}(){throw new Error("View can not be write")}`;
  let otherMethod = [];
  if (type == 'view') {
    otherMethod.push(otherFun('add'));
    otherMethod.push(otherFun('update'));
    otherMethod.push(otherFun('remove'));
  }
  const classContent = `const Table=require('@keepzen/orm-for-sqlite3/Table.js');
class ${name} extends Table {
  constructor(initValues = {}) {
    super(
      [${fields.map(JSON.stringify).join(',')}],
      [${pks.map(JSON.stringify).join(',')}],
      initValues
    );
  }
  ${otherMethod.join("\n  ")}
}
module.exports = ${name};
`;
  fs.writeFileSync(pathJoin(toDir, `${name}.${type}.js`), classContent);
}
async function main(dbPath, sqlScriptPath, toDir = "./") {
  let db = await createPromiseDB(dbPath, sqlScriptPath);
  const tables = await getTables(db);
  for (let table of tables) {
    let meta = await getMetaOf(db, table);
    createClass(meta, toDir);
  }
  const files = tables.map(t => `${t.name}.${t.type}.js`);
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
