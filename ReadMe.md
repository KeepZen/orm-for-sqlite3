# What is this package?

I use this package to learn ORM. So I create this one, it is a mini ORM.
You can use this to operate sqlite tables.

# How to use?
1. first install it
  
   Use npm:
  
   ```sh
   npm i @keepzen/orm-for-sqlite3
   ```

   Use yarn
   ```sh
   yarn add @keepzen/orm-for-sqlite3
   ```
2. Create your creat table sql script
3. Create sqlite db file and Module class.
   ```sh
   npx orm-sqlite3-cli db-path/db-name the-dir-you-want-module-to-keep the-sql-script-path
   ```
4. Use the generate Code
   ```js
   const Customer = require('./Customer.table.js');
   let a = Customer({Name:"Bob"});
   async ()=>{
      await a.add();//Insert customer whith Name -- bob
      a.Name = "Tom";
      await a.update();//update
      await a.remove(); //delete
      await Customer.find({select:["ID","Name"],where:"ID != 0",orderBY:["ID"]});//[Customer] 
   }
   ```
