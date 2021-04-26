drop database smart_link_ICO;

create database smart_link_ICO;
use smart_link_ICO;

create table dxd_smartlinks (
    KYCID varchar(255), 
    addr_type ENUM('USD','EUR','BTC','ETH','XTZ'), 
    sender_addr varchar(255), 
    reception_addr varchar(255), 
    mail varchar(255),
    is_smak_sent varchar(255),
    KYCStatus varchar(255),
    SMAK varchar(255) DEFAULT NULL,
    SMAK_pre_sale varchar(255) DEFAULT NULL,
    SMAK_ico varchar(255) DEFAULT NULL,
    No_ICO varchar(255) DEFAULT NULL,
    primary key (sender_addr)
);

create table dxd_blockchain (
    tx_type ENUM('USD','EUR','BTC','ETH','XTZ'),
    tx_hash varchar(255) NOT NULL, 
    amount varchar(255), 
    price_dollar varchar(255), 
    tx_date bigint(100),
    price_date bigint(100),
    primary key (tx_hash)
);

create table dxd_transactions (
    sender_addr varchar(255) not null references dxd_smartlinks(sender_addr), 
    tx_hash varchar(255) not null references dxd_blockchain(tx_hash),
    primary key (tx_hash, sender_addr)
);

create table dxd_blockchain_unverified (
    tx_type ENUM('USD','EUR','BTC','ETH','XTZ'),
    tx_hash varchar(255) NOT NULL, 
    amount varchar(255), 
    price_dollar varchar(255), 
    tx_date bigint(100),
    price_date bigint(100),
    primary key (tx_hash)
);

create table dxd_transactions_unverified (
    sender_addr varchar(255) not null references dxd_smartlinks(sender_addr), 
    tx_hash varchar(255) not null references dxd_blockchain_unverified(tx_hash),
    primary key (tx_hash, sender_addr)
);

LOAD DATA  INFILE '/var/lib/mysql-files/kyc.csv' INTO TABLE dxd_smartlinks FIELDS TERMINATED BY ',' optionally enclosed by '"' LINES TERMINATED BY '\r\n' IGNORE 1 ROWS (KYCID, addr_type, sender_addr, reception_addr, mail, is_smak_sent, KYCStatus);
LOAD DATA  INFILE '/var/lib/mysql-files/blockchain.csv' INTO TABLE dxd_blockchain FIELDS TERMINATED BY ',' optionally enclosed by '"' LINES TERMINATED BY '\r\n' IGNORE 1 ROWS (tx_type, tx_hash, amount, price_dollar, tx_date, price_date);
LOAD DATA  INFILE '/var/lib/mysql-files/transactions.csv' INTO TABLE dxd_transactions FIELDS TERMINATED BY ',' optionally enclosed by '"' LINES TERMINATED BY '\r\n' IGNORE 1 ROWS (sender_addr,tx_hash);
LOAD DATA  INFILE '/var/lib/mysql-files/blockchain_unverified.csv' INTO TABLE dxd_blockchain_unverified FIELDS TERMINATED BY ',' optionally enclosed by '"' LINES TERMINATED BY '\r\n' IGNORE 1 ROWS (tx_type, tx_hash, amount, price_dollar, tx_date, price_date);
LOAD DATA  INFILE '/var/lib/mysql-files/transactions_unverified.csv' INTO TABLE dxd_transactions_unverified FIELDS TERMINATED BY ',' optionally enclosed by '"' LINES TERMINATED BY '\r\n' IGNORE 1 ROWS (sender_addr,tx_hash);