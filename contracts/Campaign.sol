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
    mapping(uint80 => CampaignInfo) private campaignInfos;
    // task_id -> reward
    mapping(uint80 => uint256[]) private taskToAmountReward;
    // task_id -> campaign_id
    mapping(uint80 => uint80) private taskToCampaignId;
    // task_id, user address -> claimed
    mapping(uint80 => mapping(address => uint8)) private claimedTasks;
    // task_id -> isMultipleClaimed
    mapping(uint80 => uint8) private multipleClaim;

    address private chappyToken;
    address private signer;
    address private cutReceiver;
    address private treasury;
    address[] private admins;
    uint80 private newCampaignId;
    uint80 private newTaskId;
    uint72 private nonce;
    uint16 private sharePercent; // 10000 = 100%

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
    error SentZeroNative();
    error SentNativeFailed();
    error NativeNotAllowed();
    error InvalidCampaign(uint80);
    error InvalidEligibility(uint80);
    error InvalidInput();
    error Underflow();
    error InvalidValue();

    event ChangeAdmin(address[]);
    event ChangeToken(address);
    event CreateCampaign(uint80, uint80[]);
    event AddTasks(uint80, uint80[]);
    event ChangeCutReceiver(address);
    event ChangeTreasury(address);
    event ChangeSharePercent(uint16);
    event FundCampaign(uint80, uint256);
    event WithdrawFundCampaign(uint80, uint256);
    event ClaimReward(uint80[][]);

    struct CampaignInfo {
        address rewardToken;
        address collection;
        address owner;
        uint256 amount;
        uint256 minimumBalance;
        uint32 startAt;
        uint32 endAt;
        uint8 checkNFT;
    }

    struct CampaignInput {
        address rewardToken;
        address collection;
        uint256 minimumBalance;
        uint256 amount;
        uint32 startAt;
        uint32 endAt;
        uint8 checkNFT;
    }

    modifier onlyAdmins() {
        address[] memory memAdmins = admins;
        bool checked = false;
        for (uint256 idx = 0; idx < memAdmins.length; ++idx) {
            if (memAdmins[idx] == msg.sender) {
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
        address chappyTokenAddress,
        address treasuryAddress,
        address cutReceiverAddress,
        address[] memory newAdmins,
        uint16 newSharePercent
    ) external initializer {
        __Ownable_init_unchained();
        __ReentrancyGuard_init_unchained();
        if (newSharePercent > 10000) {
            revert InvalidNumber();
        }
        signer = msg.sender;
        admins = newAdmins;
        treasury = treasuryAddress;
        chappyToken = chappyTokenAddress;
        sharePercent = newSharePercent;
        cutReceiver = cutReceiverAddress;
    }

    function changeAdmins(address[] calldata newAdmins) external onlyOwner {
        admins = newAdmins;
        emit ChangeAdmin(newAdmins);
    }

    function changeTokenPlatform(address newToken) external onlyOwner {
        chappyToken = newToken;
        emit ChangeToken(newToken);
    }

    function createCampaign(
        CampaignInput calldata campaign,
        uint256[][] calldata rewardEachTask,
        uint8[] calldata isMultipleClaim
    ) external payable onlyAdmins nonReentrant {
        if (rewardEachTask.length != isMultipleClaim.length) {
            revert InvalidInput();
        }
        if (campaign.startAt >= campaign.endAt && campaign.endAt != 0) {
            revert InvalidTime();
        }
        if (campaign.collection == address(0)) {
            if (campaign.checkNFT == 1 || campaign.checkNFT == 2) {
                revert InvalidAddress();
            }
        }
        if (campaign.checkNFT > 2) {
            revert InvalidValue();
        }
        if (
            campaign.rewardToken == address(0) && msg.value != campaign.amount
        ) {
            revert InvalidValue();
        }
        if (campaign.rewardToken != address(0) && msg.value != 0) {
            revert InvalidValue();
        }
        address clonedRewardToken = campaign.rewardToken;
        uint256 cutAmount = 0;
        uint256 actualAmount = 0;
        if (campaign.rewardToken != address(0)) {
            cutAmount = mulDiv(campaign.amount, sharePercent, 10000);
            actualAmount = campaign.amount - cutAmount;
        } else {
            cutAmount = mulDiv(msg.value, sharePercent, 10000);
            actualAmount = msg.value - cutAmount;
        }
        CampaignInfo memory campaignInfo = CampaignInfo(
            clonedRewardToken,
            campaign.collection,
            msg.sender,
            actualAmount,
            campaign.minimumBalance,
            campaign.startAt,
            campaign.endAt,
            campaign.checkNFT
        );
        uint80 taskId = newTaskId;
        uint80 campaignId = newCampaignId;
        campaignInfos[campaignId] = campaignInfo;
        uint80[] memory taskIds = new uint80[](rewardEachTask.length);
        for (uint80 idx; idx < rewardEachTask.length; ++idx) {
            if (rewardEachTask[idx][0] >= campaign.amount) {
                revert InvalidNumber();
            }
            if (isMultipleClaim[idx] == 1) {
                multipleClaim[taskId] = 1;
            }
            taskToAmountReward[taskId] = rewardEachTask[idx];
            taskToCampaignId[taskId] = campaignId;
            taskIds[idx] = taskId;
            ++taskId;
        }
        newTaskId = taskId;
        ++newCampaignId;
        if (clonedRewardToken == address(0)) {
            if (msg.value != campaign.amount) {
                revert InvalidInput();
            }
            (bool sent_treasury, bytes memory data1) = payable(treasury).call{
                value: actualAmount
            }("");
            if (sent_treasury == false) {
                revert SentNativeFailed();
            }
            (bool sent_cut, bytes memory data2) = payable(cutReceiver).call{
                value: cutAmount
            }("");
            if (sent_cut == false) {
                revert SentNativeFailed();
            }
        } else {
            if (msg.value != 0 ether) {
                revert NativeNotAllowed();
            }
            IERC20Upgradeable(clonedRewardToken).safeTransferFrom(
                address(msg.sender),
                address(this),
                actualAmount
            );
            IERC20Upgradeable(clonedRewardToken).safeTransferFrom(
                address(msg.sender),
                cutReceiver,
                cutAmount
            );
        }
        emit CreateCampaign(campaignId, taskIds);
    }

    function addTasks(
        uint80 campaignId, 
        uint256[][] calldata rewardEachTask, 
        uint8[] calldata isMultipleClaim
    ) external onlyAdmins {
        if (rewardEachTask.length != isMultipleClaim.length) {
            revert InvalidInput();
        }
        CampaignInfo storage campaign = campaignInfos[campaignId];
        if (campaign.owner != msg.sender) {
            revert Unauthorized();
        }
        uint80 taskId = newTaskId;
        uint80[] memory taskIds = new uint80[](rewardEachTask.length);
        for (uint80 idx; idx < rewardEachTask.length; ++idx) {
            if (isMultipleClaim[idx] == 1) {
                multipleClaim[taskId] = 1;
            }
            taskToAmountReward[taskId] = rewardEachTask[idx];
            taskToCampaignId[taskId] = campaignId;
            taskIds[idx] = taskId;
            ++taskId;
        }
        newTaskId = taskId;
        emit AddTasks(campaignId, taskIds);
    }

    function changeCutReceiver(
        address receiver
    ) external onlyOwner nonReentrant {
        cutReceiver = receiver;
        emit ChangeCutReceiver(receiver);
    }

    function changeTreasury(
        address treasuryAddress
    ) external onlyOwner nonReentrant {
        treasury = treasuryAddress;
        emit ChangeTreasury(treasuryAddress);
    }

    function changeSharePercent(
        uint16 newSharePpercent
    ) external onlyOwner nonReentrant {
        if (newSharePpercent > 10000) {
            revert InvalidNumber();
        }
        sharePercent = newSharePpercent;
        emit ChangeSharePercent(newSharePpercent);
    }

    function fundCampaign(
        uint80 campaignId,
        uint256 amount
    ) external payable nonReentrant {
        CampaignInfo storage campaign = campaignInfos[campaignId];
        if (campaign.owner != msg.sender) {
            revert Unauthorized();
        }
        if (campaign.rewardToken == address(0) && msg.value != amount) {
            revert InvalidValue();
        }
        if (campaign.rewardToken != address(0) && msg.value != 0) {
            revert InvalidValue();
        }
        uint256 actualAmount = 0;
        if (campaign.rewardToken == address(0)) {
            if (msg.value != amount) {
                revert InvalidInput();
            }
            uint256 cutAmount = mulDiv(msg.value, sharePercent, 10000);
            actualAmount = msg.value - cutAmount;
            campaign.amount = campaign.amount + actualAmount;
            (bool sent_treasury, bytes memory data1) = payable(treasury).call{
                value: actualAmount
            }("");
            if (sent_treasury == false) {
                revert SentNativeFailed();
            }
            (bool sent_cut, bytes memory data2) = payable(cutReceiver).call{
                value: cutAmount
            }("");
            if (sent_cut == false) {
                revert SentNativeFailed();
            }
        } else {
            if (msg.value != 0 ether) {
                revert NativeNotAllowed();
            }
            uint256 cutAmount = mulDiv(amount, sharePercent, 10000);
            actualAmount = amount - cutAmount;
            campaign.amount = campaign.amount + actualAmount;
            IERC20Upgradeable(campaign.rewardToken).safeTransferFrom(
                address(msg.sender),
                address(this),
                actualAmount
            );
            IERC20Upgradeable(campaign.rewardToken).safeTransferFrom(
                address(msg.sender),
                cutReceiver,
                cutAmount
            );
        }
        emit FundCampaign(campaignId, actualAmount);
    }

    function withdrawFundCampaign(
        uint80 campaignId,
        uint256 amount,
        bytes calldata signature
    ) external payable nonReentrant {
        bytes32 messageHash = getMessageHash(_msgSender());
        if (verifySignature(messageHash, signature) == false) {
            revert InvalidSignature();
        }
        CampaignInfo storage campaign = campaignInfos[campaignId];
        if (amount > campaign.amount) {
            revert InsufficentFund(campaignId);
        }
        campaign.amount = campaign.amount - amount;
        if (campaign.rewardToken == address(0)) {
            // treasury address make tx to let admin "withdraw"
            if (msg.sender != treasury) {
                revert Unauthorized();
            }
            (bool sent, bytes memory data) = payable(campaign.owner).call{
                value: msg.value
            }("");
            if (sent == false) {
                revert SentNativeFailed();
            }
        } else {
            // admin make tx
            if (campaign.owner != msg.sender) {
                revert Unauthorized();
            }
            IERC20Upgradeable(campaign.rewardToken).safeTransfer(
                address(msg.sender),
                amount
            );
        }
        emit WithdrawFundCampaign(campaignId, amount);
    }

    function claimReward(
        uint80[][] calldata taskIds,
        bytes calldata signature,
        uint8[] memory isValidUser,
        uint8[][] calldata rewardLevel
    ) external nonReentrant {
        bytes32 messageHash = getMessageHash(_msgSender());
        if (verifySignature(messageHash, signature) == false) {
            revert InvalidSignature();
        }
        if (taskIds.length != isValidUser.length) {
            revert InvalidInput();
        }
        uint256 reward;
        for (uint256 idx; idx < taskIds.length; ++idx) {
            uint80[] memory tasksPerCampaign = taskIds[idx];
            uint80 campaignId = taskToCampaignId[tasksPerCampaign[0]];
            CampaignInfo storage campaign = campaignInfos[campaignId];
            if (campaign.rewardToken == address(0)) {
                revert InvalidCampaign(campaignId);
            }
            if (isValidUser[idx] == 0) {
                uint256 nftBalance;
                uint256 balance = IERC20Upgradeable(chappyToken).balanceOf(
                    msg.sender
                );
                uint256 check = 0;
                if (campaign.checkNFT == 2) {
                    nftBalance = IERC721Upgradeable(campaign.collection)
                        .balanceOf(msg.sender);
                    if (nftBalance > 0 || balance > 0) {
                        check += 1;
                    }
                    if (check == 0) {
                        revert InvalidEligibility(campaignId);
                    }
                }
                if (campaign.checkNFT == 1) {
                    nftBalance = IERC721Upgradeable(campaign.collection)
                        .balanceOf(msg.sender);
                    if (nftBalance == 0) {
                        revert InsufficentChappyNFT(campaignId);
                    }
                } else {
                    if (balance < campaign.minimumBalance) {
                        revert InsufficentChappy(campaignId);
                    }
                }
            }
            if (campaign.startAt > block.timestamp) {
                revert UnavailableCampaign(campaignId);
            }
            reward = 0;
            for (uint80 id; id < tasksPerCampaign.length; ++id) {
                uint80 taskId = tasksPerCampaign[id];
                if (taskToCampaignId[taskId] != campaignId) {
                    revert TaskNotInCampaign(taskId, campaignId);
                }
                if (
                    claimedTasks[taskId][msg.sender] == 1 &&
                    multipleClaim[taskId] != 1
                ) {
                    revert ClaimedTask(taskId);
                }
                claimedTasks[taskId][msg.sender] = 1;
                reward += taskToAmountReward[taskId][rewardLevel[idx][id]];
            }
            if (reward > campaign.amount) {
                revert InsufficentFund(campaignId);
            }
            campaign.amount = campaign.amount - reward;
            IERC20Upgradeable(campaign.rewardToken).safeTransfer(
                address(msg.sender),
                reward
            );
        }
        emit ClaimReward(taskIds);
    }

    function claimRewardFromTreasury(
        uint80[][] calldata taskIds,
        bytes calldata signature,
        address user,
        uint8[] memory isValidUser,
        uint8[][] calldata rewardLevel
    ) external payable nonReentrant {
        bytes32 messageHash = getMessageHash(_msgSender());
        if (verifySignature(messageHash, signature) == false) {
            revert InvalidSignature();
        }
        if (msg.sender != treasury) {
            revert Unauthorized();
        }
        if (msg.value == 0 ether) {
            revert SentZeroNative();
        }
        if (taskIds.length != isValidUser.length) {
            revert InvalidInput();
        }
        uint256 reward;
        for (uint256 idx; idx < taskIds.length; ++idx) {
            uint80[] memory tasksPerCampaign = taskIds[idx];
            uint80 campaignId = taskToCampaignId[tasksPerCampaign[0]];
            CampaignInfo storage campaign = campaignInfos[campaignId];
            if (isValidUser[idx] == 0) {
                uint256 nftBalance;
                uint256 balance = IERC20Upgradeable(chappyToken).balanceOf(
                    msg.sender
                );
                uint256 check = 0;
                if (campaign.checkNFT == 2) {
                    nftBalance = IERC721Upgradeable(campaign.collection)
                        .balanceOf(msg.sender);
                    if (nftBalance > 0 || balance > 0) {
                        check += 1;
                    }
                    if (check == 0) {
                        revert InvalidEligibility(campaignId);
                    }
                }
                if (campaign.checkNFT == 1) {
                    nftBalance = IERC721Upgradeable(campaign.collection)
                        .balanceOf(msg.sender);
                    if (nftBalance == 0) {
                        revert InsufficentChappyNFT(campaignId);
                    }
                } else {
                    if (balance < campaign.minimumBalance) {
                        revert InsufficentChappy(campaignId);
                    }
                }
            }
            if (campaign.startAt > block.timestamp) {
                revert UnavailableCampaign(campaignId);
            }
            reward = 0;
            for (uint80 id; id < tasksPerCampaign.length; ++id) {
                uint80 taskId = tasksPerCampaign[id];
                if (taskToCampaignId[taskId] != campaignId) {
                    revert TaskNotInCampaign(taskId, campaignId);
                }
                if (
                    claimedTasks[taskId][user] == 1 &&
                    multipleClaim[taskId] != 1
                ) {
                    revert ClaimedTask(taskId);
                }
                claimedTasks[taskId][user] = 1;
                reward += taskToAmountReward[taskId][rewardLevel[idx][id]];
            }
            if (campaign.amount < reward) {
                revert Underflow();
            }
            campaign.amount = campaign.amount - reward;
        }
        if (msg.value == 0 ether) {
            revert SentZeroNative();
        }
        (bool sent, bytes memory data) = payable(user).call{value: msg.value}(
            ""
        );
        if (sent == false) {
            revert SentNativeFailed();
        }
        emit ClaimReward(taskIds);
    }

    function getNonce() external view returns (uint72) {
        return nonce;
    }

    function getCampaignInfo(
        uint80 campaignId
    ) external view returns (CampaignInfo memory) {
        return campaignInfos[campaignId];
    }

    function getTaskInCampaign(uint80 taskId) external view returns (uint80) {
        return taskToCampaignId[taskId];
    }

    function checkClaimedTasks(
        uint80[] calldata taskIds,
        address[] memory users
    ) external view returns (uint80[] memory) {
        if (taskIds.length != users.length) {
            revert InvalidInput();
        }
        uint80[] memory checkIndex = new uint80[](users.length);
        for (uint256 idx; idx < taskIds.length; ++idx) {
            uint80 taskId = taskIds[idx];
            if (claimedTasks[taskId][users[idx]] == 1) {
                checkIndex[idx] = 1;
            } else {
                checkIndex[idx] = 0;
            }
        }
        return checkIndex;
    }

    function getMessageHash(address user) private view returns (bytes32) {
        return keccak256(abi.encodePacked(nonce, user));
    }

    function verifySignature(
        bytes32 messageHash,
        bytes calldata signature
    ) private returns (bool) {
        ++nonce;
        bytes32 ethSignedMessageHash = ECDSAUpgradeable.toEthSignedMessageHash(
            messageHash
        );
        return getSignerAddress(ethSignedMessageHash, signature) == signer;
    }

    function getSignerAddress(
        bytes32 messageHash,
        bytes calldata signature
    ) private pure returns (address) {
        return ECDSAUpgradeable.recover(messageHash, signature);
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
