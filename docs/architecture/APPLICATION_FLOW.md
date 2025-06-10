# ZKP File Sharing Application Flow

This document provides a comprehensive overview of the ZKP File Sharing application flow, including all user interactions, system processes, and feature workflows using Mermaid diagrams.

## Table of Contents

- [Overview](#overview)
- [Complete User Journey](#complete-user-journey)
- [Authentication Flow](#authentication-flow)
- [File Management Flow](#file-management-flow)
- [File Sharing Flow](#file-sharing-flow)
- [System Architecture Flow](#system-architecture-flow)
- [Error Handling Flow](#error-handling-flow)
- [Security Flow](#security-flow)

## Overview

The ZKP File Sharing application provides a secure, privacy-preserving platform for file storage and sharing using Zero-Knowledge Proof authentication. This document illustrates the complete user journey and system interactions.

### Key Features Covered
- ✅ ZKP-based Registration & Authentication
- ✅ Secure File Upload & Storage
- ✅ File Management (CRUD operations)
- ✅ File Sharing with Permissions
- ✅ File Download with Presigned URLs
- ✅ User Profile Management
- ✅ JWT Session Management
- ✅ Real-time File Listing
- ✅ Storage Analytics

## Complete User Journey

```mermaid
flowchart TD
    Start([User visits app]) --> Landing{First time user?}
    
    Landing -->|Yes| Register[Register Account]
    Landing -->|No| Login[Login to Account]
    
    %% Registration Flow
    Register --> GenerateKeys[Generate ZKP Key Pair]
    GenerateKeys --> FillForm[Fill Registration Form]
    FillForm --> CreateProof[Create ZKP Proof]
    CreateProof --> SubmitReg[Submit Registration]
    SubmitReg --> RegSuccess{Registration Success?}
    RegSuccess -->|Yes| AutoLogin[Auto Login]
    RegSuccess -->|No| RegError[Show Error Message]
    RegError --> Register
    
    %% Login Flow
    Login --> EnterCreds[Enter Username/Email]
    EnterCreds --> LoadKeys[Load Private Keys]
    LoadKeys --> GenerateLoginProof[Generate Login Proof]
    GenerateLoginProof --> SubmitLogin[Submit Login]
    SubmitLogin --> LoginSuccess{Login Success?}
    LoginSuccess -->|Yes| Dashboard[Dashboard]
    LoginSuccess -->|No| LoginError[Show Error Message]
    LoginError --> Login
    
    %% Auto login from registration
    AutoLogin --> Dashboard
    
    %% Main Application Flow
    Dashboard --> MainMenu{Choose Action}
    
    MainMenu -->|Upload Files| FileUpload[File Upload]
    MainMenu -->|Manage Files| FileManager[File Manager]
    MainMenu -->|View Shared| SharedFiles[Shared Files]
    MainMenu -->|Profile| UserProfile[User Profile]
    MainMenu -->|Logout| Logout[Logout]
    
    %% File Upload
    FileUpload --> SelectFiles[Select Files]
    SelectFiles --> AddMetadata[Add Description/Tags]
    AddMetadata --> UploadProcess[Upload to MinIO]
    UploadProcess --> SaveMetadata[Save File Metadata]
    SaveMetadata --> UploadSuccess[Upload Success]
    UploadSuccess --> Dashboard
    
    %% File Manager
    FileManager --> ListFiles[List User Files]
    ListFiles --> FileActions{File Action}
    FileActions -->|View| ViewFile[View File Details]
    FileActions -->|Share| ShareFile[Share File]
    FileActions -->|Download| DownloadFile[Download File]
    FileActions -->|Edit| EditFile[Edit File Info]
    FileActions -->|Delete| DeleteFile[Delete File]
    
    %% File Operations
    ViewFile --> FileActions
    EditFile --> FileActions
    DeleteFile --> FileActions
    DownloadFile --> GenerateURL[Generate Presigned URL]
    GenerateURL --> FileActions
    
    %% File Sharing
    ShareFile --> SelectUsers[Select Recipients]
    SelectUsers --> SetPermissions[Set Permissions]
    SetPermissions --> SendShare[Send Share Request]
    SendShare --> ShareSuccess[Share Success]
    ShareSuccess --> FileActions
    
    %% Shared Files View
    SharedFiles --> ListShared[List Shared Files]
    ListShared --> SharedActions{Shared File Action}
    SharedActions -->|View| ViewShared[View Shared File]
    SharedActions -->|Download| DownloadShared[Download Shared File]
    SharedActions -->|Back| Dashboard
    
    ViewShared --> SharedActions
    DownloadShared --> GenerateSharedURL[Generate Download URL]
    GenerateSharedURL --> SharedActions
    
    %% User Profile
    UserProfile --> ViewProfile[View Profile Info]
    ViewProfile --> ProfileActions{Profile Action}
    ProfileActions -->|Edit| EditProfile[Edit Profile]
    ProfileActions -->|Storage Info| StorageInfo[View Storage Usage]
    ProfileActions -->|Key Management| KeyManagement[Manage Keys]
    ProfileActions -->|Back| Dashboard
    
    EditProfile --> ProfileActions
    StorageInfo --> ProfileActions
    KeyManagement --> ProfileActions
    
    %% Logout
    Logout --> ClearSession[Clear JWT Token]
    ClearSession --> ClearKeys[Clear Local Keys]
    ClearKeys --> Landing
    
    %% Styling
    classDef authFlow fill:#e1f5fe
    classDef fileFlow fill:#f3e5f5
    classDef shareFlow fill:#e8f5e8
    classDef errorFlow fill:#ffebee
    
    class Register,Login,GenerateKeys,CreateProof,AutoLogin authFlow
    class FileUpload,FileManager,SelectFiles,UploadProcess fileFlow
    class ShareFile,SelectUsers,SetPermissions,SendShare shareFlow
    class RegError,LoginError errorFlow
```

## Authentication Flow

### Registration Process

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant ZKP_Service
    participant Backend
    participant Database
    participant MinIO

    User->>Frontend: Navigate to /register
    Frontend->>User: Show registration form
    
    User->>Frontend: Click "Generate Keys"
    Frontend->>ZKP_Service: Generate key pair
    ZKP_Service-->>Frontend: Return (private_key, public_key)
    Frontend->>User: Display keys & backup option
    
    User->>Frontend: Fill form (username, email)
    User->>Frontend: Submit registration
    
    Frontend->>ZKP_Service: Generate ZKP proof
    ZKP_Service-->>Frontend: Return proof
    
    Frontend->>Backend: POST /api/auth/register
    Note over Frontend,Backend: {username, email, public_key, zkp_proof}
    
    Backend->>Backend: Validate input data
    Backend->>Backend: Verify ZKP proof
    Backend->>Database: Check username/email uniqueness
    Database-->>Backend: Unique check result
    
    alt Registration Valid
        Backend->>Database: Create user record
        Database-->>Backend: User created
        Backend->>MinIO: Initialize user storage
        MinIO-->>Backend: Storage ready
        Backend-->>Frontend: Success response + JWT
        Frontend->>Frontend: Store JWT token
        Frontend->>User: Redirect to dashboard
    else Registration Invalid
        Backend-->>Frontend: Error response
        Frontend->>User: Show error message
    end
```

### Login Process

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant ZKP_Service
    participant Backend
    participant Database

    User->>Frontend: Navigate to /login
    Frontend->>User: Show login form
    
    User->>Frontend: Enter username/email
    User->>Frontend: Load/enter private key
    User->>Frontend: Submit login
    
    Frontend->>ZKP_Service: Generate login proof
    Note over Frontend,ZKP_Service: Using private key + timestamp
    ZKP_Service-->>Frontend: Return ZKP proof
    
    Frontend->>Backend: POST /api/auth/login
    Note over Frontend,Backend: {username_or_email, zkp_proof}
    
    Backend->>Database: Find user by identifier
    Database-->>Backend: Return user data
    
    alt User Found
        Backend->>Backend: Verify ZKP proof with stored public_key
        alt Proof Valid
            Backend->>Backend: Generate JWT token
            Backend-->>Frontend: Success + JWT + user data
            Frontend->>Frontend: Store JWT token
            Frontend->>User: Redirect to dashboard
        else Proof Invalid
            Backend-->>Frontend: Authentication failed
            Frontend->>User: Show error message
        end
    else User Not Found
        Backend-->>Frontend: User not found error
        Frontend->>User: Show error message
    end
```

## File Management Flow

### File Upload Process

```mermaid
flowchart TD
    Start([User clicks Upload]) --> SelectFile[Select File from Device]
    SelectFile --> ValidateFile{File Valid?}
    
    ValidateFile -->|No| FileError[Show File Error]
    ValidateFile -->|Yes| AddMetadata[Add Optional Metadata]
    
    FileError --> SelectFile
    
    AddMetadata --> SubmitUpload[Submit Upload]
    SubmitUpload --> PreProcess[Frontend Preprocessing]
    
    PreProcess --> UploadAPI[POST /api/files/upload]
    
    UploadAPI --> BackendValidation{Backend Validation}
    BackendValidation -->|Fail| UploadError[Return Error]
    BackendValidation -->|Pass| ProcessUpload[Process Upload]
    
    ProcessUpload --> GeneratePath[Generate Unique File Path]
    GeneratePath --> CalculateHash[Calculate File Hash]
    CalculateHash --> StoreMinIO[Store in MinIO]
    
    StoreMinIO --> MinIOSuccess{Storage Success?}
    MinIOSuccess -->|No| StorageError[Storage Error]
    MinIOSuccess -->|Yes| SaveMetadata[Save to Database]
    
    SaveMetadata --> DBSuccess{Database Success?}
    DBSuccess -->|No| DBError[Database Error]
    DBSuccess -->|Yes| UploadComplete[Upload Complete]
    
    UploadComplete --> UpdateUI[Update File List]
    UpdateUI --> ShowSuccess[Show Success Message]
    
    UploadError --> ShowError[Show Error Message]
    StorageError --> ShowError
    DBError --> ShowError
    ShowError --> SelectFile
    
    ShowSuccess --> End([Upload Finished])
    
    classDef successFlow fill:#e8f5e8
    classDef errorFlow fill:#ffebee
    classDef processFlow fill:#e3f2fd
    
    class UploadComplete,UpdateUI,ShowSuccess successFlow
    class FileError,UploadError,StorageError,DBError,ShowError errorFlow
    class PreProcess,ProcessUpload,GeneratePath,CalculateHash,StoreMinIO,SaveMetadata processFlow
```

### File Operations Flow

```mermaid
flowchart TD
    FileList[File List Display] --> FileAction{User Action}
    
    FileAction -->|View| ViewDetails[View File Details]
    FileAction -->|Download| InitDownload[Initiate Download]
    FileAction -->|Share| ShareModal[Open Share Modal]
    FileAction -->|Edit| EditModal[Open Edit Modal]
    FileAction -->|Delete| DeleteConfirm[Confirm Delete]
    
    %% View Details
    ViewDetails --> DetailModal[Show File Details]
    DetailModal --> FileAction
    
    %% Download Flow
    InitDownload --> RequestURL[Request Presigned URL]
    RequestURL --> GenerateURL[Backend Generates URL]
    GenerateURL --> ReturnURL[Return Download URL]
    ReturnURL --> StartDownload[Start File Download]
    StartDownload --> DownloadComplete[Download Complete]
    DownloadComplete --> FileAction
    
    %% Edit Flow
    EditModal --> UpdateData[User Updates Data]
    UpdateData --> SubmitEdit[Submit Changes]
    SubmitEdit --> ValidateEdit{Validation}
    ValidateEdit -->|Pass| SaveChanges[Save to Database]
    ValidateEdit -->|Fail| EditError[Show Error]
    SaveChanges --> EditSuccess[Update Success]
    EditSuccess --> RefreshList[Refresh File List]
    EditError --> EditModal
    RefreshList --> FileAction
    
    %% Delete Flow
    DeleteConfirm --> ConfirmModal[Show Confirmation]
    ConfirmModal --> UserConfirm{User Confirms?}
    UserConfirm -->|No| FileAction
    UserConfirm -->|Yes| DeleteFile[Delete from Database]
    DeleteFile --> DeleteStorage[Delete from MinIO]
    DeleteStorage --> RevokeShares[Revoke All Shares]
    RevokeShares --> DeleteSuccess[Delete Success]
    DeleteSuccess --> RefreshList
```

## File Sharing Flow

### Share File Process

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    participant NotificationService

    User->>Frontend: Click "Share" on file
    Frontend->>Frontend: Open share modal
    Frontend->>Backend: GET /api/users/search (for autocomplete)
    Backend->>Database: Search users
    Database-->>Backend: Return user list
    Backend-->>Frontend: Return users for autocomplete
    
    User->>Frontend: Enter recipient username/email
    User->>Frontend: Select permissions (read/write)
    User->>Frontend: Set expiration (optional)
    User->>Frontend: Submit share request
    
    Frontend->>Backend: POST /api/files/{file_id}/share
    Note over Frontend,Backend: {username_or_email, permission, expires_at}
    
    Backend->>Database: Verify file ownership
    Database-->>Backend: Ownership confirmed
    
    Backend->>Database: Find recipient user
    Database-->>Backend: Return recipient data
    
    alt Recipient Found & Valid
        Backend->>Database: Create file share record
        Database-->>Backend: Share record created
        
        Backend->>NotificationService: Send share notification
        NotificationService-->>Backend: Notification sent
        
        Backend-->>Frontend: Share success response
        Frontend->>Frontend: Update UI
        Frontend->>User: Show success message
        
    else Invalid Request
        Backend-->>Frontend: Error response
        Frontend->>User: Show error message
    end
```

### Access Shared File

```mermaid
flowchart TD
    User[User Access App] --> ViewShared[View Shared Files]
    ViewShared --> LoadShared[Load Shared Files List]
    
    LoadShared --> APICall[GET /api/files/shared]
    APICall --> CheckAuth{Valid JWT?}
    
    CheckAuth -->|No| AuthError[Authentication Error]
    CheckAuth -->|Yes| QueryShares[Query User Shares]
    
    QueryShares --> FilterActive[Filter Active Shares]
    FilterActive --> ReturnList[Return Shared Files]
    ReturnList --> DisplayList[Display in UI]
    
    DisplayList --> UserAction{User Action}
    
    UserAction -->|View Details| ShowDetails[Show File Details]
    UserAction -->|Download| CheckPermission{Has Download Permission?}
    UserAction -->|Refresh| LoadShared
    
    CheckPermission -->|No| PermissionDenied[Permission Denied]
    CheckPermission -->|Yes| GenerateDownload[Generate Download URL]
    
    GenerateDownload --> ValidateShare{Share Still Valid?}
    ValidateShare -->|No| ExpiredShare[Share Expired]
    ValidateShare -->|Yes| CreatePresignedURL[Create Presigned URL]
    
    CreatePresignedURL --> ReturnDownloadURL[Return Download URL]
    ReturnDownloadURL --> InitiateDownload[Initiate Download]
    
    ShowDetails --> UserAction
    PermissionDenied --> UserAction
    ExpiredShare --> UserAction
    AuthError --> LoginRedirect[Redirect to Login]
    
    classDef errorFlow fill:#ffebee
    classDef successFlow fill:#e8f5e8
    
    class AuthError,PermissionDenied,ExpiredShare errorFlow
    class DisplayList,ShowDetails,InitiateDownload successFlow
```

## System Architecture Flow

### Request Processing Flow

```mermaid
flowchart TD
    Client[Client Request] --> LoadBalancer[Load Balancer/nginx]
    LoadBalancer --> Frontend{Static Files?}
    
    Frontend -->|Yes| StaticFiles[Serve Static Files]
    Frontend -->|No| APIGateway[API Gateway]
    
    APIGateway --> RateLimit[Rate Limiting]
    RateLimit --> CORS[CORS Check]
    CORS --> Auth[Authentication Check]
    
    Auth --> ValidJWT{Valid JWT?}
    ValidJWT -->|No| AuthError[401 Unauthorized]
    ValidJWT -->|Yes| Router[FastAPI Router]
    
    Router --> Endpoint{Endpoint Type}
    
    Endpoint -->|Auth| AuthService[Authentication Service]
    Endpoint -->|Files| FileService[File Service]
    Endpoint -->|Users| UserService[User Service]
    
    %% Authentication Service Flow
    AuthService --> ZKPVerify[ZKP Verification]
    ZKPVerify --> Database[(PostgreSQL)]
    Database --> AuthResponse[Auth Response]
    
    %% File Service Flow
    FileService --> FileValidation[File Validation]
    FileValidation --> StorageService[Storage Service]
    StorageService --> MinIO[(MinIO Storage)]
    MinIO --> FileDatabase[File Metadata to DB]
    FileDatabase --> Database
    Database --> FileResponse[File Response]
    
    %% User Service Flow
    UserService --> UserValidation[User Validation]
    UserValidation --> Database
    Database --> UserResponse[User Response]
    
    %% Response Flow
    AuthResponse --> ResponseFormat[Format Response]
    FileResponse --> ResponseFormat
    UserResponse --> ResponseFormat
    ResponseFormat --> ErrorHandler{Error Occurred?}
    
    ErrorHandler -->|Yes| ErrorResponse[Error Response]
    ErrorHandler -->|No| SuccessResponse[Success Response]
    
    ErrorResponse --> Client
    SuccessResponse --> Client
    AuthError --> Client
    StaticFiles --> Client
    
    %% Background Services
    Database -.-> Redis[(Redis Cache)]
    MinIO -.-> BackupService[Backup Service]
    
    classDef serviceFlow fill:#e3f2fd
    classDef dataFlow fill:#f3e5f5
    classDef errorFlow fill:#ffebee
    
    class AuthService,FileService,UserService,StorageService serviceFlow
    class Database,MinIO,Redis dataFlow
    class AuthError,ErrorResponse errorFlow
```

## Error Handling Flow

```mermaid
flowchart TD
    Error[Error Occurs] --> ErrorType{Error Type}
    
    ErrorType -->|Authentication| AuthError[Authentication Error]
    ErrorType -->|Validation| ValidationError[Validation Error]
    ErrorType -->|File System| FileError[File System Error]
    ErrorType -->|Database| DBError[Database Error]
    ErrorType -->|Network| NetworkError[Network Error]
    ErrorType -->|Unknown| UnknownError[Unknown Error]
    
    %% Authentication Errors
    AuthError --> AuthSubType{Auth Error Type}
    AuthSubType -->|Invalid Token| InvalidToken[Token Invalid/Expired]
    AuthSubType -->|ZKP Failed| ZKPFailed[ZKP Verification Failed]
    AuthSubType -->|User Not Found| UserNotFound[User Not Found]
    
    InvalidToken --> RedirectLogin[Redirect to Login]
    ZKPFailed --> ShowAuthError[Show Auth Error Message]
    UserNotFound --> ShowUserError[Show User Error Message]
    
    %% Validation Errors
    ValidationError --> ValidationDetail[Extract Validation Details]
    ValidationDetail --> ShowFieldErrors[Show Field-Specific Errors]
    
    %% File System Errors
    FileError --> FileSubType{File Error Type}
    FileSubType -->|Upload Failed| UploadFailed[Upload Failed]
    FileSubType -->|Download Failed| DownloadFailed[Download Failed]
    FileSubType -->|Storage Full| StorageFull[Storage Quota Exceeded]
    FileSubType -->|File Not Found| FileNotFound[File Not Found]
    
    UploadFailed --> ShowUploadError[Show Upload Error]
    DownloadFailed --> ShowDownloadError[Show Download Error]
    StorageFull --> ShowQuotaError[Show Quota Error]
    FileNotFound --> Show404Error[Show 404 Error]
    
    %% Database Errors
    DBError --> DBSubType{DB Error Type}
    DBSubType -->|Connection Failed| DBConnection[Connection Error]
    DBSubType -->|Query Failed| QueryFailed[Query Error]
    DBSubType -->|Constraint Violation| ConstraintError[Constraint Error]
    
    DBConnection --> ShowDBError[Show Database Error]
    QueryFailed --> ShowQueryError[Show Query Error]
    ConstraintError --> ShowConstraintError[Show Constraint Error]
    
    %% Network Errors
    NetworkError --> NetworkSubType{Network Error Type}
    NetworkSubType -->|Timeout| TimeoutError[Request Timeout]
    NetworkSubType -->|Connection Lost| ConnectionLost[Connection Lost]
    NetworkSubType -->|Server Error| ServerError[Server Error]
    
    TimeoutError --> ShowTimeoutError[Show Timeout Error]
    ConnectionLost --> ShowConnectionError[Show Connection Error]
    ServerError --> ShowServerError[Show Server Error]
    
    %% Unknown Errors
    UnknownError --> LogError[Log Error Details]
    LogError --> ShowGenericError[Show Generic Error]
    
    %% Error Recovery
    ShowAuthError --> RetryAuth[Offer Retry Authentication]
    ShowUserError --> RetryAuth
    ShowFieldErrors --> FixAndRetry[Allow User to Fix and Retry]
    ShowUploadError --> RetryUpload[Offer Retry Upload]
    ShowDownloadError --> RetryDownload[Offer Retry Download]
    ShowQuotaError --> ManageStorage[Redirect to Storage Management]
    Show404Error --> BackToList[Back to File List]
    ShowDBError --> TryAgainLater[Show Try Again Message]
    ShowQueryError --> TryAgainLater
    ShowConstraintError --> FixAndRetry
    ShowTimeoutError --> RetryRequest[Offer Retry Request]
    ShowConnectionError --> CheckConnection[Check Connection Message]
    ShowServerError --> TryAgainLater
    ShowGenericError --> ContactSupport[Show Contact Support]
    
    classDef errorType fill:#ffebee
    classDef errorAction fill:#fff3e0
    classDef recovery fill:#e8f5e8
    
    class AuthError,ValidationError,FileError,DBError,NetworkError,UnknownError errorType
    class ShowAuthError,ShowFieldErrors,ShowUploadError,ShowDBError,ShowTimeoutError,ShowGenericError errorAction
    class RetryAuth,FixAndRetry,RetryUpload,ManageStorage,ContactSupport recovery
```

## Security Flow

### Security Validation Pipeline

```mermaid
flowchart TD
    Request[Incoming Request] --> InputValidation[Input Validation]
    
    InputValidation --> SanitizeInput[Sanitize Input Data]
    SanitizeInput --> ValidateSchema[Validate Against Schema]
    ValidateSchema --> SchemaValid{Schema Valid?}
    
    SchemaValid -->|No| ValidationError[Return Validation Error]
    SchemaValid -->|Yes| AuthCheck[Authentication Check]
    
    AuthCheck --> JWTValid{JWT Valid?}
    JWTValid -->|No| AuthError[Return Auth Error]
    JWTValid -->|Yes| ExtractUser[Extract User from JWT]
    
    ExtractUser --> AuthorizeAction[Authorize Action]
    AuthorizeAction --> HasPermission{Has Permission?}
    
    HasPermission -->|No| PermissionError[Return Permission Error]
    HasPermission -->|Yes| RateLimit[Rate Limiting Check]
    
    RateLimit --> RateLimitOK{Rate Limit OK?}
    RateLimitOK -->|No| RateLimitError[Return Rate Limit Error]
    RateLimitOK -->|Yes| ProcessRequest[Process Request]
    
    ProcessRequest --> FileOperation{File Operation?}
    
    FileOperation -->|Yes| FileSecurityCheck[File Security Check]
    FileOperation -->|No| NonFileOperation[Non-File Operation]
    
    %% File Security Checks
    FileSecurityCheck --> CheckFileOwnership[Check File Ownership]
    CheckFileOwnership --> OwnershipValid{Ownership Valid?}
    
    OwnershipValid -->|No| OwnershipError[Return Ownership Error]
    OwnershipValid -->|Yes| CheckFileAccess[Check File Access Rights]
    
    CheckFileAccess --> AccessValid{Access Valid?}
    AccessValid -->|No| AccessError[Return Access Error]
    AccessValid -->|Yes| VirusScan[Virus Scan (Upload)]
    
    VirusScan --> VirusClean{File Clean?}
    VirusClean -->|No| VirusError[Return Virus Error]
    VirusClean -->|Yes| FileProcessing[File Processing]
    
    %% Non-file operations
    NonFileOperation --> DataValidation[Data Validation]
    DataValidation --> BusinessLogic[Business Logic Validation]
    BusinessLogic --> ExecuteOperation[Execute Operation]
    
    FileProcessing --> ExecuteOperation
    
    ExecuteOperation --> AuditLog[Create Audit Log]
    AuditLog --> SuccessResponse[Return Success Response]
    
    %% Error Responses
    ValidationError --> LogError[Log Security Event]
    AuthError --> LogError
    PermissionError --> LogError
    RateLimitError --> LogError
    OwnershipError --> LogError
    AccessError --> LogError
    VirusError --> LogError
    
    LogError --> SecurityResponse[Return Security Error Response]
    
    classDef securityCheck fill:#e3f2fd
    classDef errorResponse fill:#ffebee
    classDef successPath fill:#e8f5e8
    
    class InputValidation,AuthCheck,AuthorizeAction,FileSecurityCheck,CheckFileOwnership,CheckFileAccess securityCheck
    class ValidationError,AuthError,PermissionError,OwnershipError,AccessError,VirusError errorResponse
    class ProcessRequest,FileProcessing,ExecuteOperation,SuccessResponse successPath
```

This comprehensive application flow documentation provides a complete picture of how users interact with the ZKP File Sharing application, from initial registration through all file management operations. Each diagram shows the decision points, error handling, and security considerations that make the application robust and user-friendly. 