drop database smart_link_ICO;

create database smart_link_ICO;
use smart_link_ICO;

create table dxd_smartlinkcopy (
    KYCID varchar(255), 
    addr_type ENUM('USD','EUR','BTC','ETH','XTZ') DEFAULT NULL, 
    sender_addr varchar(255), 
    reception_addr varchar(255), 
    mail varchar(255),
    is_smak_sent varchar(255) DEFAULT NULL,
    KYCStatus varchar(255),
    date_add int(11),
    validation_date int(11) DEFAULT NULL,
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
    sender_addr varchar(255) not null references dxd_smartlinkcopy(sender_addr), 
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
    sender_addr varchar(255) not null references dxd_smartlinkcopy(sender_addr), 
    tx_hash varchar(255) not null references dxd_blockchain_unverified(tx_hash),
    primary key (tx_hash, sender_addr)
);