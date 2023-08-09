// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./libraries/TransferHelper.sol";

contract Campaign is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    // campaign_id
    mapping(uint24 => CampaignInfo) private campaignInfos;
    // task_id -> reward level
    mapping(uint24 => uint128) private taskToAmountReward;
    // task_id -> campaign_id
    mapping(uint24 => uint24) private taskToCampaignId;
    // task_id, user address -> claimed
    mapping(uint24 => mapping(address => uint8)) private claimedTasks;
    // task_id -> isMultipleClaimed
    mapping(uint24 => uint8) private multipleClaim;
    // address -> boolean
    mapping(address => uint8) private isOperator;

    AggregatorV3Interface internal dataFeed;
    address private chappyToken;
    address private cookieToken;
    address private cutReceiver;
    address[] private admins;
    uint24 private newCampaignId;
    uint24 private newTaskId;
    uint16 private sharePercent; // 10000 = 100%
    uint72 private nonce;

    error InvalidSignature();
    error InsufficentChappy(uint24);
    error InsufficentChappyNFT(uint24);
    error UnavailableCampaign(uint24);
    error TaskNotInCampaign(uint24, uint24);
    error ClaimedTask(uint24);
    error InsufficentFund(uint24);
    error Unauthorized();
    error InvalidTime();
    error InvalidAddress();
    error InvalidNumber();
    error SentZeroNative();
    error SentNativeFailed();
    error NativeNotAllowed();
    error InvalidCampaign(uint24);
    error InvalidEligibility(uint24);
    error InvalidInput();
    error Underflow();
    error InvalidValue();
    error InvalidFee();
    error InvalidTip();
    error InvalidReward(uint24);
    error AlreadyOperators(address);
    error NotOperators(address);
    error InvalidPriceFeed();
    error InvalidPoint();

    event ChangeAdmin(address[]);
    event ChangeToken(address);
    event AddOperator(address);
    event RemoveOperator(address);
    event CreateCampaign(uint24, uint24[]);
    event AddTasks(uint24, uint24[]);
    event ChangeCutReceiver(address);
    event ChangeTreasury(address);
    event ChangeSharePercent(uint16);
    event FundCampaign(uint24, uint256);
    event WithdrawFundCampaign(uint24, uint256);
    event ClaimReward(uint24[][]);
    event ChangeOracle(address);

    struct CampaignInfo {
        address rewardToken;
        address collection;
        address owner;
        uint256 amount;
        uint256 minimumBalance;
        uint32 startAt;
        uint32 endAt;
    }

    struct CampaignInput {
        address rewardToken;
        address collection;
        uint256 minimumBalance;
        uint256 amount;
        uint32 startAt;
        uint32 endAt;
    }

    struct ClaimInput {
        uint24[][] taskIds;
        uint80[] pointForMultiple;
        bytes signature;
        uint8[] isValidUser;
    }

    modifier onlyAdmins() {
        address[] memory memAdmins = admins;
        bool checked = false;
        for (uint16 idx = 0; idx < memAdmins.length; ++idx) {
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

    modifier byOperator() {
        bool checked = false;
        if (isOperator[msg.sender] == 1 || msg.sender == owner()) {
            checked = true;
        }
        if (checked == false) {
            revert Unauthorized();
        }

        _;
    }

    function initialize(
        address operatorAddress,
        address chappyTokenAddress,
        address cookieTokenAddress,
        address cutReceiverAddress,
        address[] memory newAdmins,
        uint16 newSharePercent,
        address chainlinkPriceFeedNativeCoin
    ) external initializer {
        __Ownable_init_unchained();
        __ReentrancyGuard_init_unchained();
        if (newSharePercent > 10000) {
            revert InvalidNumber();
        }
        dataFeed = AggregatorV3Interface(
            chainlinkPriceFeedNativeCoin
        );
        isOperator[operatorAddress] = 1;
        admins = newAdmins;
        chappyToken = chappyTokenAddress;
        cookieToken = cookieTokenAddress;
        sharePercent = newSharePercent;
        cutReceiver = cutReceiverAddress;
    }

    function addOperator(address operatorAddress) external onlyOwner {
        if (isOperator[operatorAddress] == 1) {
            revert AlreadyOperators(operatorAddress);
        }
        isOperator[operatorAddress] = 1;
        emit AddOperator(operatorAddress);
    }

    function removeOperator(address operatorAddress) external onlyOwner {
        if (isOperator[operatorAddress] == 0) {
            revert NotOperators(operatorAddress);
        }
        isOperator[operatorAddress] = 0;
        emit RemoveOperator(operatorAddress);
    }

    function changeAdmins(address[] calldata newAdmins) external byOperator {
        admins = newAdmins;
        emit ChangeAdmin(newAdmins);
    }

    function changeTokenPlatform(address newToken) external byOperator {
        chappyToken = newToken;
        emit ChangeToken(newToken);
    }

    function changeCookieToken(address newToken) external byOperator {
        cookieToken = newToken;
        emit ChangeToken(newToken);
    }

    function createCampaign(
        bytes calldata data
    ) external payable onlyAdmins nonReentrant {
        (CampaignInput memory campaign, uint128[] memory rewardEachTask, uint8[] memory isMultipleClaim) = abi.decode(data, (CampaignInput, uint128[], uint8[]));
        if (rewardEachTask.length != isMultipleClaim.length) {
            revert InvalidInput();
        }
        if (campaign.startAt >= campaign.endAt && campaign.endAt != 0) {
            revert InvalidTime();
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
            campaign.endAt
        );
        uint24 taskId = newTaskId;
        uint24 campaignId = newCampaignId;
        campaignInfos[campaignId] = campaignInfo;
        uint24[] memory taskIds = new uint24[](rewardEachTask.length);
        for (uint24 idx; idx < rewardEachTask.length;) {
            if (rewardEachTask[idx] >= campaign.amount) {
                revert InvalidNumber();
            }
            if (isMultipleClaim[idx] == 1) {
                multipleClaim[taskId] = 1;
            }
            taskToAmountReward[taskId] = rewardEachTask[idx];
            taskToCampaignId[taskId] = campaignId;
            taskIds[idx] = taskId;
            unchecked{ ++taskId; }
            unchecked{ ++idx; }
        }
        newTaskId = taskId;
        ++newCampaignId;
        if (clonedRewardToken == address(0)) {
            if (msg.value != campaign.amount) {
                revert InvalidInput();
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
            TransferHelper.safeTransfer(clonedRewardToken, address(this), actualAmount);
            TransferHelper.safeTransfer(clonedRewardToken, cutReceiver, cutAmount);
            // IERC20Upgradeable(clonedRewardToken).safeTransferFrom(
            //     address(msg.sender),
            //     address(this),
            //     0
            // );
            // IERC20Upgradeable(clonedRewardToken).safeTransferFrom(
            //     address(msg.sender),
            //     cutReceiver,
            //     0
            // );
            // TransferHelper.safeTransfer(clonedRewardToken, address(this), actualAmount);
            // TransferHelper.safeTransfer(clonedRewardToken, cutReceiver, cutAmount);
        }
        emit CreateCampaign(campaignId, taskIds);
    }

    function addTasks(
        bytes calldata data
    ) external onlyAdmins {
        (uint24 campaignId, uint128[] memory rewardEachTask, uint8[] memory isMultipleClaim) = abi.decode(data, (uint24, uint128[], uint8[]));
        if (rewardEachTask.length != isMultipleClaim.length) {
            revert InvalidInput();
        }
        CampaignInfo storage campaign = campaignInfos[campaignId];
        if (campaign.owner != msg.sender) {
            revert Unauthorized();
        }
        uint24 taskId = newTaskId;
        uint24[] memory taskIds = new uint24[](rewardEachTask.length);
        for (uint24 idx; idx < rewardEachTask.length;) {
            if (isMultipleClaim[idx] == 1) {
                multipleClaim[taskId] = 1;
            }
            taskToAmountReward[taskId] = rewardEachTask[idx];
            taskToCampaignId[taskId] = campaignId;
            taskIds[idx] = taskId;
            unchecked{ ++taskId; }
            unchecked{ ++idx; }
        }
        newTaskId = taskId;
        emit AddTasks(campaignId, taskIds);
    }

    function changeCutReceiver(
        address receiver
    ) external byOperator nonReentrant {
        cutReceiver = receiver;
        emit ChangeCutReceiver(receiver);
    }

    function changeSharePercent(
        uint16 newSharePpercent
    ) external byOperator nonReentrant {
        if (newSharePpercent > 10000) {
            revert InvalidNumber();
        }
        sharePercent = newSharePpercent;
        emit ChangeSharePercent(newSharePpercent);
    }

    function fundCampaign(
        uint24 campaignId,
        uint128 amount
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
            (bool sent_cut, bytes memory data2) = payable(cutReceiver).call{
                value: cutAmount
            }("");
            if (sent_cut == false) {
                revert SentNativeFailed();
            }
        } else {
            // if (msg.value != 0 ether) {
            //     revert NativeNotAllowed();
            // }
            uint256 cutAmount = mulDiv(amount, sharePercent, 10000);
            actualAmount = amount - cutAmount;
            campaign.amount = campaign.amount + actualAmount;
            TransferHelper.safeTransfer(campaign.rewardToken, address(this), actualAmount);
            TransferHelper.safeTransfer(campaign.rewardToken, cutReceiver, cutAmount);
            // IERC20Upgradeable(campaign.rewardToken).safeTransferFrom(
            //     address(msg.sender),
            //     address(this),
            //     0
            // );
            // IERC20Upgradeable(campaign.rewardToken).safeTransferFrom(
            //     address(msg.sender),
            //     cutReceiver,
            //     0
            // );
        }
        emit FundCampaign(campaignId, actualAmount);
    }

    function withdrawFundCampaign(
        uint24 campaignId,
        uint128 amount,
        bytes calldata signature
    ) external nonReentrant {
        bytes32 messageHash = getMessageHash(_msgSender());
        if (verifySignature(messageHash, signature) == false) {
            revert InvalidSignature();
        }
        CampaignInfo storage campaign = campaignInfos[campaignId];
        if (amount > campaign.amount) {
            revert InsufficentFund(campaignId);
        }
        campaign.amount = campaign.amount - amount;
        if (campaign.owner != msg.sender) {
                revert Unauthorized();
            }
        if (campaign.rewardToken == address(0)) {
            (bool sent, bytes memory data) = payable(msg.sender).call{
                value: amount
            }("");
            if (sent == false) {
                revert SentNativeFailed();
            }
        } else {
            IERC20Upgradeable(campaign.rewardToken).safeTransfer(
                address(msg.sender),
                amount
            );
        }
        emit WithdrawFundCampaign(campaignId, amount);
    }

    function claimReward(
        // ClaimInput calldata claimInput
        bytes calldata data
    ) external nonReentrant payable {
        (uint24[][] memory taskIds, uint80[] memory pointForMultiple, bytes memory signature) = abi.decode(data, (uint24[][], uint80[], bytes));
        bytes32 messageHash = getMessageHash(_msgSender());
        if (verifySignature(messageHash, signature) == false) {
            revert InvalidSignature();
        }
        uint256[] memory accRewardPerToken = new uint256[](taskIds.length);
        address[] memory addressPerToken = new address[](taskIds.length);
        uint8 count = 0;
        uint8 counter = 0;
        uint8 checkClaimCookie = 0;
        uint256 reward;
        for (uint24 idx; idx < taskIds.length;) {
            uint24[] memory tasksPerCampaign = taskIds[idx];
            uint24 campaignId = taskToCampaignId[tasksPerCampaign[0]];
            CampaignInfo memory campaign = campaignInfos[campaignId];
            if (campaign.rewardToken == cookieToken) {
                checkClaimCookie = 1;
            }
            if (campaign.startAt > block.timestamp) {
                revert UnavailableCampaign(campaignId);
            }
            reward = 0;
            for (uint24 id; id < tasksPerCampaign.length; ++id) {
                uint24 taskId = tasksPerCampaign[id];
                // if (taskToCampaignId[taskId] != campaignId) {
                //     revert TaskNotInCampaign(taskId, campaignId);
                // }
                if (
                    claimedTasks[taskId][msg.sender] == 1 &&
                    multipleClaim[taskId] != 1
                ) {
                    revert ClaimedTask(taskId);
                }
                claimedTasks[taskId][msg.sender] = 1;
                if (multipleClaim[taskId] == 1) {
                    if (pointForMultiple[counter] == 0) {
                        revert InvalidPoint();
                    }
                    reward += (taskToAmountReward[taskId] * pointForMultiple[counter]) / 1e18;
                    ++counter;
                    unchecked{ ++counter; }
                } else {
                    reward += taskToAmountReward[taskId];
                }
                unchecked{ ++id; }
            }
            if (reward > campaign.amount) {
                revert InsufficentFund(campaignId);
            }
            campaignInfos[campaignId].amount = uncheckSubtract(campaign.amount, reward);
            if (count == 0 || addressPerToken[count-1] != campaign.rewardToken) {
                accRewardPerToken[count] = reward;
                addressPerToken[count] = campaign.rewardToken;
                unchecked{ ++count; }
            } else {
                accRewardPerToken[count-1] += reward;
            }
            unchecked{ ++idx; }
        }
        for (uint24 idx = 0; idx < count; ++idx) {
            if (addressPerToken[idx] == address(0)) {
                (bool reward_sent, bytes memory reward_data) = payable(msg.sender).call{
                    value: accRewardPerToken[idx]
                }("");
                if (reward_sent == false) {
                    revert SentNativeFailed();
                }
            } else {
                IERC20Upgradeable(addressPerToken[idx]).safeTransfer(
                    address(msg.sender),
                    accRewardPerToken[idx]
                );
            }
        }
        if (checkClaimCookie == 1) {
            (bool sent, bytes memory data) = payable(cutReceiver).call{
                value: msg.value
            }("");
            if (sent == false) {
                revert SentNativeFailed();
            }
        }
        emit ClaimReward(taskIds);
    }

    function uncheckSubtract(uint a, uint b) pure private returns (uint) {
      // This subtraction will wrap on underflow.
      unchecked { return a - b; }
    }

    function changeOracle(address newDataFeed) external byOperator {
        dataFeed = AggregatorV3Interface(
            newDataFeed
        );
        emit ChangeOracle(newDataFeed);
    }

    function checkOperator(address operator) external view returns (uint8) {
        return isOperator[operator];
    }

    function getCookieAddress() external view returns (address) {
        return cookieToken;
    }

    function getChappyAddress() external view returns (address) {
        return chappyToken;
    }

    function getNonce() external view returns (uint72) {
        return nonce;
    }

    function getCampaignInfo(
        uint24 campaignId
    ) external view returns (CampaignInfo memory) {
        return campaignInfos[campaignId];
    }

    function getTaskInCampaign(uint24 taskId) external view returns (uint24) {
        return taskToCampaignId[taskId];
    }

    function checkClaimedTasks(
        uint24[] calldata taskIds,
        address[] memory users
    ) external view returns (uint24[] memory) {
        if (taskIds.length != users.length) {
            revert InvalidInput();
        }
        uint24[] memory checkIndex = new uint24[](users.length);
        for (uint16 idx; idx < taskIds.length; ++idx) {
            uint24 taskId = taskIds[idx];
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
        bytes memory signature
    ) private returns (bool) {
        ++nonce;
        bytes32 ethSignedMessageHash = ECDSAUpgradeable.toEthSignedMessageHash(
            messageHash
        );
        address signer = getSignerAddress(ethSignedMessageHash, signature);
        return isOperator[signer] == 1;
    }

    function getSignerAddress(
        bytes32 messageHash,
        bytes memory signature
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