//SPDX-License-Identifier: MIT

pragma solidity <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract m63 is AccessControl {

    address public owner;
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    bytes32 public constant MB_ROLE = keccak256("MB_ROLE");

    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowances;    

    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _totalSupply) {
        owner = msg.sender; 
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        _balances[owner] = _totalSupply;
        totalSupply = _totalSupply;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);        
    }

    function setMinterBurner (address _minter) public {
        _setupRole(MB_ROLE, _minter);
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return _balances[_owner];
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require (_balances[msg.sender] >= _value, "No enough token") ;
        _balances[msg.sender] -= _value;
        _balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_balances[_from] >= _value, "No enough token");
        require(_allowances[_from][_to] >= _value, "Not allowed");
        _balances[_from] -= _value;
        _balances[_to] += _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        _allowances[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return _allowances[_owner][_spender];
    }

    function burn(address _to, uint256 _amount) public returns (bool success) {
//        require(hasRole(MB_ROLE, msg.sender), "Caller is not a burner");        
        require(_balances[_to] >= _amount, "No enough token");
        _balances[_to] -= _amount;
        totalSupply -= _amount;
        emit Transfer(_to, address(0x0), _amount);
        return true;
    }

    function mint(address _to, uint256 _amount) public returns (bool success) {
//        require(hasRole(MB_ROLE, msg.sender), "Caller is not a minter");                
        _balances[_to] += _amount;
        totalSupply += _amount;        
        emit Transfer(address(0x0), _to, _amount);        
        return true;        
    }


    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    modifier isOwner {
        require(msg.sender == owner, "Only owner");
            _;
    }        

}