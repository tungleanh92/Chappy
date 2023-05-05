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

    address private chappy_token;
    address private signer;
    address private cut_receiver;
    address[] private admins;
    uint80 public newCampaignId;
    uint80 public newTaskId;
    uint72 public nonce;
    uint16 private share_percent; // 10000 = 100%

    error InvalidSignature();
    error InsufficentChappy(uint80);
    error InsufficentChappyNFT(uint80);
    error UnavailableCampaign(uint80);
    error TaskNotInCampaign(uint80, uint80);
    error ClaimedTask(uint80);
    error InsufficentFund(uint80);
    error Unauthorized();
    error InvalidTime();
    error InvalidAddress();
    error InvalidNumber();

    event ChangeAdmin();
    event CreateCampaign();
    event ChangeCutReceiver();
    event ChangeSharePercent();
    event FundCampaign();
    event WithdrawFundCampaign();
    event ClaimReward();

    struct CampaignInfo {
        address token;
        address collection_address;
        address owner;
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
        address[] memory _admins,
        uint16 _share_percent
    ) external initializer {
        __Ownable_init_unchained();
        __ReentrancyGuard_init_unchained();
        if (_share_percent > 10000) {
            revert InvalidNumber();
        }
        signer = msg.sender;
        admins = _admins;
        chappy_token = _chappy_token;
        share_percent = _share_percent;
        cut_receiver = msg.sender;
    }

    function changeAdmins(address[] calldata _admins) external onlyOwner {
        admins = _admins;
        emit ChangeAdmin();
    }

    function createCampaign(
        address token,
        address collection,
        uint256 minimum_balance,
        uint256 amount,
        uint32 start_at,
        uint32 end_at,
        uint8 checkNFT,
        uint256[] calldata rewardEachTask
    ) external onlyAdmins nonReentrant {
        if (start_at >= end_at) {
            revert InvalidTime();
        }
        if (checkNFT == 0 && token == address(0)) {
            revert InvalidAddress();
        } 
        if (checkNFT == 1 && collection == address(0)) {
            revert InvalidAddress();
        }
        address cloned_token = token;
        uint256 cut_amount = mulDiv(amount, share_percent, 10000);
        uint256 actual_amount = amount - cut_amount;
        CampaignInfo memory campaignInfo = CampaignInfo(
            cloned_token,
            collection,
            msg.sender,
            actual_amount,
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
        IERC20Upgradeable(cloned_token).safeTransferFrom(
            address(msg.sender),
            address(this),
            actual_amount
        );
        IERC20Upgradeable(cloned_token).safeTransferFrom(
            address(msg.sender),
            cut_receiver,
            cut_amount
        );
        emit CreateCampaign();
    }

    function changeCutReceiver(
        address receiver
    ) external onlyOwner nonReentrant {
        cut_receiver = receiver;
        emit ChangeCutReceiver();
    }

    function changeSharePercent(
        uint16 _share_percent
    ) external onlyOwner nonReentrant {
        if (_share_percent > 10000) {
            revert InvalidNumber();
        }
        share_percent = _share_percent;
        emit ChangeSharePercent();
    }

    function fundCampaign(
        uint80 campaignId,
        uint256 amount
    ) external nonReentrant {
        CampaignInfo storage campaign = campaignInfos[campaignId];
        if (campaign.owner != msg.sender) {
            revert Unauthorized();
        }
        uint256 cut_amount = mulDiv(amount, share_percent, 10000);
        uint256 actual_amount = amount - cut_amount;
        campaign.amount = campaign.amount + actual_amount;
        IERC20Upgradeable(campaign.token).safeTransferFrom(
            address(msg.sender),
            address(this),
            actual_amount
        );
        IERC20Upgradeable(campaign.token).safeTransferFrom(
            address(msg.sender),
            cut_receiver,
            cut_amount
        );
        emit FundCampaign();
    }

    function withdrawFundCampaign(
        uint80 campaignId,
        uint256 amount,
        bytes calldata _signature
    ) external nonReentrant {
        bytes32 _messageHash = getMessageHash(_msgSender());
        if (_verifySignature(_messageHash, _signature) == false) {
            revert InvalidSignature();
        }
        CampaignInfo storage campaign = campaignInfos[campaignId];
        if (campaign.owner != msg.sender) {
            revert Unauthorized();
        }
        campaign.amount = campaign.amount - amount;
        IERC20Upgradeable(campaign.token).safeTransfer(
            address(msg.sender),
            amount
        );
        emit WithdrawFundCampaign();
    }

    function claimReward(
        uint80[][] calldata taskIds,
        bytes calldata _signature,
        uint8 isValidUser
    ) external nonReentrant {
        bytes32 _messageHash = getMessageHash(_msgSender());
        if (_verifySignature(_messageHash, _signature) == false) {
            revert InvalidSignature();
        }
        for (uint256 idx; idx < taskIds.length; ++idx) {
            uint80[] memory tasksPerCampaign = taskIds[idx];
            uint80 campaignId = taskToCampaignId[tasksPerCampaign[0]];
            CampaignInfo storage campaign = campaignInfos[campaignId];
            if (isValidUser == 0) {
                if (campaign.checkNFT == 1) {
                    uint256 nftBalance = IERC721Upgradeable(
                        campaign.collection_address
                    ).balanceOf(msg.sender);
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
        emit ClaimReward();
    }

    function getMessageHash(address _user) private view returns (bytes32) {
        return keccak256(abi.encodePacked(nonce, _user));
    }

    function _verifySignature(
        bytes32 _messageHash,
        bytes calldata signature
    ) private returns (bool) {
        ++nonce;
        bytes32 ethSignedMessageHash = ECDSAUpgradeable.toEthSignedMessageHash(
            _messageHash
        );
        return getSignerAddress(ethSignedMessageHash, signature) == signer;
    }

    function getSignerAddress(
        bytes32 _messageHash,
        bytes calldata _signature
    ) private pure returns (address) {
        return ECDSAUpgradeable.recover(_messageHash, _signature);
    }

    /**
     * @notice Calculates floor(x * y / denominator) with full precision. Throws if result overflows a uint256 or denominator == 0
     * @dev Original credit to Remco Bloemen under MIT license (https://xn--2-umb.com/21/muldiv)
     * with further edits by Uniswap Labs also under MIT license.
     */
    function mulDiv(
        uint256 x,
        uint256 y,
        uint256 denominator
    ) internal pure returns (uint256 result) {
        unchecked {
            // 512-bit multiply [prod1 prod0] = x * y. Compute the product mod 2^256 and mod 2^256 - 1, then use
            // use the Chinese Remainder Theorem to reconstruct the 512 bit result. The result is stored in two 256
            // variables such that product = prod1 * 2^256 + prod0.
            uint256 prod0; // Least significant 256 bits of the product
            uint256 prod1; // Most significant 256 bits of the product
            assembly {
                let mm := mulmod(x, y, not(0))
                prod0 := mul(x, y)
                prod1 := sub(sub(mm, prod0), lt(mm, prod0))
            }

            // Handle non-overflow cases, 256 by 256 division.
            if (prod1 == 0) {
                return prod0 / denominator;
            }

            // Make sure the result is less than 2^256. Also prevents denominator == 0.
            require(denominator > prod1);

            ///////////////////////////////////////////////
            // 512 by 256 division.
            ///////////////////////////////////////////////

            // Make division exact by subtracting the remainder from [prod1 prod0].
            uint256 remainder;
            assembly {
                // Compute remainder using mulmod.
                remainder := mulmod(x, y, denominator)

                // Subtract 256 bit number from 512 bit number.
                prod1 := sub(prod1, gt(remainder, prod0))
                prod0 := sub(prod0, remainder)
            }

            // Factor powers of two out of denominator and compute largest power of two divisor of denominator. Always >= 1.
            // See https://cs.stackexchange.com/q/138556/92363.

            // Does not overflow because the denominator cannot be zero at this stage in the function.
            uint256 twos = denominator & (~denominator + 1);
            assembly {
                // Divide denominator by twos.
                denominator := div(denominator, twos)

                // Divide [prod1 prod0] by twos.
                prod0 := div(prod0, twos)

                // Flip twos such that it is 2^256 / twos. If twos is zero, then it becomes one.
                twos := add(div(sub(0, twos), twos), 1)
            }

            // Shift in bits from prod1 into prod0.
            prod0 |= prod1 * twos;

            // Invert denominator mod 2^256. Now that denominator is an odd number, it has an inverse modulo 2^256 such
            // that denominator * inv = 1 mod 2^256. Compute the inverse by starting with a seed that is correct for
            // four bits. That is, denominator * inv = 1 mod 2^4.
            uint256 inverse = (3 * denominator) ^ 2;

            // Use the Newton-Raphson iteration to improve the precision. Thanks to Hensel's lifting lemma, this also works
            // in modular arithmetic, doubling the correct bits in each step.
            inverse *= 2 - denominator * inverse; // inverse mod 2^8
            inverse *= 2 - denominator * inverse; // inverse mod 2^16
            inverse *= 2 - denominator * inverse; // inverse mod 2^32
            inverse *= 2 - denominator * inverse; // inverse mod 2^64
            inverse *= 2 - denominator * inverse; // inverse mod 2^128
            inverse *= 2 - denominator * inverse; // inverse mod 2^256

            // Because the division is now exact we can divide by multiplying with the modular inverse of denominator.
            // This will give us the correct result modulo 2^256. Since the preconditions guarantee that the outcome is
            // less than 2^256, this is the final result. We don't need to compute the high bits of the result and prod1
            // is no longer required.
            result = prod0 * inverse;
            return result;
        }
    }
}
