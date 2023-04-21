// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

contract Campaign is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    // campaign_id
    mapping(uint80 => CampaignInfo) public campaignInfos;
    // task_id -> reward
    mapping(uint80 => uint256) public taskToAmountReward;
    // task_id -> campaign_id
    mapping(uint80 => uint80) public taskToCampaignId;
    // task_id, user address -> claimed
    mapping(uint80 => mapping(address => uint8)) public claimedTasks;

    address public chappy_token;
    address public chappy_collection;
    address public signer;
    address[] public admins;
    uint80 public newCampaignId;
    uint80 public newTaskId;
    uint80 public nonce;

    error InvalidSignature();
    error InsufficentChappy(uint80);
    error InsufficentChappyNFT(uint80);
    error UnavailableCampaign(uint80);
    error TaskNotInCampaign(uint80, uint80);
    error ClaimedTask(uint80);
    error InsufficentFund(uint80);
    error Unauthorized();

    struct CampaignInfo {
        address token;
        uint256 amount;
        uint256 minimum_balance;
        uint32 start_at;
        uint32 end_at;
        uint8 checkNFT;
    }

    modifier onlyAdmins() {
        address[] memory _admins = admins;
        bool checked = false;
        for (uint256 idx = 0; idx < _admins.length; ++idx) {
            if (_admins[idx] == msg.sender) {
                checked = true;
                break;
            }
        }
        if (checked == false) {
            revert Unauthorized();
        }

        _;
    }

    function initialize(
        address _chappy_token,
        address _chappy_collection,
        address[] memory _admins
    ) external initializer {
        __Ownable_init_unchained();
        __ReentrancyGuard_init_unchained();
        signer = msg.sender;
        admins = _admins;
        chappy_token = _chappy_token;
        chappy_collection = _chappy_collection;
    }

    function changeAdmins(address[] calldata _admins) external onlyOwner {
        admins = _admins;
    }

    function createCampaign(
        address token,
        uint256 minimum_balance,
        uint32 start_at,
        uint32 end_at,
        uint8 checkNFT,
        uint256[] calldata rewardEachTask
    ) external onlyAdmins nonReentrant {
        CampaignInfo memory campaignInfo = CampaignInfo(
            token,
            0,
            minimum_balance,
            start_at,
            end_at,
            checkNFT
        );
        uint80 taskId = newTaskId;
        uint80 campaignId = newCampaignId;
        campaignInfos[campaignId] = campaignInfo;
        for (uint80 idx; idx < rewardEachTask.length; ++idx) {
            taskToAmountReward[taskId] = rewardEachTask[idx];
            taskToCampaignId[taskId] = campaignId;
            ++taskId;
        }
        newTaskId = taskId;
        ++newCampaignId;
    }

    function fundCampaign(
        uint80 campaignId,
        uint256 amount
    ) external onlyOwner nonReentrant {
        CampaignInfo storage campaign = campaignInfos[campaignId];
        campaign.amount = campaign.amount + amount;
        IERC20Upgradeable(campaign.token).safeTransferFrom(
            address(msg.sender),
            address(this),
            amount
        );
    }

    function withdrawFundCampaign(
        uint80 campaignId,
        uint256 amount,
        bytes calldata _signature
    ) external onlyOwner nonReentrant {
        bytes32 _messageHash = getMessageHash(_msgSender());
        if (_verifySignature(_messageHash, _signature) == false) {
            revert InvalidSignature();
        }
        CampaignInfo storage campaign = campaignInfos[campaignId];
        campaign.amount = campaign.amount - amount;
        IERC20Upgradeable(campaign.token).safeTransfer(
            address(msg.sender),
            amount
        );
    }

    function claimReward(
        uint80[][] calldata taskIds,
        bytes calldata _signature
    ) external nonReentrant {
        bytes32 _messageHash = getMessageHash(_msgSender());
        if (_verifySignature(_messageHash, _signature) == false) {
            revert InvalidSignature();
        }
        for (uint256 idx; idx < taskIds.length; ++idx) {
            uint80[] memory tasksPerCampaign = taskIds[idx];
            uint80 campaignId = taskToCampaignId[tasksPerCampaign[0]];
            CampaignInfo storage campaign = campaignInfos[campaignId];
            if (campaign.checkNFT == 1) {
                uint256 nftBalance = IERC721Upgradeable(chappy_collection)
                    .balanceOf(msg.sender);
                if (nftBalance == 0) {
                    revert InsufficentChappyNFT(campaignId);
                }
            } else {
                uint256 balance = IERC20Upgradeable(chappy_token).balanceOf(
                    msg.sender
                );
                if (balance < campaign.minimum_balance) {
                    revert InsufficentChappy(campaignId);
                }
            }
            if (campaign.end_at == 0) {
                if (campaign.start_at > block.timestamp) {
                    revert UnavailableCampaign(campaignId);
                }
            } else {
                if (
                    campaign.start_at > block.timestamp ||
                    campaign.end_at < block.timestamp
                ) {
                    revert UnavailableCampaign(campaignId);
                }
            }
            uint256 reward;
            for (uint80 id; id < tasksPerCampaign.length; ++id) {
                uint80 taskId = tasksPerCampaign[id];
                if (taskToCampaignId[taskId] != campaignId) {
                    revert TaskNotInCampaign(taskId, campaignId);
                }
                if (claimedTasks[taskId][msg.sender] == 1) {
                    revert ClaimedTask(taskId);
                }
                claimedTasks[taskId][msg.sender] = 1;
                reward += taskToAmountReward[taskId];
            }
            if (reward > campaign.amount) {
                revert InsufficentFund(campaignId);
            }
            campaign.amount = campaign.amount - reward;
            IERC20Upgradeable(campaign.token).safeTransfer(
                address(msg.sender),
                reward
            );
        }
    }

    function getMessageHash(address _user) public view returns (bytes32) {
        return keccak256(abi.encodePacked(nonce, _user));
    }

    function _verifySignature(
        bytes32 _messageHash,
        bytes calldata signature
    ) public returns (bool) {
        ++nonce;
        bytes32 ethSignedMessageHash = ECDSAUpgradeable.toEthSignedMessageHash(
            _messageHash
        );
        return getSignerAddress(ethSignedMessageHash, signature) == signer;
    }

    function getSignerAddress(
        bytes32 _messageHash,
        bytes calldata _signature
    ) public pure returns (address) {
        return ECDSAUpgradeable.recover(_messageHash, _signature);
    }
}
