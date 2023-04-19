// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

contract Campaign is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    // campaign_id
    mapping(uint256 => CampaignInfo) public campaignInfos;
    // task_id -> reward
    mapping(uint256 => uint256) public taskToAmountReward;
    // task_id -> campaign_id
    mapping(uint256 => uint256) public taskToCampaignId;
    // task_id, user address -> claimed
    mapping(uint256 => mapping(address => bool)) public claimedTasks;

    address public chappy_token;
    address public signer;
    address[] public admins;
    uint256 public newCampaignId;
    uint256 public newTaskId;
    uint256 public nonce;

    error InvalidSignature();
    error InsufficentChappy();
    error UnavailableCampaign();
    error TaskNotInCampaign();
    error ClaimedTask();
    error InsufficentFund();
    error Unauthorized();

    struct CampaignInfo {
        address token;
        uint256 amount;
        uint256 minimum_balance;
        uint256 start_at;
        uint256 end_at;
    }

    modifier onlyAdmins() {
        address[] memory _admins = admins;
        bool checked = false;
        for (uint256 idx = 0; idx < _admins.length; ++idx) {
            if (_admins[idx] == msg.sender) {
                checked = true;
            }
        }
        if (checked == false) {
            revert Unauthorized();
        }
        
        _;
    }

    function initialize(
        address _chappy_token,
        address[] memory _admins
    ) external initializer {
        __Ownable_init_unchained();
        __ReentrancyGuard_init_unchained();
        signer = msg.sender;
        admins = _admins;
        chappy_token = _chappy_token;
    }

    function changeAdmins(address[] memory _admins) external onlyOwner {
        admins = _admins;
    }

    function createCampaign(
        address token,
        uint256 minimum_balance,
        uint256 start_at,
        uint256 end_at,
        uint256[] memory rewardEachTask
    ) external onlyAdmins nonReentrant {
        CampaignInfo memory campaignInfo = CampaignInfo(
            token,
            0,
            minimum_balance,
            start_at,
            end_at
        );
        uint256 taskId = newTaskId;
        uint256 campaignId = newCampaignId;
        campaignInfos[campaignId] = campaignInfo;
        for (uint256 idx = 0; idx < rewardEachTask.length; ++idx) {
            taskToAmountReward[taskId] = rewardEachTask[idx];
            taskToCampaignId[taskId] = campaignId;
            ++taskId;
        }
        newTaskId = taskId;
        ++newCampaignId;
    }

    function fundCampaign(
        uint256 campaignId,
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
        uint256 campaignId,
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
        uint256 campaignId,
        uint256[] memory taskIds,
        bytes calldata _signature
    ) external nonReentrant {
        bytes32 _messageHash = getMessageHash(_msgSender());
        if (_verifySignature(_messageHash, _signature) == false) {
            revert InvalidSignature();
        }

        CampaignInfo storage campaign = campaignInfos[campaignId];
        uint256 balance = IERC20Upgradeable(chappy_token).balanceOf(msg.sender);
        if (balance < campaign.minimum_balance) {
            revert InsufficentChappy();
        }
        if (campaign.end_at == 0) {
            if (campaign.start_at > block.timestamp) {
                revert UnavailableCampaign();
            }
        } else {
            if (
                campaign.start_at > block.timestamp ||
                campaign.end_at < block.timestamp
            ) {
                revert UnavailableCampaign();
            }
        }
        uint256 reward = 0;
        for (uint256 idx = 0; idx < taskIds.length; ++idx) {
            uint256 taskId = taskIds[idx];
            if (taskToCampaignId[taskId] != campaignId) {
                revert TaskNotInCampaign();
            }
            if (claimedTasks[taskId][msg.sender] == true) {
                revert ClaimedTask();
            }
            claimedTasks[taskId][msg.sender] = true;
            reward += taskToAmountReward[taskId];
        }
        if (reward > campaign.amount) {
            revert InsufficentFund();
        }
        campaign.amount = campaign.amount - reward;
        IERC20Upgradeable(campaign.token).safeTransfer(
            address(msg.sender),
            reward
        );
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
        bytes memory _signature
    ) public pure returns (address) {
        return ECDSAUpgradeable.recover(_messageHash, _signature);
    }
}
