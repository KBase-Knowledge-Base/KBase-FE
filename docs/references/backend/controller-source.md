# Backend exact source excerpts

Commit: `636ea26469823bc475732d1e0f79f147556d1f63`. Reference only; do not edit these excerpts to change an API.

Use heading search for a Java filename. Public source may contain internal implementation notes; FE only sends documented public fields.

## src/main/java/com/kbase/ai/controller/DocumentAiIndexController.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/controller/DocumentAiIndexController.java)

```java
package com.kbase.ai.controller;

import java.util.UUID;

import com.kbase.ai.dto.response.DocumentAiIndexResponse;
import com.kbase.ai.service.DocumentAiIndexApplicationService;
import com.kbase.config.OpenApiConfig;
import com.kbase.security.service.CurrentUserService;
import com.kbase.shared.response.ApiErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public projection of the existing M5 document-index application boundary. */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/documents/{documentId}/ai-index")
@Tag(name = OpenApiConfig.TAG_AI_DOCUMENT_INDEXING,
        description = "Document AI indexing status and asynchronous FAILED-only retry. Read and modify "
                + "permissions follow the existing Core document policy.")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class DocumentAiIndexController {

    private final DocumentAiIndexApplicationService service;
    private final CurrentUserService currentUser;

    public DocumentAiIndexController(DocumentAiIndexApplicationService service,
            CurrentUserService currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @Operation(summary = "Get document AI index status",
            description = "Requires current project/document read access. Returns PENDING, PROCESSING, "
                    + "READY, FAILED or UNSUPPORTED and only a safe failure reason; no source hash, "
                    + "job state, vector or storage key is exposed.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Safe document index status"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "DOCUMENT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<DocumentAiIndexResponse> status(@PathVariable UUID projectId,
            @PathVariable UUID documentId) {
        return ResponseEntity.ok(DocumentAiIndexResponse.from(service.getStatus(
                projectId, documentId, currentUser.requirePrincipal())));
    }

    @Operation(summary = "Retry failed document AI index asynchronously",
            description = "Only FAILED can be retried. MEMBER uploader, project OWNER or system ADMIN "
                    + "may request a durable retry. The request does not synchronously call the provider.")
    @ApiResponses({
            @ApiResponse(responseCode = "202", description = "Retry accepted; current safe status"),
            @ApiResponse(responseCode = "403", description = "DOCUMENT_MODIFICATION_FORBIDDEN",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "DOCUMENT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "AI_INDEX_RETRY_NOT_ALLOWED",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/retry")
    public ResponseEntity<DocumentAiIndexResponse> retry(@PathVariable UUID projectId,
            @PathVariable UUID documentId) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(DocumentAiIndexResponse.from(
                service.requestManualRetry(projectId, documentId, currentUser.requirePrincipal())));
    }
}
```

## src/main/java/com/kbase/ai/controller/GuideController.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/controller/GuideController.java)

```java
package com.kbase.ai.controller;

import java.util.List;

import com.kbase.ai.dto.request.GuideContextMessage;
import com.kbase.ai.dto.request.GuideQueryRequest;
import com.kbase.ai.dto.response.GuideQueryResponse;
import com.kbase.ai.observability.AiObservability;
import com.kbase.ai.provider.error.AiProviderException;
import com.kbase.ai.provider.model.AiChatMessage;
import com.kbase.ai.retrieval.GuideRagService;
import com.kbase.ai.usage.AiUsageGuard;
import com.kbase.config.OpenApiConfig;
import com.kbase.security.service.CurrentUserService;
import com.kbase.shared.exception.BusinessException;
import com.kbase.shared.exception.ErrorCode;
import com.kbase.shared.response.ApiErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Authenticated, stateless product-help endpoint. It intentionally has no project route. */
@RestController
@RequestMapping("/api/v1/ai/guide")
@Tag(name = OpenApiConfig.TAG_AI_GUIDE, description = "Stateless KBase Guide grounded only in approved product specifications.")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class GuideController {
    private final ObjectProvider<GuideRagService> guide;
    private final CurrentUserService currentUser;
    private final AiUsageGuard usageGuard;
    private final AiObservability observability;

    public GuideController(ObjectProvider<GuideRagService> guide, CurrentUserService currentUser,
            AiUsageGuard usageGuard, AiObservability observability) {
        this.guide = guide;
        this.currentUser = currentUser;
        this.usageGuard = usageGuard;
        this.observability = observability;
    }

    @Operation(summary = "Query the stateless KBase Guide", description = "Accepts only bounded USER/ASSISTANT context; no context is persisted. Retrieval uses only approved Guide sources and unsupported questions return NO_EVIDENCE.")
    @ApiResponses({ @ApiResponse(responseCode = "200", description = "GROUNDED or NO_EVIDENCE response"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "AI_RATE_LIMIT_EXCEEDED", content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "AI_PROVIDER_UNAVAILABLE or AI_USAGE_GUARD_UNAVAILABLE", content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = ApiErrorResponse.class))) })
    @PostMapping("/query")
    public ResponseEntity<GuideQueryResponse> query(@Valid @RequestBody GuideQueryRequest request) {
        long startedAt = System.nanoTime();
        String outcome = "SUCCESS";
        try {
            var principal = currentUser.requirePrincipal(); // authenticated even though Guide has no project scope
            GuideRagService service = guide.getIfAvailable();
            if (service == null) throw new BusinessException(ErrorCode.AI_PROVIDER_UNAVAILABLE);
            usageGuard.consume(principal.getUserId());
            List<AiChatMessage> context = request.context().stream().map(this::context).toList();
            return ResponseEntity.ok(service.answer(request.message(), context));
        } catch (AiProviderException failure) {
            outcome = "PROVIDER_UNAVAILABLE";
            throw new BusinessException(ErrorCode.AI_PROVIDER_UNAVAILABLE);
        } catch (RuntimeException failure) {
            outcome = AiObservability.requestOutcome(failure);
            throw failure;
        } finally {
            observability.recordInteractiveRequest("GUIDE_QUERY", outcome,
                    System.nanoTime() - startedAt);
        }
    }
    private AiChatMessage context(GuideContextMessage turn) { return new AiChatMessage(turn.role(), turn.content()); }
}
```

## src/main/java/com/kbase/ai/controller/ProjectAssistantController.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/controller/ProjectAssistantController.java)

```java
package com.kbase.ai.controller;

import java.util.List;
import java.util.UUID;

import com.kbase.ai.dto.request.CreateAiConversationRequest;
import com.kbase.ai.dto.request.RenameAiConversationRequest;
import com.kbase.ai.dto.request.SendAiMessageRequest;
import com.kbase.ai.dto.response.AiConversationResponse;
import com.kbase.ai.dto.response.AiTurnResponse;
import com.kbase.ai.dto.response.CreateAiConversationResponse;
import com.kbase.ai.service.ProjectAssistantConversationService;
import com.kbase.config.OpenApiConfig;
import com.kbase.security.service.CurrentUserService;
import com.kbase.shared.pagination.PageResponse;
import com.kbase.shared.pagination.PaginationParser;
import com.kbase.shared.response.ApiErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Public, creator-private Project Assistant HTTP boundary. */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/ai/conversations")
@Tag(name = OpenApiConfig.TAG_AI_PROJECT_ASSISTANT,
        description = "Private Project Assistant conversations. Current project access and creator ownership "
                + "are both required; ADMIN project override never bypasses conversation ownership.")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class ProjectAssistantController {

    private static final Sort CONVERSATION_ORDER = Sort.by(Sort.Order.desc("updatedAt"),
            Sort.Order.desc("id"));
    private static final Sort MESSAGE_ORDER = Sort.by(Sort.Order.asc("createdAt"),
            Sort.Order.asc("id"));

    private final ProjectAssistantConversationService service;
    private final CurrentUserService currentUser;
    private final PaginationParser pagination;

    public ProjectAssistantController(ProjectAssistantConversationService service,
            CurrentUserService currentUser, PaginationParser pagination) {
        this.service = service;
        this.currentUser = currentUser;
        this.pagination = pagination;
    }

    @Operation(summary = "Create private conversation with first question",
            description = "Creates only when the first valid message arrives. Maximum five conversations per user "
                    + "and project. Persists USER and ASSISTANT PROCESSING before non-streaming generation. "
                    + "Returns GROUNDED with sources or successful NO_EVIDENCE with no sources. "
                    + "Provider failure leaves the conversation and a safely FAILED assistant message readable.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Conversation and first completed turn"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "AI_CONVERSATION_LIMIT_REACHED",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "AI_RATE_LIMIT_EXCEEDED",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "AI_PROVIDER_UNAVAILABLE or AI_USAGE_GUARD_UNAVAILABLE",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<CreateAiConversationResponse> create(@PathVariable UUID projectId,
            @Valid @RequestBody CreateAiConversationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(projectId,
                currentUser.requirePrincipal(), request.message()));
    }

    @Operation(summary = "List own private conversations",
            description = "Only the current creator's conversations, ordered updatedAt DESC then id DESC. "
                    + "Current project access is required before any conversation query.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paged conversation metadata"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<PageResponse<AiConversationResponse>> list(@PathVariable UUID projectId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        Pageable pageable = pagination.parse(page, size, null, List.of(), CONVERSATION_ORDER);
        return ResponseEntity.ok(service.list(projectId, currentUser.requirePrincipal(), pageable));
    }

    @Operation(summary = "Get own conversation metadata",
            description = "Messages are served by the separate paginated route. Wrong project, missing ID "
                    + "and another creator's ID all return AI_CONVERSATION_NOT_FOUND after project access check.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Conversation metadata"),
            @ApiResponse(responseCode = "404", description = "AI_CONVERSATION_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/{conversationId}")
    public ResponseEntity<AiConversationResponse> get(@PathVariable UUID projectId,
            @PathVariable UUID conversationId) {
        return ResponseEntity.ok(service.get(projectId, conversationId, currentUser.requirePrincipal()));
    }

    @Operation(summary = "Rename own conversation",
            description = "Creator only; trim title, require nonblank and at most 100 Unicode characters. "
                    + "A rename updates the list activity timestamp without provider work.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated conversation metadata"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "AI_CONVERSATION_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PatchMapping("/{conversationId}")
    public ResponseEntity<AiConversationResponse> rename(@PathVariable UUID projectId,
            @PathVariable UUID conversationId,
            @Valid @RequestBody RenameAiConversationRequest request) {
        return ResponseEntity.ok(service.rename(projectId, conversationId,
                currentUser.requirePrincipal(), request.title()));
    }

    @Operation(summary = "Hard delete own conversation",
            description = "Creator only; messages and sources cascade, and the deleted row immediately frees quota.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Conversation removed"),
            @ApiResponse(responseCode = "404", description = "AI_CONVERSATION_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @DeleteMapping("/{conversationId}")
    public ResponseEntity<Void> delete(@PathVariable UUID projectId,
            @PathVariable UUID conversationId) {
        service.delete(projectId, conversationId, currentUser.requirePrincipal());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Send a question to own conversation",
            description = "Persists USER and ASSISTANT PROCESSING atomically before M6 RAG outside the transaction. "
                    + "Only one active generation per conversation; a competing send gets "
                    + "AI_REQUEST_IN_PROGRESS without a second USER message. GROUNDED and NO_EVIDENCE "
                    + "are successful non-streaming outcomes; current access is rechecked before completion.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Completed assistant turn and ordered sources"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "AI_CONVERSATION_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "AI_REQUEST_IN_PROGRESS",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "AI_RATE_LIMIT_EXCEEDED",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "AI_PROVIDER_UNAVAILABLE or AI_USAGE_GUARD_UNAVAILABLE",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<AiTurnResponse> send(@PathVariable UUID projectId,
            @PathVariable UUID conversationId, @Valid @RequestBody SendAiMessageRequest request) {
        return ResponseEntity.ok(service.send(projectId, conversationId,
                currentUser.requirePrincipal(), request.message()));
    }

    @Operation(summary = "List own conversation messages",
            description = "Paged history ordered createdAt ASC then id ASC. Historical sources retain snapshots; "
                    + "deleted document/chunk references are UNAVAILABLE with no usable documentId. "
                    + "Live source opening still uses current Core document authorization. Failed generations "
                    + "show a safe failureCode and no provider text.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paged messages with sources"),
            @ApiResponse(responseCode = "404", description = "AI_CONVERSATION_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<PageResponse<AiTurnResponse>> messages(@PathVariable UUID projectId,
            @PathVariable UUID conversationId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        Pageable pageable = pagination.parse(page, size == null ? 50 : size, null,
                List.of(), MESSAGE_ORDER);
        return ResponseEntity.ok(service.listMessages(projectId, conversationId,
                currentUser.requirePrincipal(), pageable));
    }
}
```

## src/main/java/com/kbase/auth/controller/AuthController.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/auth/controller/AuthController.java)

```java
package com.kbase.auth.controller;

import com.kbase.auth.dto.request.LoginRequest;
import com.kbase.auth.dto.request.RegisterRequest;
import com.kbase.auth.dto.request.ResendVerificationOtpRequest;
import com.kbase.auth.dto.request.VerifyEmailRequest;
import com.kbase.auth.dto.response.AccessTokenResponse;
import com.kbase.auth.dto.response.LoginResponse;
import com.kbase.auth.dto.response.RegisterResponse;
import com.kbase.auth.dto.response.VerifyEmailResponse;
import com.kbase.auth.service.AuthService;
import com.kbase.auth.service.EmailVerificationService;
import com.kbase.config.OpenApiConfig;
import com.kbase.config.properties.RefreshCookieProperties;
import com.kbase.shared.exception.BusinessException;
import com.kbase.shared.exception.ErrorCode;
import com.kbase.shared.response.ApiErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public authentication endpoints. The raw refresh token exists only in the
 * HttpOnly cookie and is never returned in a JSON body or logged.
 */
@Tag(name = OpenApiConfig.TAG_AUTHENTICATION,
        description = "Public authentication. The verification OTP is a Redis-backed 6-digit code sent through "
                + "Gmail SMTP for registration email verification only — not OTP login, MFA or password reset. "
                + "The refresh token is only ever an HttpOnly cookie and never appears in a JSON body.")
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String JSON_ERROR = "application/json";

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;
    private final RefreshCookieProperties refreshCookieProperties;

    public AuthController(
            AuthService authService,
            EmailVerificationService emailVerificationService,
            RefreshCookieProperties refreshCookieProperties) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
        this.refreshCookieProperties = refreshCookieProperties;
    }

    @Operation(summary = "Register account",
            description = "Creates an account with systemRole USER, status ACTIVE and no verified email. "
                    + "A 6-digit verification OTP is stored as short-lived Redis state (TTL 5 minutes by default) "
                    + "and sent to the email through Gmail SMTP. No auto-login; role and verification state are not client-settable.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Account created unverified; verification OTP sent"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR — request fields are invalid",
                    content = @Content(mediaType = JSON_ERROR, schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "EMAIL_ALREADY_EXISTS — the email is already registered",
                    content = @Content(mediaType = JSON_ERROR, schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "EMAIL_SERVICE_UNAVAILABLE — Gmail delivery failed and the "
                    + "registration was rolled back, or OTP_SERVICE_UNAVAILABLE — Redis OTP state is unavailable",
                    content = @Content(mediaType = JSON_ERROR, schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @Operation(summary = "Verify email with OTP",
            description = "Verifies registration email ownership. The OTP is the 6-digit email verification code "
                    + "delivered by Gmail SMTP (baseline: TTL 5 minutes, maximum 5 attempts); the raw OTP is never returned "
                    + "by the API. Success sets the account email as verified and invalidates the Redis OTP state.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Email verified"),
            @ApiResponse(responseCode = "400", description = "INVALID_OTP — wrong code, or OTP_EXPIRED — the pending "
                    + "verification state has expired",
                    content = @Content(mediaType = JSON_ERROR, schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "EMAIL_ALREADY_VERIFIED — the account email is already verified",
                    content = @Content(mediaType = JSON_ERROR, schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "OTP_ATTEMPTS_EXCEEDED — too many wrong attempts",
                    content = @Content(mediaType = JSON_ERROR, schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "OTP_SERVICE_UNAVAILABLE — Redis OTP state is unavailable",
                    content = @Content(mediaType = JSON_ERROR, schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/verify-email")
    public ResponseEntity<VerifyEmailResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        EmailVerificationService.VerifyEmailResult result =
                emailVerificationService.verify(request.email(), request.otp());
        return ResponseEntity.ok(new VerifyEmailResponse(result.email(), result.emailVerified()));
    }

    @Operation(summary = "Resend verification OTP",
            description = "Sends a new verification OTP through Gmail SMTP for an existing, unverified account. "
                    + "A resend cooldown applies (60 seconds by default); the new OTP replaces the previous pending "
                    + "state and resets its TTL and attempt counter. The OTP exists only as protected short-lived Redis state.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "New OTP sent"),
            @ApiResponse(responseCode = "409", description = "EMAIL_ALREADY_VERIFIED — the account email is already verified",
                    content = @Content(mediaType = JSON_ERROR, schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "OTP_RESEND_COOLDOWN — another OTP was requested too recently",
                    content = @Content(mediaType = JSON_ERROR, schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "OTP_SERVICE_UNAVAILABLE — Redis OTP state unavailable, or "
                    + "EMAIL_SERVICE_UNAVAILABLE — Gmail delivery failed",
                    content = @Content(mediaType = JSON_ERROR, schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/resend-verification-otp")
    public ResponseEntity<Void> resendVerificationOtp(
            @Valid @RequestBody ResendVerificationOtpRequest request) {
        emailVerificationService.resend(request.email());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Login",
            description = "Authenticates with email and password. Requires an ACTIVE account with a verified email. "
                    + "Returns a JWT access token for the Authorization: Bearer header; the refresh token is set as an "
                    + "HttpOnly cookie (kbase_refresh_token) and is not part of the JSON response. Credential failures "
                    + "never reveal whether the email exists.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Authenticated; access token in body and refresh cookie in Set-Cookie"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR — request fields are invalid",
                    content = @Content(mediaType = JSON_ERROR, schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "INVALID_CREDENTIALS — unknown email or wrong password",
                    content = @Content(mediaType = JSON_ERROR, schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "EMAIL_NOT_VERIFIED — the email has not been verified, or "
                    + "ACCOUNT_DISABLED — the account is disabled",
                    content = @Content(mediaType = JSON_ERROR, schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthService.LoginResult result = authService.login(request);
        ResponseCookie cookie = refreshCookie(result.rawRefreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new LoginResponse(
                        result.accessToken(),
                        "Bearer",
                        result.expiresInSeconds(),
                        result.user()));
    }

    @Operation(summary = "Refresh access token",
            description = "Issues a new access token from the refresh session. Requires the HttpOnly refresh cookie "
                    + "(kbase_refresh_token); no Bearer access token is used. The session is PostgreSQL-backed "
                    + "(hash-only) and must be unrevoked and unexpired for an ACTIVE verified user. Core v1 does not "
                    + "rotate the refresh token. Because the cookie is HttpOnly and browser-managed, Swagger UI may not "
                    + "be able to call this endpoint outside a same-origin session; that is a tooling limitation, not an API change.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "New access token issued"),
            @ApiResponse(responseCode = "401", description = "REFRESH_TOKEN_MISSING — no refresh cookie, "
                    + "INVALID_REFRESH_TOKEN / REFRESH_TOKEN_EXPIRED / REFRESH_SESSION_REVOKED — the refresh session is unusable",
                    content = @Content(mediaType = JSON_ERROR, schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/refresh")
    public ResponseEntity<AccessTokenResponse> refresh(
            @Parameter(in = ParameterIn.COOKIE, name = "kbase_refresh_token", required = true,
                    description = "HttpOnly refresh cookie set by login; not readable by client scripts")
            @CookieValue(name = "${kbase.refresh-cookie.name}", required = false) String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_MISSING);
        }
        AccessTokenResponse response = authService.refresh(rawRefreshToken);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Logout",
            description = "Revokes the current refresh session and clears the refresh cookie. Effectively idempotent: "
                    + "logout without a valid cookie still returns 204. Access tokens are not blacklisted; an existing "
                    + "access token remains valid until it expires.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Refresh session revoked and cookie cleared; no response body")
    })
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @Parameter(in = ParameterIn.COOKIE, name = "kbase_refresh_token", required = false,
                    description = "Optional HttpOnly refresh cookie identifying the session to revoke")
            @CookieValue(name = "${kbase.refresh-cookie.name}", required = false) String rawRefreshToken) {
        authService.logout(rawRefreshToken);
        ResponseCookie cleared = clearedRefreshCookie();
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cleared.toString())
                .build();
    }

    private ResponseCookie refreshCookie(String rawToken) {
        return ResponseCookie.from(refreshCookieProperties.getName(), rawToken)
                .httpOnly(true)
                .secure(refreshCookieProperties.isSecure())
                .sameSite(refreshCookieProperties.getSameSite())
                .path(refreshCookieProperties.getPath())
                .maxAge(refreshCookieProperties.getMaxAge())
                .build();
    }

    private ResponseCookie clearedRefreshCookie() {
        return ResponseCookie.from(refreshCookieProperties.getName(), "")
                .httpOnly(true)
                .secure(refreshCookieProperties.isSecure())
                .sameSite(refreshCookieProperties.getSameSite())
                .path(refreshCookieProperties.getPath())
                .maxAge(java.time.Duration.ZERO)
                .build();
    }
}
```

## src/main/java/com/kbase/category/controller/CategoryController.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/category/controller/CategoryController.java)

```java
package com.kbase.category.controller;

import java.util.List;
import java.util.UUID;

import com.kbase.config.OpenApiConfig;
import com.kbase.category.dto.request.CreateCategoryRequest;
import com.kbase.category.dto.request.UpdateCategoryRequest;
import com.kbase.category.dto.response.CategoryResponse;
import com.kbase.category.service.CategoryService;
import com.kbase.security.service.CurrentUserService;
import com.kbase.shared.response.ApiErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** REST boundary for project-scoped categories. */
@Tag(name = OpenApiConfig.TAG_CATEGORIES,
        description = "Project-scoped categories. Reading is open to every project member; creating, renaming and "
                + "deleting are OWNER/ADMIN managed.")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
@RestController
@RequestMapping("/api/v1/projects/{projectId}/categories")
public class CategoryController {

    private final CategoryService categoryService;
    private final CurrentUserService currentUserService;

    public CategoryController(CategoryService categoryService, CurrentUserService currentUserService) {
        this.categoryService = categoryService;
        this.currentUserService = currentUserService;
    }

    @Operation(summary = "List categories",
            description = "Access: project MEMBER, OWNER, or system ADMIN.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Categories of the project"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — the caller is not a member of the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> listCategories(@PathVariable UUID projectId) {
        return ResponseEntity.ok(categoryService.listCategories(
                projectId, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Create category",
            description = "OWNER/ADMIN only. Names are unique per project case-insensitively.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Category created"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR — the name is blank or too long",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — caller is not a member, or "
                    + "PROJECT_MANAGEMENT_FORBIDDEN — only OWNER/ADMIN manage categories",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "CATEGORY_NAME_ALREADY_EXISTS — case-insensitive duplicate in the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(
                projectId, request, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Rename category",
            description = "OWNER/ADMIN only. Names are unique per project case-insensitively.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Category renamed"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — caller is not a member, or "
                    + "PROJECT_MANAGEMENT_FORBIDDEN — only OWNER/ADMIN manage categories",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "CATEGORY_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "CATEGORY_NAME_ALREADY_EXISTS — case-insensitive duplicate in the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PatchMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> renameCategory(
            @PathVariable UUID projectId,
            @PathVariable UUID categoryId,
            @Valid @RequestBody UpdateCategoryRequest request) {
        return ResponseEntity.ok(categoryService.renameCategory(
                projectId, categoryId, request, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Delete category",
            description = "OWNER/ADMIN only. A category still used by any document cannot be deleted.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Category deleted; no response body"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — caller is not a member, or "
                    + "PROJECT_MANAGEMENT_FORBIDDEN — only OWNER/ADMIN manage categories",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "CATEGORY_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "CATEGORY_IN_USE — one or more documents still use the category",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable UUID projectId,
            @PathVariable UUID categoryId) {
        categoryService.deleteCategory(projectId, categoryId, currentUserService.requirePrincipal());
        return ResponseEntity.noContent().build();
    }
}
```

## src/main/java/com/kbase/document/controller/DocumentController.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/document/controller/DocumentController.java)

```java
package com.kbase.document.controller;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.kbase.config.OpenApiConfig;
import com.kbase.document.dto.request.DocumentMetadataRequest;
import com.kbase.document.dto.request.UpdateDocumentRequest;
import com.kbase.document.dto.response.BatchDocumentUploadResponse;
import com.kbase.document.dto.response.DocumentResponse;
import com.kbase.document.dto.response.DocumentSummaryResponse;
import com.kbase.document.enums.FileKind;
import com.kbase.document.service.DocumentSearchCriteria;
import com.kbase.document.service.DocumentSearchService;
import com.kbase.document.service.DocumentService;
import com.kbase.document.service.FileDelivery;
import com.kbase.document.service.InvalidRangeException;
import com.kbase.security.service.CurrentUserService;
import com.kbase.shared.pagination.PageResponse;
import com.kbase.shared.pagination.PaginationParser;
import com.kbase.shared.response.ApiErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Authorized document lifecycle and metadata-only search endpoints. */
@Tag(name = OpenApiConfig.TAG_DOCUMENTS,
        description = "Documents live inside projects. Reading requires project membership (MEMBER/OWNER/ADMIN); "
                + "modifying or deleting a document requires being its uploader (MEMBER) or project OWNER/system ADMIN. "
                + "Binaries stream through the backend from private storage; storage keys are never exposed.")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
@RestController
@RequestMapping("/api/v1")
public class DocumentController {
    private static final List<String> SORTABLE_FIELDS =
            List.of("displayName", "createdAt", "updatedAt", "sizeBytes");
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "createdAt");

    private final DocumentService documentService;
    private final DocumentSearchService documentSearchService;
    private final CurrentUserService currentUserService;
    private final PaginationParser paginationParser;

    public DocumentController(DocumentService documentService,
            DocumentSearchService documentSearchService,
            CurrentUserService currentUserService,
            PaginationParser paginationParser) {
        this.documentService = documentService;
        this.documentSearchService = documentSearchService;
        this.currentUserService = currentUserService;
        this.paginationParser = paginationParser;
    }

    @Operation(summary = "Search document metadata",
            description = "Project-scoped, metadata-only search. Access: project MEMBER, OWNER, or system ADMIN. "
                    + "q matches displayName, originalFilename, description and category/tag names; Core v1 searches no "
                    + "file content, transcript or embedding. Sortable fields: displayName, createdAt, updatedAt, "
                    + "sizeBytes (default createdAt,desc).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paged document metadata summaries"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR — an unknown sort field, or "
                    + "INVALID_PARAMETER — a malformed filter or pagination value",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — the caller is not a member of the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/projects/{projectId}/documents")
    public ResponseEntity<PageResponse<DocumentSummaryResponse>> search(
            @PathVariable UUID projectId,
            @Parameter(description = "Case-insensitive metadata text search across display name, original filename, "
                    + "description and category/tag names")
            @RequestParam(name = "q", required = false) String q,
            @Parameter(description = "Filter by containing folder")
            @RequestParam(name = "folderId", required = false) UUID folderId,
            @Parameter(description = "Filter by category")
            @RequestParam(name = "categoryId", required = false) UUID categoryId,
            @Parameter(description = "Filter by tag")
            @RequestParam(name = "tagId", required = false) UUID tagId,
            @Parameter(description = "Filter by file kind")
            @RequestParam(name = "fileKind", required = false) FileKind fileKind,
            @Parameter(description = "Filter by uploader user id")
            @RequestParam(name = "uploadedBy", required = false) UUID uploadedBy,
            @Parameter(description = "ISO-8601 instant lower bound on creation time, e.g. 2026-09-17T00:00:00Z")
            @RequestParam(name = "createdFrom", required = false) Instant createdFrom,
            @Parameter(description = "ISO-8601 instant upper bound on creation time")
            @RequestParam(name = "createdTo", required = false) Instant createdTo,
            @Parameter(description = "Zero-based page index (default 0)")
            @RequestParam(name = "page", required = false) Integer page,
            @Parameter(description = "Page size, 1..100 (default 20)")
            @RequestParam(name = "size", required = false) Integer size,
            @Parameter(description = "Sort as field,direction; allowed fields: displayName, createdAt, updatedAt, sizeBytes")
            @RequestParam(name = "sort", required = false) String sort) {
        Pageable pageable = paginationParser.parse(page, size, sort, SORTABLE_FIELDS, DEFAULT_SORT);
        DocumentSearchCriteria criteria = new DocumentSearchCriteria(q, folderId, categoryId, tagId,
                fileKind, uploadedBy, createdFrom, createdTo);
        return ResponseEntity.ok(documentSearchService.search(
                projectId, criteria, currentUserService.requirePrincipal(), pageable));
    }

    @Operation(summary = "Upload document",
            description = "Uploads one supported file (documents/office up to 50 MB, images up to 20 MB, videos up to "
                    + "500 MB by default; limits are configuration-driven). Requires project membership — any member "
                    + "may upload. The optional metadata JSON part must reference folders, categories and tags of the "
                    + "same project. displayName defaults to the original filename.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Document uploaded and persisted"),
            @ApiResponse(responseCode = "400", description = "FILE_EMPTY — the file has no content, or "
                    + "INVALID_FILE_METADATA — metadata references invalid or cross-project folder/category/tags, or "
                    + "VALIDATION_ERROR — the metadata JSON is malformed",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — the caller is not a member of the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "FOLDER_NOT_FOUND, CATEGORY_NOT_FOUND or TAG_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "413", description = "FILE_TOO_LARGE — the file exceeds the kind-specific size limit",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "415", description = "UNSUPPORTED_FILE_TYPE — the extension is not supported, or "
                    + "MIME_TYPE_MISMATCH — the detected media type contradicts the filename",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "FILE_UPLOAD_FAILED — the upload could not be completed; "
                    + "any partial state is compensated",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "STORAGE_SERVICE_UNAVAILABLE — MinIO is unavailable",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping(value = "/projects/{projectId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> upload(@PathVariable UUID projectId,
            @Parameter(description = "Binary file part")
            @RequestPart("file") MultipartFile file,
            @Parameter(description = "Optional metadata JSON part: displayName, description, folderId, categoryId, tagIds")
            @RequestPart(value = "metadata", required = false) DocumentMetadataRequest metadata) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.upload(
                projectId, file, metadata, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Upload documents in batch",
            description = "Uploads up to 10 files (configurable) with one shared optional metadata part applied to all "
                    + "of them; per-file metadata is not supported. Application-level all-or-fail: on failure uploaded "
                    + "binaries are cleaned up and nothing persists.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "All documents uploaded and persisted"),
            @ApiResponse(responseCode = "400", description = "FILE_EMPTY, INVALID_FILE_METADATA, VALIDATION_ERROR or "
                    + "batch size above the configured maximum",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — the caller is not a member of the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "FOLDER_NOT_FOUND, CATEGORY_NOT_FOUND or TAG_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "413", description = "FILE_TOO_LARGE — a file exceeds its kind-specific size limit",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "415", description = "UNSUPPORTED_FILE_TYPE or MIME_TYPE_MISMATCH",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "FILE_UPLOAD_FAILED — a file could not be uploaded; "
                    + "uploaded binaries are cleaned up",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "STORAGE_SERVICE_UNAVAILABLE — MinIO is unavailable",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping(value = "/projects/{projectId}/documents/batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BatchDocumentUploadResponse> batchUpload(@PathVariable UUID projectId,
            @Parameter(description = "Binary file parts; maximum 10 files (configurable)")
            @RequestPart("files") List<MultipartFile> files,
            @Parameter(description = "Optional metadata JSON part shared by all files")
            @RequestPart(value = "metadata", required = false) DocumentMetadataRequest metadata) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.batchUpload(
                projectId, files, metadata, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Get document metadata",
            description = "Access: project MEMBER, OWNER, or system ADMIN.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document metadata"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — the caller has no access to the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "DOCUMENT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/documents/{documentId}")
    public ResponseEntity<DocumentResponse> getDocument(@PathVariable UUID documentId) {
        return ResponseEntity.ok(documentService.getDocument(documentId, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Update document metadata",
            description = "Renaming changes displayName only, never the storage key. Permissions: MEMBER may update "
                    + "only documents they uploaded; OWNER may update any document in their project; ADMIN has the "
                    + "system-level override. Updating tags replaces the full tag list; a null tagIds keeps existing tags.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Metadata updated"),
            @ApiResponse(responseCode = "400", description = "INVALID_FILE_METADATA — folder/category/tag rules violated",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "DOCUMENT_MODIFICATION_FORBIDDEN — MEMBER is not the uploader",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "DOCUMENT_NOT_FOUND, FOLDER_NOT_FOUND, CATEGORY_NOT_FOUND or TAG_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PatchMapping("/documents/{documentId}")
    public ResponseEntity<DocumentResponse> updateDocument(@PathVariable UUID documentId,
            @RequestBody UpdateDocumentRequest request) {
        return ResponseEntity.ok(documentService.updateMetadata(
                documentId, request, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Download document",
            description = "Streams the binary as an attachment (Content-Disposition: attachment, filename from "
                    + "displayName). Access: project MEMBER, OWNER, or system ADMIN. The actual Content-Type is the "
                    + "stored MIME type of the file; the storage bucket stays private and no storage key is exposed.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Binary attachment stream",
                    content = @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE,
                            schema = @Schema(type = "string", format = "binary")),
                    headers = @Header(name = "Content-Disposition", description = "attachment; filename from displayName")),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — the caller has no access to the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "DOCUMENT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "STORAGE_SERVICE_UNAVAILABLE — MinIO is unavailable",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/documents/{documentId}/download")
    public ResponseEntity<InputStreamResource> download(@PathVariable UUID documentId) {
        return stream(documentService.download(documentId, currentUserService.requirePrincipal()), false);
    }

    @Operation(summary = "Preview document",
            description = "Streams the binary inline (Content-Disposition: inline, filename from displayName) for "
                    + "previewable kinds: PDF, images, TXT, MD and MP4. Office files return 415 PREVIEW_NOT_SUPPORTED. "
                    + "MP4 previews accept a single HTTP Range header; a satisfiable range returns 206 Partial Content "
                    + "with Content-Range, and an unsatisfiable range returns 416 with Content-Range: bytes */total. "
                    + "Access: project MEMBER, OWNER, or system ADMIN.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Full inline preview stream",
                    content = @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE,
                            schema = @Schema(type = "string", format = "binary")),
                    headers = @Header(name = "Content-Disposition", description = "inline; filename from displayName")),
            @ApiResponse(responseCode = "206", description = "Partial content for a satisfiable single byte range (MP4)",
                    content = @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE,
                            schema = @Schema(type = "string", format = "binary")),
                    headers = @Header(name = "Content-Range", description = "bytes <start>-<end>/<total>")),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — the caller has no access to the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "DOCUMENT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "415", description = "PREVIEW_NOT_SUPPORTED — the file kind has no browser preview",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "416", description = "Requested range not satisfiable; no body",
                    headers = @Header(name = "Content-Range", description = "bytes */<total>")),
            @ApiResponse(responseCode = "503", description = "STORAGE_SERVICE_UNAVAILABLE — MinIO is unavailable",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/documents/{documentId}/preview")
    public ResponseEntity<?> preview(@PathVariable UUID documentId,
            @Parameter(in = ParameterIn.HEADER, name = "Range", required = false,
                    description = "Optional single byte range for MP4 preview, e.g. bytes=0-1048575")
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String range) {
        try {
            return stream(documentService.preview(documentId, currentUserService.requirePrincipal(), range), true);
        } catch (InvalidRangeException exception) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    .header(HttpHeaders.CONTENT_RANGE, "bytes */" + exception.totalLength()).build();
        }
    }

    @Operation(summary = "Delete document",
            description = "Hard delete, storage-first: the MinIO object is deleted before the database row and tag "
                    + "assignments cascade. Permissions: MEMBER may delete only documents they uploaded; OWNER may "
                    + "delete any document in their project; ADMIN has the system-level override.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Document and binary deleted; no response body"),
            @ApiResponse(responseCode = "403", description = "DOCUMENT_MODIFICATION_FORBIDDEN — MEMBER is not the uploader",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "DOCUMENT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "DOCUMENT_DELETE_FAILED — the deletion could not complete",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "STORAGE_SERVICE_UNAVAILABLE — MinIO is unavailable, so nothing was deleted",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @DeleteMapping("/documents/{documentId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable UUID documentId) {
        documentService.delete(documentId, currentUserService.requirePrincipal());
        return ResponseEntity.noContent().build();
    }

    /**
     * A Resource response keeps the storage input stream on the response path;
     * it is deliberately not converted into a byte array. Spring MVC's resource
     * writer closes the input after the response body has been written.
     */
    private static ResponseEntity<InputStreamResource> stream(FileDelivery delivery, boolean inline) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(delivery.mimeType()));
        headers.setContentLength(delivery.contentLength());
        headers.setContentDisposition((inline ? ContentDisposition.inline() : ContentDisposition.attachment())
                .filename(delivery.filename(), java.nio.charset.StandardCharsets.UTF_8).build());
        if (inline && "video/mp4".equals(delivery.mimeType())) headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
        HttpStatus status = delivery.partial() ? HttpStatus.PARTIAL_CONTENT : HttpStatus.OK;
        if (delivery.partial()) headers.set(HttpHeaders.CONTENT_RANGE,
                "bytes %d-%d/%d".formatted(delivery.rangeStart(), delivery.rangeEnd(), delivery.totalLength()));
        return new ResponseEntity<>(new InputStreamResource(delivery.inputStream()), headers, status);
    }
}
```

## src/main/java/com/kbase/folder/controller/FolderController.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/folder/controller/FolderController.java)

```java
package com.kbase.folder.controller;

import java.util.List;
import java.util.UUID;

import com.kbase.config.OpenApiConfig;
import com.kbase.folder.dto.request.CreateFolderRequest;
import com.kbase.folder.dto.request.UpdateFolderRequest;
import com.kbase.folder.dto.response.FolderResponse;
import com.kbase.folder.service.FolderService;
import com.kbase.security.service.CurrentUserService;
import com.kbase.shared.response.ApiErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** REST boundary for project-scoped folder hierarchy. */
@Tag(name = OpenApiConfig.TAG_FOLDERS,
        description = "Project-scoped folder hierarchy. Reading is open to every project member; creating, "
                + "renaming and moving are OWNER/ADMIN managed.")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
@RestController
@RequestMapping("/api/v1/projects/{projectId}/folders")
public class FolderController {

    private final FolderService folderService;
    private final CurrentUserService currentUserService;

    public FolderController(FolderService folderService, CurrentUserService currentUserService) {
        this.folderService = folderService;
        this.currentUserService = currentUserService;
    }

    @Operation(summary = "List folders",
            description = "Access: project MEMBER, OWNER, or system ADMIN. Returns the project's folder tree flattened; "
                    + "with parentId it returns that folder's children.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Folders of the project or of the requested parent"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — the caller is not a member of the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND or PARENT_FOLDER_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<FolderResponse>> listFolders(
            @PathVariable UUID projectId,
            @Parameter(description = "Optional parent folder id; omit to start from the root level")
            @RequestParam(name = "parentId", required = false) UUID parentId) {
        return ResponseEntity.ok(folderService.listFolders(
                projectId, parentId, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Create folder",
            description = "Creates a root or nested folder. OWNER/ADMIN only. The parent must belong to the same "
                    + "project and sibling names are unique case-insensitively.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Folder created"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR — the name is blank or too long",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — caller is not a member, or "
                    + "PROJECT_MANAGEMENT_FORBIDDEN — only OWNER/ADMIN manage folders",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND or PARENT_FOLDER_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "FOLDER_NAME_ALREADY_EXISTS — a case-insensitive sibling with this name exists",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<FolderResponse> createFolder(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateFolderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(folderService.createFolder(
                projectId, request, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Rename or move folder",
            description = "OWNER/ADMIN only. The new parent must belong to the same project, must not be the folder "
                    + "itself or one of its descendants (no cycles), and the target sibling name must be unique "
                    + "case-insensitively excluding the folder itself.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Folder renamed or moved"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — caller is not a member, or "
                    + "PROJECT_MANAGEMENT_FORBIDDEN — only OWNER/ADMIN manage folders",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "FOLDER_NOT_FOUND or PARENT_FOLDER_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "FOLDER_CYCLE_DETECTED — moving into itself/descendant, or "
                    + "FOLDER_NAME_ALREADY_EXISTS — duplicate case-insensitive sibling",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PatchMapping("/{folderId}")
    public ResponseEntity<FolderResponse> updateFolder(
            @PathVariable UUID projectId,
            @PathVariable UUID folderId,
            @Valid @RequestBody UpdateFolderRequest request) {
        return ResponseEntity.ok(folderService.updateFolder(
                projectId, folderId, request, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Delete folder",
            description = "OWNER/ADMIN only. Only an empty folder (no child folders, no documents) can be deleted.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Folder deleted; no response body"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — caller is not a member, or "
                    + "PROJECT_MANAGEMENT_FORBIDDEN — only OWNER/ADMIN manage folders",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "FOLDER_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "FOLDER_NOT_EMPTY — the folder still contains subfolders or documents",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @DeleteMapping("/{folderId}")
    public ResponseEntity<Void> deleteFolder(
            @PathVariable UUID projectId,
            @PathVariable UUID folderId) {
        folderService.deleteFolder(projectId, folderId, currentUserService.requirePrincipal());
        return ResponseEntity.noContent().build();
    }
}
```

## src/main/java/com/kbase/invitation/controller/InvitationAcceptController.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/invitation/controller/InvitationAcceptController.java)

```java
package com.kbase.invitation.controller;

import com.kbase.config.OpenApiConfig;
import com.kbase.invitation.dto.request.AcceptInvitationRequest;
import com.kbase.invitation.dto.response.AcceptInvitationResponse;
import com.kbase.invitation.service.InvitationService;
import com.kbase.security.service.CurrentUserService;
import com.kbase.shared.response.ApiErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authenticated invitation acceptance. The raw token arrives from the email
 * link; the acceptance never uses OTP and runs under a pessimistic lock.
 */
@Tag(name = OpenApiConfig.TAG_INVITATIONS,
        description = "Accepting a project invitation with the raw token from the invitation email link. "
                + "The invitation token is separate from the registration email-verification OTP.")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
@RestController
@RequestMapping("/api/v1/invitations")
public class InvitationAcceptController {

    private final InvitationService invitationService;
    private final CurrentUserService currentUserService;

    public InvitationAcceptController(InvitationService invitationService,
            CurrentUserService currentUserService) {
        this.invitationService = invitationService;
        this.currentUserService = currentUserService;
    }

    @Operation(summary = "Accept project invitation",
            description = "Authenticated ACTIVE user required; their normalized account email must equal the "
                    + "invitation email. The invitation must be PENDING and not expired. Creates a MEMBER membership "
                    + "and marks the invitation ACCEPTED. Concurrent accepts are serialized so only one succeeds.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Invitation accepted; MEMBER membership created"),
            @ApiResponse(responseCode = "403", description = "INVITATION_EMAIL_MISMATCH — the account email differs from the invitation email",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "INVITATION_NOT_FOUND — the token does not match any invitation",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "INVITATION_NOT_PENDING — already accepted or cancelled, "
                    + "INVITATION_EXPIRED — past the expiry, or PROJECT_MEMBER_ALREADY_EXISTS — already a member",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/accept")
    public ResponseEntity<AcceptInvitationResponse> accept(
            @Valid @RequestBody AcceptInvitationRequest request) {
        return ResponseEntity.ok(invitationService.accept(
                request.token(), currentUserService.requirePrincipal()));
    }
}
```

## src/main/java/com/kbase/invitation/controller/InvitationController.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/invitation/controller/InvitationController.java)

```java
package com.kbase.invitation.controller;

import java.util.List;
import java.util.UUID;

import com.kbase.config.OpenApiConfig;
import com.kbase.invitation.dto.request.CreateInvitationRequest;
import com.kbase.invitation.dto.response.InvitationResponse;
import com.kbase.invitation.enums.InvitationStatus;
import com.kbase.invitation.service.InvitationService;
import com.kbase.security.service.CurrentUserService;
import com.kbase.shared.pagination.PageResponse;
import com.kbase.shared.pagination.PaginationParser;
import com.kbase.shared.response.ApiErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Project invitation management endpoints. OWNER/ADMIN enforced in service. */
@Tag(name = OpenApiConfig.TAG_PROJECT_INVITATIONS,
        description = "Invitations are OWNER/ADMIN managed and use a separate secure invitation token sent by email "
                + "(never the registration OTP); the raw token travels only inside the email link and PostgreSQL keeps "
                + "only its hash. Expiration is 72h by default and configurable.")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
@RestController
@RequestMapping("/api/v1/projects/{projectId}/invitations")
public class InvitationController {

    private static final List<String> SORTABLE_FIELDS =
            List.of("createdAt", "email", "status", "expiresAt");
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "createdAt");

    private final InvitationService invitationService;
    private final CurrentUserService currentUserService;
    private final PaginationParser paginationParser;

    public InvitationController(
            InvitationService invitationService,
            CurrentUserService currentUserService,
            PaginationParser paginationParser) {
        this.invitationService = invitationService;
        this.currentUserService = currentUserService;
        this.paginationParser = paginationParser;
    }

    @Operation(summary = "Create project invitation",
            description = "Sends an invitation email with a secure invitation link to the address. Requires the "
                    + "project OWNER or system ADMIN. The email must belong to an existing registered account and not "
                    + "already be a member; only one PENDING invitation may exist per project and email. The response "
                    + "and database never contain the raw token or its hash.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "PENDING invitation created and emailed"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR — the email is invalid",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "PROJECT_MANAGEMENT_FORBIDDEN — only OWNER/ADMIN manage invitations",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "USER_NOT_FOUND — no registered account uses that email",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "PROJECT_MEMBER_ALREADY_EXISTS — the email is already a member, or "
                    + "INVITATION_ALREADY_PENDING — a pending invitation exists for this email",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "EMAIL_SERVICE_UNAVAILABLE — Gmail delivery failed and the "
                    + "invitation was rolled back",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<InvitationResponse> createInvitation(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateInvitationRequest request) {
        InvitationResponse response = invitationService.createInvitation(
                projectId, request, currentUserService.requirePrincipal());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "List project invitations",
            description = "Requires the project OWNER or system ADMIN. "
                    + "Sortable fields: createdAt, email, status, expiresAt (default createdAt,desc).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paged invitations"),
            @ApiResponse(responseCode = "403", description = "PROJECT_MANAGEMENT_FORBIDDEN — only OWNER/ADMIN manage invitations",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<PageResponse<InvitationResponse>> listInvitations(
            @PathVariable UUID projectId,
            @Parameter(description = "Filter by invitation status")
            @RequestParam(name = "status", required = false) InvitationStatus status,
            @Parameter(description = "Zero-based page index (default 0)")
            @RequestParam(name = "page", required = false) Integer page,
            @Parameter(description = "Page size, 1..100 (default 20)")
            @RequestParam(name = "size", required = false) Integer size,
            @Parameter(description = "Sort as field,direction; allowed fields: createdAt, email, status, expiresAt")
            @RequestParam(name = "sort", required = false) String sort) {
        Pageable pageable = paginationParser.parse(page, size, sort, SORTABLE_FIELDS, DEFAULT_SORT);
        return ResponseEntity.ok(invitationService.listInvitations(
                projectId, status, currentUserService.requirePrincipal(), pageable));
    }

    @Operation(summary = "Resend invitation",
            description = "Requires the project OWNER or system ADMIN. Issues a new invitation token, invalidates the "
                    + "old link, resets the expiry and re-sends the email.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "New token issued and emailed"),
            @ApiResponse(responseCode = "403", description = "PROJECT_MANAGEMENT_FORBIDDEN — only OWNER/ADMIN manage invitations",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "INVITATION_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "INVITATION_NOT_PENDING — the invitation was cancelled or already accepted",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "EMAIL_SERVICE_UNAVAILABLE — Gmail delivery failed",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/{invitationId}/resend")
    public ResponseEntity<InvitationResponse> resendInvitation(
            @PathVariable UUID projectId,
            @PathVariable UUID invitationId) {
        return ResponseEntity.ok(invitationService.resend(
                projectId, invitationId, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Cancel invitation",
            description = "Requires the project OWNER or system ADMIN. Marks a PENDING invitation CANCELLED; the row "
                    + "is kept and the link stops working.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Invitation cancelled; no response body"),
            @ApiResponse(responseCode = "403", description = "PROJECT_MANAGEMENT_FORBIDDEN — only OWNER/ADMIN manage invitations",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "INVITATION_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "INVITATION_NOT_PENDING — the invitation was already cancelled or accepted",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @DeleteMapping("/{invitationId}")
    public ResponseEntity<Void> cancelInvitation(
            @PathVariable UUID projectId,
            @PathVariable UUID invitationId) {
        invitationService.cancel(projectId, invitationId, currentUserService.requirePrincipal());
        return ResponseEntity.noContent().build();
    }
}
```

## src/main/java/com/kbase/project/controller/AdminProjectController.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/project/controller/AdminProjectController.java)

```java
package com.kbase.project.controller;

import java.util.List;
import java.util.UUID;

import com.kbase.config.OpenApiConfig;
import com.kbase.project.dto.response.ProjectResponse;
import com.kbase.project.service.ProjectService;
import com.kbase.shared.pagination.PageResponse;
import com.kbase.shared.pagination.PaginationParser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Admin project listing. Route protection (ADMIN) lives in SecurityConfig. */
@Tag(name = OpenApiConfig.TAG_ADMIN_PROJECTS,
        description = "System-wide project listing. Requires SystemRole.ADMIN.")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
@RestController
@RequestMapping("/api/v1/admin/projects")
public class AdminProjectController {

    private static final List<String> SORTABLE_FIELDS =
            List.of("name", "createdAt", "updatedAt");
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "createdAt");

    private final ProjectService projectService;
    private final PaginationParser paginationParser;

    public AdminProjectController(ProjectService projectService, PaginationParser paginationParser) {
        this.projectService = projectService;
        this.paginationParser = paginationParser;
    }

    @Operation(summary = "List all projects",
            description = "Requires SystemRole.ADMIN. Lists every project in the system with owner filtering. "
                    + "Memberships of the calling ADMIN are not implied; currentUserRole stays null for projects the "
                    + "ADMIN is not a member of. Sortable fields: name, createdAt, updatedAt (default createdAt,desc).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paged projects")
    })
    @GetMapping
    public ResponseEntity<PageResponse<ProjectResponse>> listAllProjects(
            @Parameter(description = "Case-insensitive search across project name")
            @RequestParam(name = "q", required = false) String q,
            @Parameter(description = "Filter by the OWNER membership user id")
            @RequestParam(name = "ownerId", required = false) UUID ownerId,
            @Parameter(description = "Zero-based page index (default 0)")
            @RequestParam(name = "page", required = false) Integer page,
            @Parameter(description = "Page size, 1..100 (default 20)")
            @RequestParam(name = "size", required = false) Integer size,
            @Parameter(description = "Sort as field,direction; allowed fields: name, createdAt, updatedAt")
            @RequestParam(name = "sort", required = false) String sort) {
        Pageable pageable = paginationParser.parse(page, size, sort, SORTABLE_FIELDS, DEFAULT_SORT);
        return ResponseEntity.ok(projectService.adminListProjects(q, ownerId, pageable));
    }
}
```

## src/main/java/com/kbase/project/controller/ProjectController.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/project/controller/ProjectController.java)

```java
package com.kbase.project.controller;

import java.util.List;
import java.util.UUID;

import com.kbase.config.OpenApiConfig;
import com.kbase.project.dto.request.CreateProjectRequest;
import com.kbase.project.dto.request.UpdateProjectRequest;
import com.kbase.project.dto.response.ProjectResponse;
import com.kbase.project.enums.ProjectRole;
import com.kbase.project.service.ProjectService;
import com.kbase.security.service.CurrentUserService;
import com.kbase.shared.pagination.PageResponse;
import com.kbase.shared.pagination.PaginationParser;
import com.kbase.shared.response.ApiErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Project APIs for the current user. Listing is strictly membership-scoped;
 * ADMIN sees all projects only through the separate admin endpoint.
 */
@Tag(name = OpenApiConfig.TAG_PROJECTS,
        description = "Projects of the current user. Listing is membership-only even for ADMIN; "
                + "project roles are OWNER (exactly one per project) and MEMBER, never stored in the JWT.")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private static final List<String> SORTABLE_FIELDS =
            List.of("name", "createdAt", "updatedAt");
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "createdAt");

    private final ProjectService projectService;
    private final CurrentUserService currentUserService;
    private final PaginationParser paginationParser;

    public ProjectController(
            ProjectService projectService,
            CurrentUserService currentUserService,
            PaginationParser paginationParser) {
        this.projectService = projectService;
        this.currentUserService = currentUserService;
        this.paginationParser = paginationParser;
    }

    @Operation(summary = "Create project",
            description = "Creates the project and the single OWNER membership for the creator in one transaction. "
                    + "Ownership transfer does not exist in Core v1.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Project created; the creator is its OWNER"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR — name or description is invalid",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody CreateProjectRequest request) {
        ProjectResponse response = projectService.createProject(
                currentUserService.requireUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "List my projects",
            description = "Returns only the projects the caller currently belongs to. ADMIN behaves the same as any "
                    + "other user here; the system-wide listing is GET /api/v1/admin/projects. "
                    + "Sortable fields: name, createdAt, updatedAt (default createdAt,desc).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paged joined projects")
    })
    @GetMapping
    public ResponseEntity<PageResponse<ProjectResponse>> listMyProjects(
            @Parameter(description = "Case-insensitive search across project name")
            @RequestParam(name = "q", required = false) String q,
            @Parameter(description = "Filter by the caller's membership role (OWNER or MEMBER)")
            @RequestParam(name = "role", required = false) ProjectRole role,
            @Parameter(description = "Zero-based page index (default 0)")
            @RequestParam(name = "page", required = false) Integer page,
            @Parameter(description = "Page size, 1..100 (default 20)")
            @RequestParam(name = "size", required = false) Integer size,
            @Parameter(description = "Sort as field,direction; allowed fields: name, createdAt, updatedAt")
            @RequestParam(name = "sort", required = false) String sort) {
        Pageable pageable = paginationParser.parse(page, size, sort, SORTABLE_FIELDS, DEFAULT_SORT);
        return ResponseEntity.ok(projectService.listMyProjects(
                currentUserService.requireUserId(), role, q, pageable));
    }

    @Operation(summary = "Get project",
            description = "Access: project MEMBER, OWNER, or system ADMIN. currentUserRole is null when an ADMIN "
                    + "views a project they are not a member of; no ADMIN project role is invented.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Project details"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — the caller is not a member of the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable UUID projectId) {
        return ResponseEntity.ok(projectService.getProject(
                projectId, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Update project",
            description = "Updates name and/or description. Requires the project OWNER or system ADMIN.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Project updated"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR — a present-but-blank name is rejected",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "PROJECT_MANAGEMENT_FORBIDDEN — the caller is neither OWNER nor ADMIN",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PatchMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable UUID projectId,
            @Valid @RequestBody UpdateProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(
                projectId, request, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Delete project",
            description = "Hard delete, storage-first: all MinIO objects of the project are deleted before the "
                    + "database rows cascade. If storage deletion fails, the project is not deleted. "
                    + "Requires the project OWNER or system ADMIN.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Project and all its binaries deleted; no response body"),
            @ApiResponse(responseCode = "403", description = "PROJECT_MANAGEMENT_FORBIDDEN — the caller is neither OWNER nor ADMIN",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "PROJECT_DELETE_FAILED — the deletion could not complete",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "STORAGE_SERVICE_UNAVAILABLE — MinIO is unavailable, so nothing was deleted",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID projectId) {
        projectService.deleteProject(projectId, currentUserService.requirePrincipal());
        return ResponseEntity.noContent().build();
    }
}
```

## src/main/java/com/kbase/project/controller/ProjectMemberController.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/project/controller/ProjectMemberController.java)

```java
package com.kbase.project.controller;

import java.util.List;
import java.util.UUID;

import com.kbase.config.OpenApiConfig;
import com.kbase.project.dto.response.ProjectMemberResponse;
import com.kbase.project.service.ProjectMemberService;
import com.kbase.security.service.CurrentUserService;
import com.kbase.shared.pagination.PageResponse;
import com.kbase.shared.pagination.PaginationParser;
import com.kbase.shared.response.ApiErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Project membership APIs. Removal requires OWNER/ADMIN; leaving requires a
 * non-OWNER membership. Uploaded documents are never deleted here.
 */
@Tag(name = OpenApiConfig.TAG_PROJECT_MEMBERS,
        description = "Project membership. Removing a member never deletes their uploaded documents; the project "
                + "OWNER cannot be removed or leave.")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
@RestController
@RequestMapping("/api/v1/projects/{projectId}/members")
public class ProjectMemberController {

    private static final List<String> SORTABLE_FIELDS =
            List.of("joinedAt", "email", "displayName");
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.ASC, "joinedAt");

    private final ProjectMemberService projectMemberService;
    private final CurrentUserService currentUserService;
    private final PaginationParser paginationParser;

    public ProjectMemberController(
            ProjectMemberService projectMemberService,
            CurrentUserService currentUserService,
            PaginationParser paginationParser) {
        this.projectMemberService = projectMemberService;
        this.currentUserService = currentUserService;
        this.paginationParser = paginationParser;
    }

    @Operation(summary = "List project members",
            description = "Access: project MEMBER, OWNER, or system ADMIN. "
                    + "Sortable fields: joinedAt, email, displayName (default joinedAt,asc).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paged members"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — the caller is not a member of the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<PageResponse<ProjectMemberResponse>> listMembers(
            @PathVariable UUID projectId,
            @Parameter(description = "Zero-based page index (default 0)")
            @RequestParam(name = "page", required = false) Integer page,
            @Parameter(description = "Page size, 1..100 (default 20)")
            @RequestParam(name = "size", required = false) Integer size,
            @Parameter(description = "Sort as field,direction; allowed fields: joinedAt, email, displayName")
            @RequestParam(name = "sort", required = false) String sort) {
        Pageable pageable = paginationParser.parse(page, size, sort, SORTABLE_FIELDS, DEFAULT_SORT);
        return ResponseEntity.ok(projectMemberService.listMembers(
                projectId, currentUserService.requirePrincipal(), pageable));
    }

    /** Literal path wins over {@code {userId}}; OWNER leaving is rejected. */
    @Operation(summary = "Leave project",
            description = "A MEMBER leaves their own membership. The project OWNER cannot leave in Core v1. "
                    + "Documents uploaded by the member remain in the project with their original uploader reference.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Membership removed; documents remain; no response body"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — the caller is not a member of the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "OWNER_CANNOT_LEAVE_PROJECT — the project OWNER cannot leave",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @DeleteMapping("/me")
    public ResponseEntity<Void> leaveProject(@PathVariable UUID projectId) {
        projectMemberService.leaveProject(projectId, currentUserService.requirePrincipal());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Remove project member",
            description = "Removes a MEMBER from the project. Requires the project OWNER or system ADMIN; the project "
                    + "OWNER cannot be removed, even by an ADMIN. Removed members immediately lose project access, "
                    + "but their uploaded documents remain.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Member removed; documents remain; no response body"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — caller is not a member, or "
                    + "PROJECT_MANAGEMENT_FORBIDDEN — only OWNER/ADMIN may remove members",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND or PROJECT_MEMBER_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "PROJECT_OWNER_REMOVAL_FORBIDDEN — the project OWNER cannot be removed",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID projectId,
            @PathVariable UUID userId) {
        projectMemberService.removeMember(
                projectId, userId, currentUserService.requirePrincipal());
        return ResponseEntity.noContent().build();
    }
}
```

## src/main/java/com/kbase/tag/controller/TagController.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/tag/controller/TagController.java)

```java
package com.kbase.tag.controller;

import java.util.List;
import java.util.UUID;

import com.kbase.config.OpenApiConfig;
import com.kbase.security.service.CurrentUserService;
import com.kbase.shared.response.ApiErrorResponse;
import com.kbase.tag.dto.request.CreateTagRequest;
import com.kbase.tag.dto.request.UpdateTagRequest;
import com.kbase.tag.dto.response.TagResponse;
import com.kbase.tag.service.TagService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** REST boundary for project-scoped tags. */
@Tag(name = OpenApiConfig.TAG_TAGS,
        description = "Project-scoped shared tags. Any project member may create and read tags; renaming and "
                + "deleting are OWNER/ADMIN managed. Deleting a tag only removes its document assignments, never documents.")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
@RestController
@RequestMapping("/api/v1/projects/{projectId}/tags")
public class TagController {

    private final TagService tagService;
    private final CurrentUserService currentUserService;

    public TagController(TagService tagService, CurrentUserService currentUserService) {
        this.tagService = tagService;
        this.currentUserService = currentUserService;
    }

    @Operation(summary = "List tags",
            description = "Access: project MEMBER, OWNER, or system ADMIN. With q, filters by case-insensitive name substring.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tags of the project"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — the caller is not a member of the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<TagResponse>> listTags(
            @PathVariable UUID projectId,
            @Parameter(description = "Optional case-insensitive name substring filter")
            @RequestParam(name = "q", required = false) String query) {
        return ResponseEntity.ok(tagService.listTags(
                projectId, query, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Create tag",
            description = "Any project member (MEMBER, OWNER or system ADMIN) may create a shared tag. "
                    + "Names are unique per project case-insensitively.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Tag created"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR — the name is blank or too long",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — the caller is not a member of the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "TAG_NAME_ALREADY_EXISTS — case-insensitive duplicate in the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<TagResponse> createTag(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTagRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tagService.createTag(
                projectId, request, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Rename tag",
            description = "OWNER/ADMIN only; a MEMBER cannot rename a shared tag.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tag renamed"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — caller is not a member, or "
                    + "TAG_MANAGEMENT_FORBIDDEN — only OWNER/ADMIN rename tags",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "TAG_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "TAG_NAME_ALREADY_EXISTS — case-insensitive duplicate in the project",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PatchMapping("/{tagId}")
    public ResponseEntity<TagResponse> renameTag(
            @PathVariable UUID projectId,
            @PathVariable UUID tagId,
            @Valid @RequestBody UpdateTagRequest request) {
        return ResponseEntity.ok(tagService.renameTag(
                projectId, tagId, request, currentUserService.requirePrincipal()));
    }

    @Operation(summary = "Delete tag",
            description = "OWNER/ADMIN only. Deletes the tag and its document tag assignments only; documents are kept.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Tag and its assignments deleted; documents remain; no response body"),
            @ApiResponse(responseCode = "403", description = "PROJECT_ACCESS_FORBIDDEN — caller is not a member, or "
                    + "TAG_MANAGEMENT_FORBIDDEN — only OWNER/ADMIN delete tags",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "TAG_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> deleteTag(
            @PathVariable UUID projectId,
            @PathVariable UUID tagId) {
        tagService.deleteTag(projectId, tagId, currentUserService.requirePrincipal());
        return ResponseEntity.noContent().build();
    }
}
```

## src/main/java/com/kbase/user/controller/AdminUserController.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/user/controller/AdminUserController.java)

```java
package com.kbase.user.controller;

import java.util.List;
import java.util.UUID;

import com.kbase.config.OpenApiConfig;
import com.kbase.shared.pagination.PageResponse;
import com.kbase.shared.pagination.PaginationParser;
import com.kbase.shared.response.ApiErrorResponse;
import com.kbase.user.dto.request.ChangeUserStatusRequest;
import com.kbase.user.dto.response.UserResponse;
import com.kbase.user.enums.SystemRole;
import com.kbase.user.enums.UserStatus;
import com.kbase.user.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Admin user management. Route protection (ADMIN) lives in SecurityConfig. */
@Tag(name = OpenApiConfig.TAG_ADMIN_USERS,
        description = "System-wide user management. Requires SystemRole.ADMIN; the ADMIN role is a system role, "
                + "not a project role.")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private static final List<String> SORTABLE_FIELDS =
            List.of("email", "displayName", "createdAt", "updatedAt");
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "createdAt");

    private final UserService userService;
    private final PaginationParser paginationParser;

    public AdminUserController(UserService userService, PaginationParser paginationParser) {
        this.userService = userService;
        this.paginationParser = paginationParser;
    }

    @Operation(summary = "List users",
            description = "Requires SystemRole.ADMIN. Searches and lists every user in the system. Sortable fields: "
                    + "email, displayName, createdAt, updatedAt (default createdAt,desc).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paged users")
    })
    @GetMapping
    public ResponseEntity<PageResponse<UserResponse>> listUsers(
            @Parameter(description = "Case-insensitive search across email and display name")
            @RequestParam(name = "q", required = false) String q,
            @Parameter(description = "Filter by account status")
            @RequestParam(name = "status", required = false) UserStatus status,
            @Parameter(description = "Filter by system role")
            @RequestParam(name = "systemRole", required = false) SystemRole systemRole,
            @Parameter(description = "Zero-based page index (default 0)")
            @RequestParam(name = "page", required = false) Integer page,
            @Parameter(description = "Page size, 1..100 (default 20)")
            @RequestParam(name = "size", required = false) Integer size,
            @Parameter(description = "Sort as field,direction; allowed fields: email, displayName, createdAt, updatedAt")
            @RequestParam(name = "sort", required = false) String sort) {
        Pageable pageable = paginationParser.parse(page, size, sort, SORTABLE_FIELDS, DEFAULT_SORT);
        return ResponseEntity.ok(userService.listUsers(q, status, systemRole, pageable));
    }

    @Operation(summary = "Get user by id",
            description = "Requires SystemRole.ADMIN.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User details"),
            @ApiResponse(responseCode = "404", description = "USER_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getUser(userId));
    }

    @Operation(summary = "Change user status",
            description = "Requires SystemRole.ADMIN. Switches a user between ACTIVE and DISABLED. Disabling revokes "
                    + "all refresh sessions; the JWT filter reloads the user on every request, so existing access "
                    + "tokens stop working immediately for a disabled account.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status changed"),
            @ApiResponse(responseCode = "400", description = "INVALID_USER_STATUS — the status value is not ACTIVE/DISABLED",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "USER_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PatchMapping("/{userId}/status")
    public ResponseEntity<UserResponse> updateStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody ChangeUserStatusRequest request) {
        return ResponseEntity.ok(userService.updateStatus(userId, request.status()));
    }

    @Operation(summary = "Delete user",
            description = "Requires SystemRole.ADMIN. Hard-deletes a user. A user who still owns a project or other "
                    + "dependent resources is rejected instead of cascading into project knowledge.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "User deleted; no response body"),
            @ApiResponse(responseCode = "404", description = "USER_NOT_FOUND",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "USER_OWNS_PROJECT — the user still owns a project, or "
                    + "USER_HAS_DEPENDENCIES — the user still has dependent resources",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }
}
```

## src/main/java/com/kbase/user/controller/UserController.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/user/controller/UserController.java)

```java
package com.kbase.user.controller;

import com.kbase.config.OpenApiConfig;
import com.kbase.shared.response.ApiErrorResponse;
import com.kbase.security.service.CurrentUserService;
import com.kbase.user.dto.request.ChangePasswordRequest;
import com.kbase.user.dto.request.UpdateProfileRequest;
import com.kbase.user.dto.response.UserResponse;
import com.kbase.user.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Current-user profile and password endpoints. */
@Tag(name = OpenApiConfig.TAG_USERS, description = "Profile and password of the authenticated user.")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final CurrentUserService currentUserService;

    public UserController(UserService userService, CurrentUserService currentUserService) {
        this.userService = userService;
        this.currentUserService = currentUserService;
    }

    @Operation(summary = "Get current user profile")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Current user profile"),
            @ApiResponse(responseCode = "404", description = "USER_NOT_FOUND — the account no longer exists",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser(currentUserService.requireUserId()));
    }

    @Operation(summary = "Update current user profile",
            description = "Only displayName is user-modifiable.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated profile"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR — displayName is blank or too long",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "USER_NOT_FOUND — the account no longer exists",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(
                userService.updateProfile(currentUserService.requireUserId(), request));
    }

    @Operation(summary = "Change password",
            description = "Verifies the current password, stores the new hash and revokes all refresh sessions of "
                    + "the user, so other sessions must log in again.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Password changed; refresh sessions revoked"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR — the new password does not meet the length rules",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "CURRENT_PASSWORD_INVALID — the current password is wrong",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(currentUserService.requireUserId(), request);
        return ResponseEntity.noContent().build();
    }
}
```
