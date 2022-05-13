//SPDX-License-Identifier: MIT

pragma solidity <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../contracts/m63.sol";

contract bridgeERC is AccessControl {

    address public owner;
    address public validator;
    mapping (uint256 => bool) private _chainID;
    mapping (string => TokenDetail) private _token; 

    mapping(address => uint256) private _transferNonces;
    mapping(address => mapping(uint256 => bool)) private _finishedNonces;


    struct TokenDetail {
        address tokenAddr;        
        bool exist;
    }

    constructor(address _validator) {
        owner = msg.sender;
        validator = _validator;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);        
    }

    //- Функция swap(): списывает токены с пользователя и отправляет event ‘swapInitialized’
    function swap(string memory _symbol, uint256 _id, uint256 _amount, address _recipient) public returns (bool) {
        require(_token[_symbol].exist, "Unsupported token");// todo проверка на валидность токена
        require(_chainID[_id], "Unsupported chain ID");   
        require(m63(_token[_symbol].tokenAddr).balanceOf(msg.sender) > _amount, "Not enough tokens");
        m63(_token[_symbol].tokenAddr).burn(msg.sender, _amount);
        _transferNonces[_recipient]++;
        emit swapInitialized(_symbol, _id, _amount, _recipient, _transferNonces[_recipient]);
    }
    //- Функция redeem(): вызывает функцию ecrecover и восстанавливает по хэшированному сообщению и сигнатуре адрес валидатора, 
    //если адрес совпадает с адресом указанным на контракте моста то пользователю отправляются токены
    function redeem(string memory _symbol, uint256 _id, uint256 _amount, address _recipient, uint256 _nonce, uint8 v, bytes32 r, bytes32 s) public returns (bool) {
        require(_finishedNonces[_recipient][_nonce] == false,"Tranfer already processed");
        require(_token[_symbol].exist, "Unsupported token");
        require(_chainID[_id], "Unsupported chain ID");
        require(checkSign(_recipient, _amount, _symbol, _nonce, v, r, s), "Wrong signature");
        _finishedNonces[_recipient][_nonce] = true;        
        m63(_token[_symbol].tokenAddr).mint(_recipient, _amount);
    }


    function checkSign(address _addr, uint256 _amount,string memory _symbol, uint256 _nonce, uint8 v, bytes32 r, bytes32 s ) public view returns (bool) {
        bytes32 message = keccak256(abi.encodePacked(_addr, _amount, _symbol, _nonce));
        address addr = ecrecover(hashMessage(message), v, r, s);
        if (addr == validator) {
            return true;
        } else {
            return false;
        }
    }

   function hashMessage(bytes32 message) private pure returns (bytes32) {
           bytes memory prefix = "\x19Ethereum Signed Message:\n32";
           return keccak256(abi.encodePacked(prefix, message));
   }

    //- Функция updateChainById(): добавить блокчейн или удалить по его chainID
    function updateChainById(uint256 _id, bool _enabled) public returns (bool) {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not a owner");
        _chainID[_id] = _enabled;
    }
    //- Функция includeToken(): добавить токен для передачи его в другую сеть
    function includeToken(string memory _symbol, address _tokenAddr) public returns (bool) {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not a owner");        
        _token[_symbol].tokenAddr = _tokenAddr;        
        _token[_symbol].exist = true;
    }
    //- Функция excludeToken(): исключить токен для передачи
    function excludeToken(string memory _symbol) public returns (bool) {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not a owner");        
        _token[_symbol].exist = false;

    }    

    event swapInitialized(string _symbol, uint256 _id, uint256 _amount, address _recipient, uint256 _nonce);    

}