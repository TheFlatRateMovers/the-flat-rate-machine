// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Flat Rate Movers Genesis Node (FRMNODE)
/// @notice Identity and provenance instrument of The Flat Rate Movers LLC.
/// @dev This contract anchors the company's signed machine-readable estate
///      (datasets, signed index, public API) to a single on-chain record.
///      Exactly one token exists by construction: token #1, the genesis node.
///      The token is an identity and provenance record. It carries no
///      financial rights, no entitlement to payment, and no transfer of
///      ownership in the company or its assets.
contract FlatRateMoversGenesisNode is ERC721, Ownable {
    uint256 public constant GENESIS_TOKEN_ID = 1;

    bool private _genesisMinted;
    string private _genesisURI;

    event GenesisMinted(address indexed to, uint256 indexed tokenId);

    constructor()
        ERC721("Flat Rate Movers Genesis Node", "FRMNODE")
        Ownable(msg.sender)
    {}

    /// @notice Mint the single genesis token (id 1) with its metadata URI.
    /// @dev Callable exactly once, by the contract owner (the company wallet).
    function mintGenesis(address to, string calldata uri) external onlyOwner {
        require(!_genesisMinted, "FRMNODE: genesis already minted");
        _genesisMinted = true;
        _genesisURI = uri;
        _safeMint(to, GENESIS_TOKEN_ID);
        emit GenesisMinted(to, GENESIS_TOKEN_ID);
    }

    /// @notice Whether the genesis token has been minted.
    function genesisMinted() external view returns (bool) {
        return _genesisMinted;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _genesisURI;
    }
}
