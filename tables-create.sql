CREATE TABLE IF NOT EXISTS Customer (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT ,
    Address TEXT,
    Area TEXT, 
    PackageType TEXT,
    BusinessType TEXT, 
    WiringID TEXT, 
    InstallDate DATE ,
    BroadbandAccount TEXT DEFAULT NULL,
    Password TEXT DEFAULT NULL,
    ContactPeople TEXT DEFAULT NULL,
    Phone TEXT DEFAULT NULL
);

Create Table IF NOT EXISTS Pays (
    CustomerID INT, 
    Price Number, -- 收入费用
    Cost Number, -- 成本
    DateBegin DATE NOT NULL,
    DateEnd DATE NOT NULL,/* 1 还没到期, 0 到期 */
    FOREIGN KEY(CustomerID) REFERENCES Customer(ID)
    PRIMARY KEY(CustomerID,DateBegin,DateEnd)
);

DROP View IF EXISTS CustomerPayView;
Create View CustomerPayView
  As Select
    ID, 
    Name, 
    Address,
    Area,
    PackageType,
    BusinessType,
    WiringID,
    InstallDate,
    BroadbandAccount,
    Password,
    ContactPeople,
    Phone,
    Max(P.DateBegin) DateBegin,
    Max(P.DateEnd) DateEnd,
    cast(julianday(DateEnd) - julianday('now')  as int) as RemainingDays 
  From Customer as C
      Join Pays as P 
  Where C.ID = P.CustomerID 
  Group By C.ID;

Create Table IF NOT EXISTS PublicCostDetail (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  EventOfDay DATE NOT NULL,
  Reason TEXT NOT NULL,
  Amount Number NOT NULL,
  Acconted Number DEFAULT 0, /* 0:未入账, 1: 已入账 */
  Note TEXT DEFAULE NULL
);

Create Table IF NOT EXISTS ProjectCost(
  ID Integer PRIMARY KEY AUTOINCREMENT,
  ProjectYear Integer NOT NULL,
  ItemType NUMBER DEFAULT 0, /* 0: 花销, 1: 投入*/
  Name TEXT NOT NULL,
  EventDescription TEXT NOT NULL,
  Amount Number NOT NULL,
  Stakeholder TEXT DEFAULT NULL,
  Note TEXT DEFAULT NULL
);

Create Table IF NOT EXISTS DailyCost (
  ID Integer PRIMARY KEY AUTOINCREMENT,
  EventOfDay DATE NOT NULL,
  EventDesc TEXT NOT NULL,
  Amount Number NOT NULL, 
  Note TEXT,
  Repayment Number DEFAULT 0 /* 1:报销, 0:未报销 */
);
