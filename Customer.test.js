let db;
const { createPromiseDB: createDB } = require('./index.js');
const Customer = require('./Customer.table.js');
const fs = require('fs');
beforeAll(async () => {
  db = await createDB(`${__dirname}/test-customer.db`, './tables-create.sql');
  console.log(db);
  Customer.setDB(db)
});
afterAll(async () => {
  console.log(db);
  await db.close();
  fs.unlinkSync(`${__dirname}/test-customer.db`);
})
test(
  'new Customer()',
  () => {
    let c = new Customer({ ID: 1 });
    console.log(c);
    expect(Object.keys(c)).toContain('Name');
  }
)
test(
  "customer.add()",
  async () => {
    let c = new Customer({ ID: 1 });
    let ret = await c.add();
    console.log(ret);
    c = new Customer({ Name: "测试" });
    ret = await c.add();
    console.log(ret);
    expect(ret.lastID).toBeGreaterThan(1);
  }
)
test(
  "customer.remove()",
  async () => {
    let c = new Customer({ ID: 1 });
    let ret = await c.remove();
    console.log(ret);
    expect(ret).not.toBe(null);
  }
)
test(
  "Customer.find()",
  async () => {
    Customer.setDB();
    let c = await Customer.find();
    console.log(c);
    expect(c).not.toBe(null);
    Customer.setDB(db);
    c = await Customer.find();
    console.log(c);
    expect(c).not.toBe(null);
  }
)
