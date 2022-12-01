// Built by 0xAnon

pragma solidity ^0.4.25;


    contract DisperseReef {

    address public owner;
    
    constructor() public{
        owner=msg.sender;
    }
    
    function disperseReef(address[] recipients, uint256[] values) public payable {
        for (uint256 i = 0; i < recipients.length; i++)
            recipients[i].transfer(values[i]);
        uint256 balance = address(this).balance;
        if (balance > 0)
            msg.sender.transfer(balance);
    }

}
