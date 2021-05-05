# Fungible Assets - FA12
# Inspired by https://gitlab.com/tzip/tzip/blob/master/A/FA1.2.md

import smartpy as sp

class FA12_core(sp.Contract):
    # The FA12_core constructor takes as a parameter:
    # - admin address
    # - total supply (admin supply)
    def __init__(self, admin, supply, **extra_storage):
        contract_metadata = sp.big_map(
            l = {
                "": sp.bytes_of_string('tezos-storage:data'),
                "data": sp.bytes_of_string(
                    """{ 
                        "name": "SmartLink",
                        "description": "Decentralized escrow platform for Web 3.0",
                        "authors": ["SmartLink Dev Team <team@smartlink.so>"],
                        "homepage": "https://smartlink.so/",
                        "interfaces": [ "TZIP-007", "TZIP-016"],
                        "symbol":"SMAK",
                        "icon":"ipfs://QmU2C4jU154nwA71AKHeiEj79qe7ZQC4Mf7AeUj5ALXZfe",
                        "decimals":"3"
                    }"""
                )
            },
          tkey = sp.TString,
          tvalue = sp.TBytes            
        )

        token_metadata = sp.big_map(
            l = {
                0: (
                    0,
                    sp.map(
                        l = {
                            "name": sp.bytes_of_string('Smartlink'), 
                            "decimals": sp.bytes_of_string('3'),
                            "symbol": sp.bytes_of_string('SMAK'),
                            "icon": sp.bytes_of_string('ipfs://QmU2C4jU154nwA71AKHeiEj79qe7ZQC4Mf7AeUj5ALXZfe')
                        },
                        tkey = sp.TString,
                        tvalue = sp.TBytes
                    )
                )
            },
            tkey = sp.TNat,
            tvalue = sp.TPair(sp.TNat, sp.TMap(sp.TString, sp.TBytes))
        )
        
        self.balances = sp.big_map(
            l = {admin: sp.record(balance = supply, approvals = {})}, 
            tkey = sp.TAddress,
            tvalue = sp.TRecord(approvals = sp.TMap(sp.TAddress, sp.TNat), balance = sp.TNat)
        )
        
        self.init(
            balances = self.balances,
            metadata = contract_metadata,
            token_metadata = token_metadata, 
            frozen_accounts = sp.big_map(tkey = sp.TAddress, tvalue = sp.TTimestamp),
            totalSupply = supply,  
            **extra_storage
        )

    # The internal_transfer function is used internally by the contract and allows to transfer funds from one address to another.
    # The function takes as parameters:
    # - the address from which the transfer is made
    # - the address to which the transfer is made
    # - the value of the transfer
    def internal_transfer(self, from_, to_, value):
         # Add both addresses if necessary
        self.addAddressIfNecessary(from_)                 
        self.addAddressIfNecessary(to_)
        # Verify is the balance is sufficient
        sp.verify(self.data.balances[from_].balance >=value, "Insufficient Balance")
        # Update the account from which the transfer is made
        self.data.balances[from_].balance = sp.as_nat(self.data.balances[from_].balance - value)
        # Update the account to which the transfer is made
        self.data.balances[to_].balance += value
        sp.if (from_ != sp.sender):
            self.data.balances[from_].approvals[sp.sender] = sp.as_nat(self.data.balances[from_].approvals[sp.sender] - value)

    # The transfer function allows a user to transfer funds from one account to another specified account, only if his account is not frozen. 
    # A user can transfer funds:
    # - from his account to his/another account
    # - if he is on the approved users list, from the account that authorizes his transfers to his/another account. n this case the user can only transfer up to the amount he was approved to.
    # The function takes as parameters:
    # - the address from which the transfer is made
    # - the address to which the transfer is made
    # - the value of the transfer
    @sp.entry_point
    def transfer(self, params):
        sp.set_type(params, sp.TRecord(from_ = sp.TAddress, to_ = sp.TAddress, value = sp.TNat).layout(("from_ as from", ("to_ as to", "value"))))
        sp.verify((params.from_ == sp.sender) |
                 (self.data.balances[params.from_].approvals[sp.sender] >= params.value), message = "You are not authorized to transfer SMAK from this address")
        sp.if (self.data.frozen_accounts.contains(params.from_)):
            sp.verify((self.data.frozen_accounts[params.from_] < sp.now), message = "Frozen address, transfer is impossible")
        self.internal_transfer(params.from_, params.to_, params.value)
    

    # The approve function allows a user (the sender) authorize another user (the spender) to transfer a defined number of tokens from his account. 
    # The function takes as parameters:
    # - the address of the spender 
    # - the approved value to spend
    @sp.entry_point
    def approve(self, params):
        sp.set_type(params, sp.TRecord(spender = sp.TAddress, value = sp.TNat).layout(("spender", "value")))
        self.addAddressIfNecessary(sp.sender)
        alreadyApproved = self.data.balances[sp.sender].approvals.get(params.spender, 0)
        sp.verify((alreadyApproved == 0) | (params.value == 0), "UnsafeAllowanceChange")
        self.data.balances[sp.sender].approvals[params.spender] = params.value

    # The addAddressIfNecessary function is used internally by the contract to add a new address and its balance to the balances big map
    # The function takes as parameters:
    # - the address to add to the balances big map
    def addAddressIfNecessary(self, address):
        sp.if ~ self.data.balances.contains(address):
            self.data.balances[address] = sp.record(balance = 0, approvals = {})

    @sp.view(sp.TNat)
    def getBalance(self, params):
        sp.if self.data.balances.contains(params):
            sp.result(self.data.balances[params].balance)
        sp.else:
            sp.result(sp.nat(0))

    @sp.view(sp.TNat)
    def getAllowance(self, params):
        sp.if self.data.balances.contains(params.owner):
            sp.result(self.data.balances[params.owner].approvals.get(params.spender, 0))
        sp.else:
            sp.result(sp.nat(0))
            
    @sp.view(sp.TBigMap(sp.TAddress, sp.TTimestamp))
    def getFrozenAccounts(self, params):
        sp.set_type(params, sp.TUnit)
        sp.result(self.data.frozen_accounts)
            
    @sp.view(sp.TNat)
    def getTotalSupply(self, params):
        sp.set_type(params, sp.TUnit)
        sp.result(self.data.totalSupply)
        
class FA12_freeze(FA12_core):
    # The transferAndFreeze function allows a freezer to transfer funds to an account and freeze it. He cannot use this function on an admin account.
    # The function takes as parameters:
    # - the address to which the transfer is made and that is going to be frozen
    # - the value of the transfer 
    # - the duration in seconds of the  freeze
    @sp.entry_point
    def transferAndFreeze(self, params):
        sp.set_type(params, sp.TRecord(to_ = sp.TAddress, value = sp.TNat, duration = sp.TInt).layout((("to_ as to", "value"), "duration")))
        sp.verify(self.is_freezer(sp.sender), message = "Only a freezer can freeze funds")
        sp.verify(~self.is_administrator(params.to_), message = "You cannot freeze an admin account")
        sp.verify(self.data.balances[sp.sender].balance >= params.value, message = "There is not enough SMAK on the Freezer account")
        self.internal_transfer(sp.sender, params.to_, params.value)
        sp.verify(params.duration > 0, "The freeze duration must be greater than 0 seconds. Please use the transfer entry point for a regular transfer.")
        self.data.frozen_accounts[params.to_] = sp.now.add_seconds(params.duration)
        
    # The is_freezer function is internally called by the contract and allows it to check if the sender of a trasfer is a freezer
    # The function takes as parameters:
    # - the address of the sender
    def is_freezer(self, sender):
        return sender == self.data.freezer

    # The setFreezer function allows an administrator to set a new freezer, if there is no designate freezer yet. An administrator cannot choose himself or another administrator as freezer. 
    # The function takes as parameters:
    # - the address of the freezer
    @sp.entry_point
    def setFreezer(self, params):
        sp.set_type(params, sp.TAddress)
        sp.verify(self.is_administrator(sp.sender))
        self.data.freezer = params
    
    # The unsetFreezer function allows an administrator to unset the freezer role using the contract address as replacement.
    @sp.entry_point
    def unsetFreezer(self):
        sp.verify(self.is_administrator(sp.sender))
        self.data.freezer = sp.self_address

    @sp.view(sp.TAddress)
    def getFreezer(self, params):
        sp.set_type(params, sp.TUnit)
        sp.result(self.data.freezer)
    
class FA12_burn(FA12_core):
    # The burn function allows an admin to burn a speicified amount of tokens of the total supply
    # The function takes as parameters:
    # - the number of burnt tokenss
    @sp.entry_point
    def burn(self, params):
        sp.set_type(params, sp.TRecord(value = sp.TNat))
        sp.verify(self.is_administrator(sp.sender))
        sp.verify(self.data.balances[sp.sender].balance >= params.value)
        self.data.balances[sp.sender].balance = sp.as_nat(self.data.balances[sp.sender].balance - params.value)
        self.data.totalSupply = sp.as_nat(self.data.totalSupply - params.value)

class FA12_administrator(FA12_core):
    # The is_administrator function is internally called by the contract and allows it to check if the sender of a trasfer is an administrator
    # The function takes as parameters:
    # - the address of the sender
    def is_administrator(self, sender):
        return sender == self.data.administrator

    # The is_administrator function allows to set a new administrator
    # The function takes as parameters:
    # - the address of the designated administrator
    @sp.entry_point
    def setAdministrator(self, params):
        sp.set_type(params, sp.TAddress)
        sp.verify(self.is_administrator(sp.sender))
        self.data.administrator = params

    @sp.view(sp.TAddress)
    def getAdministrator(self, params):
        sp.set_type(params, sp.TUnit)
        sp.result(self.data.administrator)

class FA12(FA12_burn, FA12_administrator, FA12_core, FA12_freeze):
    def __init__(self, admin, supply):
        FA12_core.__init__(self, admin, supply, administrator = admin, freezer = admin)

class Viewer(sp.Contract):
    def __init__(self, t):
        self.init(last = sp.none)
        self.init_type(sp.TRecord(last = sp.TOption(t)))
        
    @sp.entry_point
    def target(self, params):
        self.data.last = sp.some(params)

if "templates" not in __name__:
    @sp.add_test(name = "FA12")
    def test():

        scenario = sp.test_scenario()
        scenario.h1("FA1.2 template - Fungible assets")

        scenario.table_of_contents()

        # sp.test_account generates ED25519 key-pairs deterministically:
        admin = sp.test_account("Administrator")
        freezer = sp.test_account("Freezer")
        alice = sp.test_account("Alice")
        bob   = sp.test_account("Robert")

        # Let's display the accounts:
        scenario.h1("Accounts")
        scenario.show([admin, alice, bob, freezer])
        scenario.h1("Contract")
        c1 = FA12(admin.address, 28)

        scenario.h1("Entry points")
        scenario += c1
        scenario.h2("Transfer & approval")
        scenario.h3("Admin transfers a few coints to Alice")
        scenario += c1.transfer(from_ = admin.address, to_ = alice.address, value = 14).run(sender = admin)
        scenario.h3("Alice transfers to Bob")
        scenario += c1.transfer(from_ = alice.address, to_ = bob.address, value = 4).run(sender = alice)
        scenario.verify(c1.data.balances[alice.address].balance == 10)
        scenario.h3("Bob tries to transfer from Alice but he doesn't have her approval")
        scenario += c1.transfer(from_ = alice.address, to_ = bob.address, value = 4).run(sender = bob, valid = False)
        scenario.h3("Alice approves Bob and Bob transfers")
        scenario += c1.approve(spender = bob.address, value = 5).run(sender = alice)
        scenario.h3("Bob tries to transfer again from Alice and it works")
        scenario += c1.transfer(from_ = alice.address, to_ = bob.address, value = 4).run(sender = bob)
        scenario.h3("Bob tries to over-transfer from Alice")
        scenario += c1.transfer(from_ = alice.address, to_ = bob.address, value = 4).run(sender = bob, valid = False)
        
        scenario.h2("Freeze")
        scenario.h3("Admin transfers tokens to Bob and freezes his account")
        scenario += c1.transferAndFreeze(to_ = bob.address, value = 4, duration = 10000000).run(sender = admin)
        scenario.h3("Bob tries to transfer but his account is frozen")
        scenario += c1.transfer(from_ = bob.address, to_ = alice.address, value = 1).run(sender = bob, valid = False)
        scenario.h3("Once the freeze period is over, Bob can transfer his funds again")
        scenario += c1.transfer(from_ = bob.address, to_ = alice.address, value = 1).run(sender = bob, valid = True, now = sp.timestamp(10000001))
        scenario.h3("Admin designates a freezer")
        scenario += c1.setFreezer(freezer.address).run(sender = admin)
        scenario += c1.transfer(from_ = admin.address, to_ = freezer.address, value = 6).run(sender = admin)
        scenario.verify(c1.is_freezer(freezer.address))
        scenario.h3("Alice tries to designate a freezer but fails")
        scenario += c1.setFreezer(freezer.address).run(sender = alice, valid = False)
        scenario.h3("Admin cannot freeze anymore")
        scenario += c1.transferAndFreeze(to_ = bob.address, value = 4, duration = 10000000).run(sender = admin, valid = False)
        scenario.h3("Freezer transfers tokens to Bob and freezes his account")
        scenario += c1.transferAndFreeze(to_ = bob.address, value = 4, duration = 10000000).run(sender = freezer)
        scenario.h3("Freezer tries to transfer tokens to Admin and freezes his account but fails")
        scenario += c1.transferAndFreeze(to_ = admin.address, value = 4, duration = 10000000).run(sender = freezer, valid = False)
        scenario.h3("Alices tries to unset the freezer role but fails")
        scenario += c1.unsetFreezer().run(sender = alice, valid = False)
        scenario.h3("Admin unsets the freezer role")
        scenario += c1.unsetFreezer().run(sender = admin)
        scenario.verify_equal(c1.data.freezer, c1.address)
        scenario.h3("Nobody can freeze")
        scenario += c1.transferAndFreeze(to_ = alice.address, value = 2, duration = 10000000).run(sender = freezer, valid = False)
        scenario += c1.transferAndFreeze(to_ = alice.address, value = 2, duration = 10000000).run(sender = admin, valid = False)
        scenario.h3("Freezer sends the remaining funds to admin")
        scenario += c1.transfer(from_ = freezer.address, to_ = admin.address, value = 2).run(sender = freezer)
        
        scenario.h2("Burn")
        scenario.h3("Admin burns his token")
        scenario += c1.burn(value = 1).run(sender = admin)
        scenario.verify(c1.data.balances[alice.address].balance == 7)
        scenario.h3("Alice tries to burn her token")
        scenario += c1.burn(value = 1).run(sender = alice, valid = False)
        
        scenario.h2("Balance check")
        scenario.verify(c1.data.totalSupply == 27)
        scenario.verify(c1.data.balances[alice.address].balance == 7)
        scenario.verify(c1.data.balances[bob.address].balance == 15)
        scenario.verify(c1.data.balances[freezer.address].balance == 0)

        scenario.h1("Views")
        scenario.h2("Balance")
        view_balance = Viewer(sp.TNat)
        scenario += view_balance
        scenario += c1.getBalance((alice.address, view_balance.typed.target))
        scenario.verify_equal(view_balance.data.last, sp.some(7))

        scenario.h2("Administrator")
        view_administrator = Viewer(sp.TAddress)
        scenario += view_administrator
        scenario += c1.getAdministrator((sp.unit, view_administrator.typed.target))
        scenario.verify_equal(view_administrator.data.last, sp.some(admin.address))

        scenario.h2("Total Supply")
        view_totalSupply = Viewer(sp.TNat)
        scenario += view_totalSupply
        scenario += c1.getTotalSupply((sp.unit, view_totalSupply.typed.target))
        scenario.verify_equal(view_totalSupply.data.last, sp.some(27))

        scenario.h2("Allowance")
        view_allowance = Viewer(sp.TNat)
        scenario += view_allowance
        scenario += c1.getAllowance((sp.record(owner = alice.address, spender = bob.address), view_allowance.typed.target))
        scenario.verify_equal(view_allowance.data.last, sp.some(1))
        
        scenario.h2("Frozen accounts")
        view_frozenAccounts = Viewer(sp.TBigMap(sp.TAddress, sp.TTimestamp))
        scenario += view_frozenAccounts
        scenario += c1.getFrozenAccounts((sp.unit, view_frozenAccounts.typed.target))
        scenario.verify_equal(view_frozenAccounts.data.last, sp.some(sp.big_map({bob.address:sp.timestamp(20000001)})))
