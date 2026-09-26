# Backend exact source excerpts

Commit: `636ea26469823bc475732d1e0f79f147556d1f63`. Reference only; do not edit these excerpts to change an API.

Use heading search for a Java filename. Public source may contain internal implementation notes; FE only sends documented public fields.

## src/main/java/com/kbase/ai/dto/request/CreateAiConversationRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/dto/request/CreateAiConversationRequest.java)

```java
package com.kbase.ai.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateAiConversationRequest(@NotBlank String message) {
}
```

## src/main/java/com/kbase/ai/dto/request/GuideContextMessage.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/dto/request/GuideContextMessage.java)

```java
package com.kbase.ai.dto.request;

import com.kbase.ai.provider.model.AiChatRole;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Client-supplied, non-authoritative Guide context. SYSTEM is not representable. */
public record GuideContextMessage(@NotNull AiChatRole role,
        @NotBlank @Size(max = 4000) String content) {
}
```

## src/main/java/com/kbase/ai/dto/request/GuideQueryRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/dto/request/GuideQueryRequest.java)

```java
package com.kbase.ai.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GuideQueryRequest(@NotBlank @Size(max = 8000) String message,
        @Valid @Size(max = 8) List<GuideContextMessage> context) {
    public GuideQueryRequest { context = context == null ? List.of() : List.copyOf(context); }
}
```

## src/main/java/com/kbase/ai/dto/request/RenameAiConversationRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/dto/request/RenameAiConversationRequest.java)

```java
package com.kbase.ai.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RenameAiConversationRequest(@NotBlank String title) {
}
```

## src/main/java/com/kbase/ai/dto/request/SendAiMessageRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/dto/request/SendAiMessageRequest.java)

```java
package com.kbase.ai.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SendAiMessageRequest(@NotBlank String message) {
}
```

## src/main/java/com/kbase/ai/dto/response/AiConversationResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/dto/response/AiConversationResponse.java)

```java
package com.kbase.ai.dto.response;

import java.time.Instant;
import java.util.UUID;

import com.kbase.ai.entity.AiConversation;

public record AiConversationResponse(UUID id, UUID projectId, String title,
        Instant createdAt, Instant updatedAt) {

    public static AiConversationResponse from(AiConversation conversation) {
        return new AiConversationResponse(conversation.getId(), conversation.getProjectId(),
                conversation.getTitle(), conversation.getCreatedAt(), conversation.getUpdatedAt());
    }
}
```

## src/main/java/com/kbase/ai/dto/response/AiMessageResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/dto/response/AiMessageResponse.java)

```java
package com.kbase.ai.dto.response;

import java.time.Instant;
import java.util.UUID;

import com.kbase.ai.entity.AiMessage;
import com.kbase.ai.enums.AiAnswerType;
import com.kbase.ai.enums.AiGenerationStatus;
import com.kbase.ai.enums.AiMessageRole;

public record AiMessageResponse(UUID id, AiMessageRole role, String content,
        AiGenerationStatus generationStatus, AiAnswerType answerType, String failureCode,
        Instant createdAt, Instant completedAt) {

    public static AiMessageResponse from(AiMessage message) {
        return new AiMessageResponse(message.getId(), message.getRole(), message.getContent(),
                message.getGenerationStatus(), message.getAnswerType(), message.getFailureCode(),
                message.getCreatedAt(), message.getCompletedAt());
    }
}
```

## src/main/java/com/kbase/ai/dto/response/AiSourceResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/dto/response/AiSourceResponse.java)

```java
package com.kbase.ai.dto.response;

import java.util.UUID;

import com.kbase.ai.entity.AiMessageSource;

public record AiSourceResponse(int order, UUID documentId, String documentName,
        Integer pageNumber, Integer slideNumber, String sectionTitle,
        Availability availability) {

    public enum Availability { AVAILABLE, UNAVAILABLE }

    public static AiSourceResponse from(AiMessageSource source) {
        boolean live = source.getDocumentId() != null && source.getChunkId() != null;
        return new AiSourceResponse(source.getSourceOrder() + 1,
                live ? source.getDocumentId() : null,
                source.getDocumentNameSnapshot(), source.getPageNumberSnapshot(),
                source.getSlideNumberSnapshot(), source.getSectionTitleSnapshot(),
                live ? Availability.AVAILABLE : Availability.UNAVAILABLE);
    }
}
```

## src/main/java/com/kbase/ai/dto/response/AiTurnResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/dto/response/AiTurnResponse.java)

```java
package com.kbase.ai.dto.response;

import java.util.List;

public record AiTurnResponse(AiMessageResponse message, List<AiSourceResponse> sources) {
    public AiTurnResponse {
        sources = sources == null ? List.of() : List.copyOf(sources);
    }
}
```

## src/main/java/com/kbase/ai/dto/response/CreateAiConversationResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/dto/response/CreateAiConversationResponse.java)

```java
package com.kbase.ai.dto.response;

import java.util.List;

public record CreateAiConversationResponse(AiConversationResponse conversation,
        AiMessageResponse message, List<AiSourceResponse> sources) {
    public CreateAiConversationResponse {
        sources = List.copyOf(sources);
    }
}
```

## src/main/java/com/kbase/ai/dto/response/DocumentAiIndexResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/dto/response/DocumentAiIndexResponse.java)

```java
package com.kbase.ai.dto.response;

import java.time.Instant;
import java.util.UUID;

import com.kbase.ai.enums.DocumentAiIndexStatus;
import com.kbase.ai.service.DocumentAiIndexStatusView;

public record DocumentAiIndexResponse(UUID documentId, DocumentAiIndexStatus status,
        String failureReason, Instant indexedAt, boolean retryAllowed) {

    public static DocumentAiIndexResponse from(DocumentAiIndexStatusView view) {
        return new DocumentAiIndexResponse(view.documentId(), view.status(),
                view.failureReason(), view.indexedAt(),
                view.status() == DocumentAiIndexStatus.FAILED);
    }
}
```

## src/main/java/com/kbase/ai/dto/response/GuideQueryResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/dto/response/GuideQueryResponse.java)

```java
package com.kbase.ai.dto.response;

import java.util.List;

import com.kbase.ai.enums.AiAnswerType;

public record GuideQueryResponse(String answer, AiAnswerType answerType,
        List<GuideSourceResponse> sources) {
    public GuideQueryResponse { sources = sources == null ? List.of() : List.copyOf(sources); }
}
```

## src/main/java/com/kbase/ai/dto/response/GuideSourceResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/dto/response/GuideSourceResponse.java)

```java
package com.kbase.ai.dto.response;

/** Safe citation metadata from the reviewed Guide catalog only. */
public record GuideSourceResponse(String sourceKey, String title, String section) {
}
```

## src/main/java/com/kbase/ai/enums/AiAnswerType.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/enums/AiAnswerType.java)

```java
package com.kbase.ai.enums;

/** Completed assistant answer outcome. */
public enum AiAnswerType {
    GROUNDED,
    NO_EVIDENCE
}
```

## src/main/java/com/kbase/ai/enums/AiGenerationStatus.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/enums/AiGenerationStatus.java)

```java
package com.kbase.ai.enums;

/** Generation lifecycle for an AI message. */
public enum AiGenerationStatus {
    PROCESSING,
    COMPLETED,
    FAILED
}
```

## src/main/java/com/kbase/ai/enums/AiMessageRole.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/enums/AiMessageRole.java)

```java
package com.kbase.ai.enums;

/** Persisted message roles; client/system prompt roles are not stored here. */
public enum AiMessageRole {
    USER,
    ASSISTANT
}
```

## src/main/java/com/kbase/ai/enums/DocumentAiIndexStatus.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/enums/DocumentAiIndexStatus.java)

```java
package com.kbase.ai.enums;

/** Durable lifecycle state for a document's AI index. */
public enum DocumentAiIndexStatus {
    PENDING,
    PROCESSING,
    READY,
    FAILED,
    UNSUPPORTED
}
```

## src/main/java/com/kbase/ai/provider/model/AiChatRole.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/provider/model/AiChatRole.java)

```java
package com.kbase.ai.provider.model;

/** Roles understood by the provider-neutral chat request. */
public enum AiChatRole {
    USER,
    ASSISTANT
}
```

## src/main/java/com/kbase/auth/dto/request/LoginRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/auth/dto/request/LoginRequest.java)

```java
package com.kbase.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Login request. Failure responses never reveal whether the email exists. */
public record LoginRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email address")
        @Size(max = 254, message = "Email must contain at most 254 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Schema(format = "password")
        String password) {
}
```

## src/main/java/com/kbase/auth/dto/request/RegisterRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/auth/dto/request/RegisterRequest.java)

```java
package com.kbase.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Registration request. Clients can never submit role or verification state. */
public record RegisterRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email address")
        @Size(max = 254, message = "Email must contain at most 254 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 64, message = "Password must contain between 8 and 64 characters")
        @Schema(format = "password")
        String password,

        @NotBlank(message = "Display name is required")
        @Size(max = 100, message = "Display name must contain at most 100 characters")
        String displayName) {
}
```

## src/main/java/com/kbase/auth/dto/request/ResendVerificationOtpRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/auth/dto/request/ResendVerificationOtpRequest.java)

```java
package com.kbase.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Resend request for the registration verification OTP. */
public record ResendVerificationOtpRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email address")
        @Size(max = 254, message = "Email must contain at most 254 characters")
        String email) {
}
```

## src/main/java/com/kbase/auth/dto/request/VerifyEmailRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/auth/dto/request/VerifyEmailRequest.java)

```java
package com.kbase.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Email verification request with the 6-digit OTP delivered by email. */
public record VerifyEmailRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email address")
        @Size(max = 254, message = "Email must contain at most 254 characters")
        String email,

        @NotBlank(message = "Verification code is required")
        @Pattern(regexp = "\\d{6}", message = "Verification code must contain 6 digits")
        @Schema(description = "6-digit email verification OTP delivered through Gmail SMTP; used only for "
                + "registration email verification, never returned by the API")
        String otp) {
}
```

## src/main/java/com/kbase/auth/dto/response/AccessTokenResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/auth/dto/response/AccessTokenResponse.java)

```java
package com.kbase.auth.dto.response;

/** New access token issued by the refresh flow. */
public record AccessTokenResponse(
        String accessToken,
        String tokenType,
        long expiresIn) {
}
```

## src/main/java/com/kbase/auth/dto/response/LoginResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/auth/dto/response/LoginResponse.java)

```java
package com.kbase.auth.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Login response. Only the short-lived access token is returned in the body;
 * the refresh token travels exclusively in the HttpOnly cookie.
 */
public record LoginResponse(
        @Schema(description = "JWT access token to send as the Authorization: Bearer header")
        String accessToken,
        String tokenType,
        long expiresIn,
        UserResponse user) {
}
```

## src/main/java/com/kbase/auth/dto/response/RegisterResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/auth/dto/response/RegisterResponse.java)

```java
package com.kbase.auth.dto.response;

import java.time.Instant;
import java.util.UUID;

import com.kbase.user.enums.SystemRole;
import com.kbase.user.enums.UserStatus;

/** Registration result. The account is always created unverified. */
public record RegisterResponse(
        UUID id,
        String email,
        String displayName,
        SystemRole systemRole,
        UserStatus status,
        boolean emailVerified,
        Instant createdAt) {
}
```

## src/main/java/com/kbase/auth/dto/response/UserResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/auth/dto/response/UserResponse.java)

```java
package com.kbase.auth.dto.response;

import java.util.UUID;

import com.kbase.user.enums.SystemRole;
import com.kbase.user.enums.UserStatus;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Safe user projection. Password hash and verification timestamp are never
 * exposed; {@code emailVerified} is the derived API value.
 */
public record UserResponse(
        UUID id,
        String email,
        String displayName,
        SystemRole systemRole,
        UserStatus status,

        @JsonProperty("emailVerified")
        boolean emailVerified) {
}
```

## src/main/java/com/kbase/auth/dto/response/VerifyEmailResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/auth/dto/response/VerifyEmailResponse.java)

```java
package com.kbase.auth.dto.response;

/** Successful email verification result. */
public record VerifyEmailResponse(
        String email,
        boolean emailVerified) {
}
```

## src/main/java/com/kbase/category/dto/request/CreateCategoryRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/category/dto/request/CreateCategoryRequest.java)

```java
package com.kbase.category.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request for a project category. */
public record CreateCategoryRequest(
        @NotBlank(message = "Category name is required")
        @Size(max = 100, message = "Category name must contain at most 100 characters")
        String name) {
}
```

## src/main/java/com/kbase/category/dto/request/UpdateCategoryRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/category/dto/request/UpdateCategoryRequest.java)

```java
package com.kbase.category.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Rename request for a project category. */
public record UpdateCategoryRequest(
        @NotBlank(message = "Category name is required")
        @Size(max = 100, message = "Category name must contain at most 100 characters")
        String name) {
}
```

## src/main/java/com/kbase/category/dto/response/CategoryResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/category/dto/response/CategoryResponse.java)

```java
package com.kbase.category.dto.response;

import java.time.Instant;
import java.util.UUID;

/** Public project category representation. */
public record CategoryResponse(
        UUID id,
        String name,
        Instant createdAt,
        Instant updatedAt) {
}
```

## src/main/java/com/kbase/document/dto/request/DocumentMetadataRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/document/dto/request/DocumentMetadataRequest.java)

```java
package com.kbase.document.dto.request;

import java.util.List;
import java.util.UUID;

/** Optional common metadata supplied with an upload. */
public record DocumentMetadataRequest(
        String displayName,
        String description,
        UUID folderId,
        UUID categoryId,
        List<UUID> tagIds) {
}
```

## src/main/java/com/kbase/document/dto/request/UpdateDocumentRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/document/dto/request/UpdateDocumentRequest.java)

```java
package com.kbase.document.dto.request;

import java.util.List;
import java.util.UUID;

/** Partial metadata update; null tagIds means keep existing tags. */
public record UpdateDocumentRequest(
        String displayName,
        String description,
        UUID folderId,
        UUID categoryId,
        List<UUID> tagIds) {
}
```

## src/main/java/com/kbase/document/dto/response/BatchDocumentUploadResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/document/dto/response/BatchDocumentUploadResponse.java)

```java
package com.kbase.document.dto.response;

import java.util.List;

public record BatchDocumentUploadResponse(List<DocumentResponse> documents) {
}
```

## src/main/java/com/kbase/document/dto/response/DocumentCategoryResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/document/dto/response/DocumentCategoryResponse.java)

```java
package com.kbase.document.dto.response;

import java.util.UUID;

public record DocumentCategoryResponse(UUID id, String name) {
}
```

## src/main/java/com/kbase/document/dto/response/DocumentResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/document/dto/response/DocumentResponse.java)

```java
package com.kbase.document.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.kbase.document.enums.FileKind;

/** Public document metadata. Storage keys intentionally never appear here. */
public record DocumentResponse(
        UUID id, UUID projectId, DocumentUserResponse uploadedBy, UUID folderId,
        DocumentCategoryResponse category, List<DocumentTagResponse> tags,
        String displayName, String originalFilename, FileKind fileKind,
        String extension, String mimeType, long sizeBytes, String description,
        Instant createdAt, Instant updatedAt) {
}
```

## src/main/java/com/kbase/document/dto/response/DocumentSummaryResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/document/dto/response/DocumentSummaryResponse.java)

```java
package com.kbase.document.dto.response;

import java.time.Instant;
import java.util.UUID;

import com.kbase.document.enums.FileKind;

/** Reserved for M12 search/listing; M11 does not expose a list endpoint. */
public record DocumentSummaryResponse(UUID id, String displayName, String originalFilename,
        FileKind fileKind, String extension, String mimeType, long sizeBytes,
        UUID folderId, Instant createdAt, Instant updatedAt) {
}
```

## src/main/java/com/kbase/document/dto/response/DocumentTagResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/document/dto/response/DocumentTagResponse.java)

```java
package com.kbase.document.dto.response;

import java.util.UUID;

public record DocumentTagResponse(UUID id, String name) {
}
```

## src/main/java/com/kbase/document/dto/response/DocumentUserResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/document/dto/response/DocumentUserResponse.java)

```java
package com.kbase.document.dto.response;

import java.util.UUID;

public record DocumentUserResponse(UUID id, String displayName) {
}
```

## src/main/java/com/kbase/document/enums/FileKind.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/document/enums/FileKind.java)

```java
package com.kbase.document.enums;

/** Broad file category used by document validation and search. */
public enum FileKind {
    DOCUMENT,
    IMAGE,
    VIDEO
}
```

## src/main/java/com/kbase/folder/dto/request/CreateFolderRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/folder/dto/request/CreateFolderRequest.java)

```java
package com.kbase.folder.dto.request;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request for a project folder at root level or below an existing parent. */
public record CreateFolderRequest(
        @NotBlank(message = "Folder name is required")
        @Size(max = 150, message = "Folder name must contain at most 150 characters")
        String name,
        UUID parentId) {
}
```

## src/main/java/com/kbase/folder/dto/request/UpdateFolderRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/folder/dto/request/UpdateFolderRequest.java)

```java
package com.kbase.folder.dto.request;

import java.util.UUID;

import jakarta.validation.constraints.Size;

/**
 * Partial folder update. Setter presence flags distinguish an omitted
 * parentId from an explicit null, which is required when moving a folder to
 * the root level.
 */
public final class UpdateFolderRequest {

    @Size(max = 150, message = "Folder name must contain at most 150 characters")
    private String name;
    private UUID parentId;
    private boolean nameProvided;
    private boolean parentIdProvided;

    public UpdateFolderRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
        this.nameProvided = true;
    }

    public UUID getParentId() {
        return parentId;
    }

    public void setParentId(UUID parentId) {
        this.parentId = parentId;
        this.parentIdProvided = true;
    }

    public String name() {
        return name;
    }

    public UUID parentId() {
        return parentId;
    }

    public boolean nameProvided() {
        return nameProvided;
    }

    public boolean parentIdProvided() {
        return parentIdProvided;
    }
}
```

## src/main/java/com/kbase/folder/dto/response/FolderResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/folder/dto/response/FolderResponse.java)

```java
package com.kbase.folder.dto.response;

import java.time.Instant;
import java.util.UUID;

/** Public project-scoped folder representation. */
public record FolderResponse(
        UUID id,
        UUID projectId,
        UUID parentId,
        String name,
        Instant createdAt,
        Instant updatedAt) {
}
```

## src/main/java/com/kbase/invitation/dto/request/AcceptInvitationRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/invitation/dto/request/AcceptInvitationRequest.java)

```java
package com.kbase.invitation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Accept request carrying the raw invitation token from the email link. */
public record AcceptInvitationRequest(

        @NotBlank(message = "Invitation token is required")
        @Size(max = 512, message = "Invitation token is too long")
        @Schema(description = "Raw invitation token from the invitation email link; separate from the "
                + "registration email-verification OTP")
        String token) {
}
```

## src/main/java/com/kbase/invitation/dto/request/CreateInvitationRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/invitation/dto/request/CreateInvitationRequest.java)

```java
package com.kbase.invitation.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Invitation creation request. The email is normalized before storage. */
public record CreateInvitationRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email address")
        @Size(max = 254, message = "Email must contain at most 254 characters")
        String email) {
}
```

## src/main/java/com/kbase/invitation/dto/response/AcceptInvitationResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/invitation/dto/response/AcceptInvitationResponse.java)

```java
package com.kbase.invitation.dto.response;

import java.time.Instant;
import java.util.UUID;

import com.kbase.project.enums.ProjectRole;

/** Successful acceptance result. */
public record AcceptInvitationResponse(
        UUID projectId,
        UUID membershipId,
        ProjectRole role,
        Instant joinedAt) {
}
```

## src/main/java/com/kbase/invitation/dto/response/InvitationResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/invitation/dto/response/InvitationResponse.java)

```java
package com.kbase.invitation.dto.response;

import java.time.Instant;
import java.util.UUID;

import com.kbase.invitation.enums.InvitationStatus;

/**
 * Invitation representation. The raw invitation token and its hash are never
 * part of this view; the raw token travels only inside the email link.
 */
public record InvitationResponse(
        UUID id,
        UUID projectId,
        String email,
        InvitationStatus status,
        Instant expiresAt,
        Instant createdAt) {
}
```

## src/main/java/com/kbase/invitation/enums/InvitationStatus.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/invitation/enums/InvitationStatus.java)

```java
package com.kbase.invitation.enums;

/** Lifecycle status of an email invitation. */
public enum InvitationStatus {
    PENDING,
    ACCEPTED,
    EXPIRED,
    CANCELLED
}
```

## src/main/java/com/kbase/project/dto/request/CreateProjectRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/project/dto/request/CreateProjectRequest.java)

```java
package com.kbase.project.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Project creation request. The creator becomes the single OWNER. */
public record CreateProjectRequest(

        @NotBlank(message = "Project name is required")
        @Size(max = 150, message = "Project name must contain at most 150 characters")
        String name,

        @Size(max = 2000, message = "Description must contain at most 2000 characters")
        String description) {
}
```

## src/main/java/com/kbase/project/dto/request/UpdateProjectRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/project/dto/request/UpdateProjectRequest.java)

```java
package com.kbase.project.dto.request;

import jakarta.validation.constraints.Size;

/**
 * Partial project update. Fields left null are unchanged; a present-but-blank
 * name is rejected by the service as a validation error.
 */
public record UpdateProjectRequest(

        @Size(max = 150, message = "Project name must contain at most 150 characters")
        String name,

        @Size(max = 2000, message = "Description must contain at most 2000 characters")
        String description) {
}
```

## src/main/java/com/kbase/project/dto/response/ProjectMemberResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/project/dto/response/ProjectMemberResponse.java)

```java
package com.kbase.project.dto.response;

import java.time.Instant;
import java.util.UUID;

import com.kbase.project.enums.ProjectRole;

/** Membership listing entry. Documents ownership is not part of this view. */
public record ProjectMemberResponse(
        UUID membershipId,
        UUID userId,
        String email,
        String displayName,
        ProjectRole role,
        Instant joinedAt) {
}
```

## src/main/java/com/kbase/project/dto/response/ProjectResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/project/dto/response/ProjectResponse.java)

```java
package com.kbase.project.dto.response;

import java.time.Instant;
import java.util.UUID;

import com.kbase.project.enums.ProjectRole;

import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Project representation for the current caller. {@code currentUserRole} is
 * null when an ADMIN accesses the project without membership; no fake role is
 * ever invented.
 */
public record ProjectResponse(
        UUID id,
        String name,

        @Schema(nullable = true)
        String description,

        @JsonInclude(JsonInclude.Include.ALWAYS)
        @Schema(nullable = true, description = "Project role of the caller; null when an ADMIN views the project "
                + "without membership. OWNER and MEMBER are the only project roles.")
        ProjectRole currentUserRole,

        Instant createdAt,
        Instant updatedAt) {
}
```

## src/main/java/com/kbase/project/enums/ProjectRole.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/project/enums/ProjectRole.java)

```java
package com.kbase.project.enums;

/** Role of a user within one project. */
public enum ProjectRole {
    OWNER,
    MEMBER
}
```

## src/main/java/com/kbase/tag/dto/request/CreateTagRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/tag/dto/request/CreateTagRequest.java)

```java
package com.kbase.tag.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request for a project tag. MEMBER may create tags. */
public record CreateTagRequest(
        @NotBlank(message = "Tag name is required")
        @Size(max = 50, message = "Tag name must contain at most 50 characters")
        String name) {
}
```

## src/main/java/com/kbase/tag/dto/request/UpdateTagRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/tag/dto/request/UpdateTagRequest.java)

```java
package com.kbase.tag.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Rename request for a project tag. */
public record UpdateTagRequest(
        @NotBlank(message = "Tag name is required")
        @Size(max = 50, message = "Tag name must contain at most 50 characters")
        String name) {
}
```

## src/main/java/com/kbase/tag/dto/response/TagResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/tag/dto/response/TagResponse.java)

```java
package com.kbase.tag.dto.response;

import java.time.Instant;
import java.util.UUID;

/** Public project tag representation. */
public record TagResponse(
        UUID id,
        String name,
        Instant createdAt) {
}
```

## src/main/java/com/kbase/user/dto/request/ChangePasswordRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/user/dto/request/ChangePasswordRequest.java)

```java
package com.kbase.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Password change request; the current password must be verified first. */
public record ChangePasswordRequest(

        @NotBlank(message = "Current password is required")
        @Schema(format = "password")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @Size(min = 8, max = 64, message = "New password must contain between 8 and 64 characters")
        @Schema(format = "password")
        String newPassword) {
}
```

## src/main/java/com/kbase/user/dto/request/ChangeUserStatusRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/user/dto/request/ChangeUserStatusRequest.java)

```java
package com.kbase.user.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Admin status change request. The status is kept as raw text so that an
 * unknown value maps to {@code INVALID_USER_STATUS} instead of a generic
 * body-binding error.
 */
public record ChangeUserStatusRequest(

        @NotBlank(message = "Status is required")
        String status) {
}
```

## src/main/java/com/kbase/user/dto/request/UpdateProfileRequest.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/user/dto/request/UpdateProfileRequest.java)

```java
package com.kbase.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Profile update request. Only displayName is user-modifiable. */
public record UpdateProfileRequest(

        @NotBlank(message = "Display name is required")
        @Size(max = 100, message = "Display name must contain at most 100 characters")
        String displayName) {
}
```

## src/main/java/com/kbase/user/dto/response/UserResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/user/dto/response/UserResponse.java)

```java
package com.kbase.user.dto.response;

import java.time.Instant;
import java.util.UUID;

import com.kbase.user.enums.SystemRole;
import com.kbase.user.enums.UserStatus;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Safe user profile projection. The password hash is never exposed and
 * {@code emailVerified} is the derived API value of {@code emailVerifiedAt}.
 */
public record UserResponse(
        UUID id,
        String email,
        String displayName,
        SystemRole systemRole,
        UserStatus status,

        @JsonProperty("emailVerified")
        boolean emailVerified,

        Instant createdAt,
        Instant updatedAt) {
}
```

## src/main/java/com/kbase/user/enums/SystemRole.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/user/enums/SystemRole.java)

```java
package com.kbase.user.enums;

/** System-wide role assigned to a user account. */
public enum SystemRole {
    ADMIN,
    USER
}
```

## src/main/java/com/kbase/user/enums/UserStatus.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/user/enums/UserStatus.java)

```java
package com.kbase.user.enums;

/** Lifecycle status of a user account. */
public enum UserStatus {
    ACTIVE,
    DISABLED
}
```
