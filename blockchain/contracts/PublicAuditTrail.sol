// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Complete Justice System - Gas Optimized
 * @dev All system data stored on-chain with minimal gas costs
 */
contract CompleteJusticeSystem {
    
    // ============ OPTIMIZED STORAGE STRUCTS ============
    
    struct PackedUser {
        uint8 role;        // 1=Public,2=Investigator,3=Forensic,4=Court,5=Admin
        uint8 status;      // 0=Inactive,1=Active,2=Suspended,3=Verified
        uint40 createdAt;
        bytes32 emailHash;
        bytes32 ipfsCid;
    }
    
    struct PackedFIR {
        uint8 status;      // 0=Draft,1=Submitted,2=UnderReview,3=Accepted,4=Rejected,5=Closed
        uint40 filedAt;
        uint40 updatedAt;
        address complainant;
        address assignedInvestigator;
        bytes32 caseId;
        bytes32 ipfsCid;
    }
    
    struct PackedEvidence {
        uint8 evidenceType;
        uint8 status;
        uint32 collectedAt;
        uint32 verifiedAt;
        address collectedBy;
        address verifiedBy;
        bytes32 caseId;
        bytes32 hash;
        bytes32 ipfsCid;
    }
    
    struct PackedForensicReport {
        uint8 status;
        uint8 analysisType;
        uint40 submittedAt;
        uint40 completedAt;
        address analyst;
        bytes32 evidenceId;
        bytes32 caseId;
        bytes32 findingsHash;
        bytes32 ipfsCid;
    }
    
    struct PackedHearing {
        uint8 status;
        uint8 hearingType;
        uint32 scheduledAt;
        uint32 startedAt;
        uint32 endedAt;
        address judge;
        bytes32 caseId;
        bytes32 meetingLink;
        bytes32 notesHash;
    }
    
    struct PackedJudgment {
        uint8 verdict;
        uint32 deliveredAt;
        address judge;
        bytes32 caseId;
        bytes32 sentenceHash;
        bytes32 ipfsCid;
    }
    
    struct CaseTimeline {
        uint40 firFiledAt;
        uint40 investigatorAssignedAt;
        uint40 investigationCompletedAt;
        uint40 forensicSubmittedAt;
        uint40 courtSubmittedAt;
        uint40 judgmentDate;
        uint8 currentStage;
        bool isAppealed;
        bool isClosed;
    }
    
    struct PackedAppeal {
        uint8 status;
        uint40 filedAt;
        uint40 decidedAt;
        address appellant;
        address decidedBy;
        bytes32 caseId;
        bytes32 groundsHash;
        bytes32 decisionHash;
    }
    
    struct Escrow {
        uint128 amount;
        bool released;
        address depositor;
        address beneficiary;
        bytes32 caseId;
    }
    
    struct PackedFeedback {
        uint8 category;
        uint8 rating;
        uint40 submittedAt;
        address user;
        bytes32 caseId;
        bytes32 messageHash;
    }
    
    struct PackedDocument {
        uint8 docType;
        uint8 status;
        uint32 uploadedAt;
        uint32 verifiedAt;
        address user;
        address verifiedBy;
        bytes32 hash;
        bytes32 ipfsCid;
    }
    
    // ============ MAPPINGS ============
    
    mapping(address => PackedUser) public users;
    mapping(address => bool) public isRegistered;
    uint256 public totalUsers;
    
    mapping(bytes32 => PackedFIR) public firs;
    bytes32[] public allFIRs;
    mapping(address => bytes32[]) public userFIRs;
    
    mapping(bytes32 => CaseTimeline) public caseTimelines;
    mapping(bytes32 => PackedJudgment) public judgments;
    mapping(bytes32 => PackedAppeal) public appeals;
    mapping(bytes32 => Escrow) public escrows;
    bytes32[] public allCases;
    
    mapping(bytes32 => PackedEvidence) public evidences;
    mapping(bytes32 => bytes32[]) public caseEvidence;
    
    mapping(bytes32 => PackedForensicReport) public forensicReports;
    bytes32[] public allReports;
    
    mapping(bytes32 => PackedHearing) public hearings;
    mapping(bytes32 => bytes32[]) public caseHearings;
    
    mapping(bytes32 => PackedDocument) public documents;
    mapping(address => bytes32[]) public userDocuments;
    
    mapping(bytes32 => PackedFeedback) public feedbacks;
    bytes32[] public allFeedback;
    
    address public admin;
    
    // ============ EVENTS ============
    
    event UserRegistered(address indexed user, uint8 role, uint40 timestamp);
    event UserUpdated(address indexed user, bytes32 ipfsCid);
    event FIRCreated(bytes32 indexed firId, address indexed complainant, uint8 status, uint40 timestamp);
    event FIRUpdated(bytes32 indexed firId, uint8 status, uint40 timestamp);
    event CaseCreated(bytes32 indexed caseId, bytes32 indexed firId, address indexed investigator, uint40 timestamp);
    event CaseStageUpdated(bytes32 indexed caseId, uint8 stage, uint40 timestamp);
    event EvidenceAdded(bytes32 indexed evidenceHash, bytes32 indexed caseId, address indexed collectedBy, uint8 evidenceType, uint32 timestamp);
    event EvidenceVerified(bytes32 indexed evidenceHash, address indexed verifiedBy, bool result, uint32 timestamp);
    event ForensicReportCreated(bytes32 indexed reportId, bytes32 indexed evidenceId, address indexed analyst, uint8 analysisType, uint40 timestamp);
    event ForensicReportCompleted(bytes32 indexed reportId, bytes32 findingsHash, uint40 timestamp);
    event HearingScheduled(bytes32 indexed hearingId, bytes32 indexed caseId, address indexed judge, uint32 scheduledAt, uint40 timestamp);
    event HearingStarted(bytes32 indexed hearingId, uint32 startedAt);
    event HearingCompleted(bytes32 indexed hearingId, uint32 endedAt);
    event JudgmentDelivered(bytes32 indexed judgmentId, bytes32 indexed caseId, address indexed judge, uint8 verdict, uint32 timestamp);
    event AppealFiled(bytes32 indexed caseId, address indexed appellant, uint40 timestamp);
    event AppealDecided(bytes32 indexed caseId, bool accepted, address indexed decidedBy, uint40 timestamp);
    event EscrowDeposited(bytes32 indexed caseId, address indexed depositor, uint128 amount, uint40 timestamp);
    event EscrowReleased(bytes32 indexed caseId, address indexed beneficiary, uint128 amount, uint40 timestamp);
    event DocumentUploaded(bytes32 indexed docId, address indexed user, uint8 docType, uint32 timestamp);
    event DocumentVerified(bytes32 indexed docId, address indexed verifiedBy, bool verified, uint32 timestamp);
    event FeedbackSubmitted(bytes32 indexed feedbackId, address indexed user, bytes32 indexed caseId, uint8 category, uint8 rating, uint40 timestamp);
    
    // ============ MODIFIERS ============
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier onlyRole(uint8 requiredRole) {
        require(users[msg.sender].role == requiredRole || users[msg.sender].role == 5, "Unauthorized");
        _;
    }
    
    modifier userExists(address user) {
        require(isRegistered[user], "User not registered");
        _;
    }
    
    modifier caseExists(bytes32 caseId) {
        require(caseTimelines[caseId].firFiledAt > 0, "Case not found");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor() {
        admin = msg.sender;
        users[admin] = PackedUser({
            role: 5,
            status: 1,
            createdAt: uint40(block.timestamp),
            emailHash: keccak256(abi.encodePacked("admin@justice.gov")),
            ipfsCid: bytes32(0)
        });
        isRegistered[admin] = true;
        totalUsers = 1;
        emit UserRegistered(admin, 5, uint40(block.timestamp));
    }
    
    // ============ USER MANAGEMENT ============
    
    function registerUser(
        uint8 role,
        bytes32 emailHash,
        bytes32 ipfsCid
    ) external {
        require(!isRegistered[msg.sender], "Already registered");
        require(role >= 1 && role <= 5, "Invalid role");
        
        users[msg.sender] = PackedUser({
            role: role,
            status: 1,
            createdAt: uint40(block.timestamp),
            emailHash: emailHash,
            ipfsCid: ipfsCid
        });
        
        isRegistered[msg.sender] = true;
        totalUsers++;
        
        emit UserRegistered(msg.sender, role, uint40(block.timestamp));
    }
    
    function updateUserProfile(bytes32 ipfsCid) external userExists(msg.sender) {
        users[msg.sender].ipfsCid = ipfsCid;
        emit UserUpdated(msg.sender, ipfsCid);
    }
    
    function getUser(address user) external view returns (
        uint8 role, uint8 status, uint40 createdAt, bytes32 emailHash, bytes32 ipfsCid
    ) {
        PackedUser memory u = users[user];
        return (u.role, u.status, u.createdAt, u.emailHash, u.ipfsCid);
    }
    
    // ============ FIR MANAGEMENT ============
    
    function createFIR(
        bytes32 firId,
        bytes32 ipfsCid
    ) external userExists(msg.sender) {
        require(firs[firId].filedAt == 0, "FIR already exists");
        
        firs[firId] = PackedFIR({
            status: 1,
            filedAt: uint40(block.timestamp),
            updatedAt: uint40(block.timestamp),
            complainant: msg.sender,
            assignedInvestigator: address(0),
            caseId: bytes32(0),
            ipfsCid: ipfsCid
        });
        
        allFIRs.push(firId);
        userFIRs[msg.sender].push(firId);
        
        emit FIRCreated(firId, msg.sender, 1, uint40(block.timestamp));
    }
    
    function updateFIRStatus(
        bytes32 firId,
        uint8 newStatus,
        address assignInvestigator
    ) external onlyRole(2) {
        require(firs[firId].filedAt > 0, "FIR not found");
        
        firs[firId].status = newStatus;
        firs[firId].updatedAt = uint40(block.timestamp);
        
        if (assignInvestigator != address(0)) {
            firs[firId].assignedInvestigator = assignInvestigator;
        }
        
        if (newStatus == 3 && firs[firId].caseId == bytes32(0)) {
            bytes32 caseId = keccak256(abi.encodePacked(firId, block.timestamp));
            firs[firId].caseId = caseId;
            
            caseTimelines[caseId].firFiledAt = firs[firId].filedAt;
            caseTimelines[caseId].currentStage = 1;
            allCases.push(caseId);
            
            emit CaseCreated(caseId, firId, assignInvestigator, uint40(block.timestamp));
        }
        
        emit FIRUpdated(firId, newStatus, uint40(block.timestamp));
    }
    
    // ============ CASE MANAGEMENT ============
    
    function updateCaseStage(
        bytes32 caseId,
        uint8 stage
    ) external caseExists(caseId) {
        uint8 requiredRole;
        if (stage == 1) requiredRole = 0;
        else if (stage == 2) requiredRole = 2;
        else if (stage == 3) requiredRole = 2;
        else if (stage == 4) requiredRole = 3;
        else if (stage == 5) requiredRole = 2;
        else if (stage == 6) requiredRole = 4;
        else revert("Invalid stage");
        
        require(users[msg.sender].role == requiredRole || users[msg.sender].role == 5, "Unauthorized");
        
        CaseTimeline storage timeline = caseTimelines[caseId];
        require(stage > timeline.currentStage, "Stage must be greater");
        
        uint40 nowTime = uint40(block.timestamp);
        
        if (stage == 2) timeline.investigatorAssignedAt = nowTime;
        else if (stage == 3) timeline.investigationCompletedAt = nowTime;
        else if (stage == 4) timeline.forensicSubmittedAt = nowTime;
        else if (stage == 5) timeline.courtSubmittedAt = nowTime;
        else if (stage == 6) timeline.judgmentDate = nowTime;
        
        timeline.currentStage = stage;
        
        emit CaseStageUpdated(caseId, stage, nowTime);
    }
    
    // ============ EVIDENCE MANAGEMENT ============
    
    function addEvidence(
        bytes32 evidenceHash,
        bytes32 caseId,
        uint8 evidenceType,
        bytes32 ipfsCid
    ) external caseExists(caseId) onlyRole(2) {
        require(evidences[evidenceHash].collectedAt == 0, "Evidence exists");
        
        evidences[evidenceHash] = PackedEvidence({
            evidenceType: evidenceType,
            status: 0,
            collectedAt: uint32(block.timestamp),
            verifiedAt: 0,
            collectedBy: msg.sender,
            verifiedBy: address(0),
            caseId: caseId,
            hash: evidenceHash,
            ipfsCid: ipfsCid
        });
        
        caseEvidence[caseId].push(evidenceHash);
        
        emit EvidenceAdded(evidenceHash, caseId, msg.sender, evidenceType, uint32(block.timestamp));
    }
    
    function verifyEvidence(
        bytes32 evidenceHash,
        bool isValid
    ) external onlyRole(4) {
        require(evidences[evidenceHash].collectedAt > 0, "Evidence not found");
        
        evidences[evidenceHash].status = isValid ? 1 : 4;
        evidences[evidenceHash].verifiedAt = uint32(block.timestamp);
        evidences[evidenceHash].verifiedBy = msg.sender;
        
        emit EvidenceVerified(evidenceHash, msg.sender, isValid, uint32(block.timestamp));
    }
    
    // ============ FORENSIC REPORTS ============
    
    function createForensicReport(
        bytes32 reportId,
        bytes32 evidenceHash,
        uint8 analysisType,
        bytes32 ipfsCid
    ) external onlyRole(3) {
        require(evidences[evidenceHash].collectedAt > 0, "Evidence not found");
        require(forensicReports[reportId].submittedAt == 0, "Report exists");
        
        forensicReports[reportId] = PackedForensicReport({
            status: 1,
            analysisType: analysisType,
            submittedAt: uint40(block.timestamp),
            completedAt: 0,
            analyst: msg.sender,
            evidenceId: evidenceHash,
            caseId: evidences[evidenceHash].caseId,
            findingsHash: bytes32(0),
            ipfsCid: ipfsCid
        });
        
        allReports.push(reportId);
        
        emit ForensicReportCreated(reportId, evidenceHash, msg.sender, analysisType, uint40(block.timestamp));
    }
    
    function completeForensicReport(
        bytes32 reportId,
        bytes32 findingsHash
    ) external onlyRole(3) {
        require(forensicReports[reportId].submittedAt > 0, "Report not found");
        
        forensicReports[reportId].status = 2;
        forensicReports[reportId].completedAt = uint40(block.timestamp);
        forensicReports[reportId].findingsHash = findingsHash;
        
        emit ForensicReportCompleted(reportId, findingsHash, uint40(block.timestamp));
    }
    
    // ============ COURT HEARINGS ============
    
    function scheduleHearing(
        bytes32 hearingId,
        bytes32 caseId,
        uint32 scheduledAt,
        uint8 hearingType,
        bytes32 meetingLink
    ) external onlyRole(4) {
        require(caseTimelines[caseId].firFiledAt > 0, "Case not found");
        require(hearings[hearingId].scheduledAt == 0, "Hearing exists");
        
        hearings[hearingId] = PackedHearing({
            status: 0,
            hearingType: hearingType,
            scheduledAt: scheduledAt,
            startedAt: 0,
            endedAt: 0,
            judge: msg.sender,
            caseId: caseId,
            meetingLink: meetingLink,
            notesHash: bytes32(0)
        });
        
        caseHearings[caseId].push(hearingId);
        
        emit HearingScheduled(hearingId, caseId, msg.sender, scheduledAt, uint40(block.timestamp));
    }
    
    function startHearing(bytes32 hearingId) external onlyRole(4) {
        require(hearings[hearingId].scheduledAt > 0, "Hearing not found");
        require(hearings[hearingId].status == 0, "Hearing already started/ended");
        
        hearings[hearingId].status = 1;
        hearings[hearingId].startedAt = uint32(block.timestamp);
        
        emit HearingStarted(hearingId, uint32(block.timestamp));
    }
    
    function endHearing(bytes32 hearingId, bytes32 notesHash) external onlyRole(4) {
        require(hearings[hearingId].status == 1, "Hearing not in progress");
        
        hearings[hearingId].status = 2;
        hearings[hearingId].endedAt = uint32(block.timestamp);
        hearings[hearingId].notesHash = notesHash;
        
        emit HearingCompleted(hearingId, uint32(block.timestamp));
    }
    
    // ============ JUDGMENTS ============
    
    function deliverJudgment(
        bytes32 judgmentId,
        bytes32 caseId,
        uint8 verdict,
        bytes32 sentenceHash,
        bytes32 ipfsCid
    ) external onlyRole(4) {
        require(caseTimelines[caseId].firFiledAt > 0, "Case not found");
        require(judgments[judgmentId].deliveredAt == 0, "Judgment exists");
        
        judgments[judgmentId] = PackedJudgment({
            verdict: verdict,
            deliveredAt: uint32(block.timestamp),
            judge: msg.sender,
            caseId: caseId,
            sentenceHash: sentenceHash,
            ipfsCid: ipfsCid
        });
        
        caseTimelines[caseId].judgmentDate = uint40(block.timestamp);
        caseTimelines[caseId].currentStage = 6;
        
        emit JudgmentDelivered(judgmentId, caseId, msg.sender, verdict, uint32(block.timestamp));
    }
    
    // ============ APPEALS ============
    
    function fileAppeal(
        bytes32 caseId,
        bytes32 groundsHash
    ) external caseExists(caseId) {
        bytes32 judgmentKey = keccak256(abi.encodePacked(caseId, "judgment"));
        require(judgments[judgmentKey].deliveredAt > 0, "No judgment yet");
        require(appeals[caseId].filedAt == 0, "Appeal already filed");
        
        appeals[caseId] = PackedAppeal({
            status: 0,
            filedAt: uint40(block.timestamp),
            decidedAt: 0,
            appellant: msg.sender,
            decidedBy: address(0),
            caseId: caseId,
            groundsHash: groundsHash,
            decisionHash: bytes32(0)
        });
        
        caseTimelines[caseId].isAppealed = true;
        
        emit AppealFiled(caseId, msg.sender, uint40(block.timestamp));
    }
    
    function decideAppeal(
        bytes32 caseId,
        bool accept,
        bytes32 decisionHash
    ) external onlyRole(4) {
        require(appeals[caseId].filedAt > 0, "No appeal found");
        require(appeals[caseId].status == 0, "Appeal already decided");
        
        appeals[caseId].status = accept ? 1 : 2;
        appeals[caseId].decidedAt = uint40(block.timestamp);
        appeals[caseId].decidedBy = msg.sender;
        appeals[caseId].decisionHash = decisionHash;
        
        emit AppealDecided(caseId, accept, msg.sender, uint40(block.timestamp));
    }
    
    // ============ FINE ESCROW ============
    
    function depositEscrow(
        bytes32 caseId,
        address beneficiary
    ) external payable caseExists(caseId) {
        require(msg.value > 0, "Amount required");
        require(escrows[caseId].amount == 0, "Escrow exists");
        
        escrows[caseId] = Escrow({
            amount: uint128(msg.value),
            released: false,
            depositor: msg.sender,
            beneficiary: beneficiary,
            caseId: caseId
        });
        
        emit EscrowDeposited(caseId, msg.sender, uint128(msg.value), uint40(block.timestamp));
    }
    
    function releaseEscrow(bytes32 caseId) external onlyRole(4) {
        Escrow storage escrow = escrows[caseId];
        require(escrow.amount > 0, "No escrow");
        require(!escrow.released, "Already released");
        
        escrow.released = true;
        
        (bool success, ) = escrow.beneficiary.call{value: escrow.amount}("");
        require(success, "Transfer failed");
        
        emit EscrowReleased(caseId, escrow.beneficiary, escrow.amount, uint40(block.timestamp));
    }
    
    // ============ DOCUMENTS ============
    
    function uploadDocument(
        bytes32 docId,
        uint8 docType,
        bytes32 hash,
        bytes32 ipfsCid
    ) external userExists(msg.sender) {
        require(documents[docId].uploadedAt == 0, "Document exists");
        
        documents[docId] = PackedDocument({
            docType: docType,
            status: 0,
            uploadedAt: uint32(block.timestamp),
            verifiedAt: 0,
            user: msg.sender,
            verifiedBy: address(0),
            hash: hash,
            ipfsCid: ipfsCid
        });
        
        userDocuments[msg.sender].push(docId);
        
        emit DocumentUploaded(docId, msg.sender, docType, uint32(block.timestamp));
    }
    
    function verifyDocument(
        bytes32 docId,
        bool verified
    ) external onlyRole(2) {
        require(documents[docId].uploadedAt > 0, "Document not found");
        
        documents[docId].status = verified ? 1 : 2;
        documents[docId].verifiedAt = uint32(block.timestamp);
        documents[docId].verifiedBy = msg.sender;
        
        emit DocumentVerified(docId, msg.sender, verified, uint32(block.timestamp));
    }
    
    // ============ FEEDBACK ============
    
    function submitFeedback(
        bytes32 feedbackId,
        bytes32 caseId,
        uint8 category,
        uint8 rating,
        bytes32 messageHash
    ) external userExists(msg.sender) {
        require(rating >= 1 && rating <= 5, "Rating must be 1-5");
        
        feedbacks[feedbackId] = PackedFeedback({
            category: category,
            rating: rating,
            submittedAt: uint40(block.timestamp),
            user: msg.sender,
            caseId: caseId,
            messageHash: messageHash
        });
        
        allFeedback.push(feedbackId);
        
        emit FeedbackSubmitted(feedbackId, msg.sender, caseId, category, rating, uint40(block.timestamp));
    }
    
    // ============ QUERY FUNCTIONS ============
    
    function getUserFIRs(address user) external view returns (bytes32[] memory) {
        return userFIRs[user];
    }
    
    function getCaseEvidence(bytes32 caseId) external view returns (bytes32[] memory) {
        return caseEvidence[caseId];
    }
    
    function getCaseHearings(bytes32 caseId) external view returns (bytes32[] memory) {
        return caseHearings[caseId];
    }
    
    function getUserDocuments(address user) external view returns (bytes32[] memory) {
        return userDocuments[user];
    }
    
    function getTotalFIRs() external view returns (uint256) {
        return allFIRs.length;
    }
    
    function getTotalCases() external view returns (uint256) {
        return allCases.length;
    }
    
    function getTotalReports() external view returns (uint256) {
        return allReports.length;
    }
    
    function getTotalFeedback() external view returns (uint256) {
        return allFeedback.length;
    }
    
    // ============ STATISTICS ============
    
    function getSystemStats() external view returns (
        uint256 totalUsersCount,
        uint256 totalFIRsCount,
        uint256 totalCasesCount,
        uint256 totalEvidenceCount,
        uint256 totalReportsCount,
        uint256 totalJudgmentsCount
    ) {
        uint256 evidenceCount = 0;
        for (uint256 i = 0; i < allCases.length; i++) {
            evidenceCount += caseEvidence[allCases[i]].length;
        }
        
        // Count judgments by checking all cases that have judgment date
        uint256 judgmentCount = 0;
        for (uint256 i = 0; i < allCases.length; i++) {
            if (caseTimelines[allCases[i]].judgmentDate > 0) {
                judgmentCount++;
            }
        }
        
        return (
            totalUsers,
            allFIRs.length,
            allCases.length,
            evidenceCount,
            allReports.length,
            judgmentCount
        );
    }
}