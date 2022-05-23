//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TimeLock {
    address payable public owner;
    uint public timestamp;
    address[] public ERC20s;

    using SafeERC20 for IERC20;

    modifier onlyOwner {
        require(tx.origin == owner, "Only Owner");
        _;
    }

    modifier unlocked {
        require(block.timestamp > timestamp);
        _;
    }

    constructor(uint _timestamp, address[] memory _erc20s) payable {
        require(_timestamp > block.timestamp);
        owner = payable(tx.origin);

        for(uint i = 0; i < _erc20s.length; i++) {
            addERC20(_erc20s[i]);
        }

        timestamp = _timestamp;
    }

    function withdrawAll() external onlyOwner unlocked {
        address payable _owner = owner; //Saves gas bc of reads
        //_owner.transfer(address(this).balance);
        //Send ERC20s
        for(uint i = 0; i < ERC20s.length; i++) {
            IERC20 token = IERC20(ERC20s[i]);
            
            uint _amount = token.balanceOf(address(this));
            if(_amount > 0 ) {
                token.safeTransfer(_owner, _amount);
            }
        }

        //Is this safe?
        selfdestruct(_owner);
    }

    //Add this function in case ERC20 get stuck
    function withdrawERC20(address[] calldata _contracts) external onlyOwner unlocked {
        address payable _owner = owner; //Saves gas bc of reads
        for(uint i = 0; i < _contracts.length; i++){
            IERC20 token = IERC20(_contracts[i]);
            uint _amount = token.balanceOf(address(this));
            if(_amount > 0 ) {
                token.safeTransfer(_owner, _amount);
            }
        }
    }

    //In theory could add the same token contract twice, but it's more expensive to check that in a for loop every time
    function addERC20(address _address) public onlyOwner {
        //(bool a, bytes memory result) = _address.call(abi.encodeWithSignature("totalSupply()"));
        //require(result[0] != bytes1(0), "NOT AN ERC20");
        ERC20s.push(_address);
    }

    function lock(uint _timestamp) external onlyOwner unlocked {
        timestamp = _timestamp;
    }

    function getERC20() external view returns(address[] memory) {
        return(ERC20s);
    }

    receive() payable external {}
}

contract TimeLockFactory {

    event TimeLockDeployed(address indexed _owner, address indexed _timelockaddress, uint indexed _timestamp);

    function deploy(uint _timestamp, address[] calldata _erc20s) external payable{
        TimeLock tl = new TimeLock(_timestamp, _erc20s);
        
        if(msg.value > 0) {
            payable(tl).transfer(msg.value);
        }

        emit TimeLockDeployed(msg.sender, address(tl), _timestamp);
    }
}