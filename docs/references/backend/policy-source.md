# Backend exact source excerpts

Commit: `636ea26469823bc475732d1e0f79f147556d1f63`. Reference only; do not edit these excerpts to change an API.

Use heading search for a Java filename. Public source may contain internal implementation notes; FE only sends documented public fields.

## src/main/java/com/kbase/ai/service/ProjectAssistantConversationService.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/ai/service/ProjectAssistantConversationService.java)

```java
package com.kbase.ai.service;

import java.util.UUID;

import com.kbase.ai.config.AiProperties;
import com.kbase.ai.dto.response.AiConversationResponse;
import com.kbase.ai.dto.response.AiTurnResponse;
import com.kbase.ai.dto.response.CreateAiConversationResponse;
import com.kbase.ai.observability.AiObservability;
import com.kbase.ai.provider.error.AiProviderException;
import com.kbase.ai.retrieval.GroundedResult;
import com.kbase.ai.retrieval.ProjectRagService;
import com.kbase.ai.service.ProjectAssistantPersistenceService.StartedTurn;
import com.kbase.ai.usage.AiUsageGuard;
import com.kbase.project.service.ProjectAuthorizationService;
import com.kbase.security.principal.CustomUserPrincipal;
import com.kbase.shared.exception.BusinessException;
import com.kbase.shared.exception.ErrorCode;
import com.kbase.shared.exception.KBaseException;
import com.kbase.shared.pagination.PageResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

/** Nontransactional orchestration of a persisted turn around the strict M6 RAG boundary. */
@Service
public class ProjectAssistantConversationService {

    private final ProjectAssistantPersistenceService persistence;
    private final ObjectProvider<ProjectRagService> ragProvider;
    private final ProjectAuthorizationService authorization;
    private final ProjectAssistantFinalizationHook finalizationHook;
    private final AiProperties properties;
    private final AiUsageGuard usageGuard;
    private final AiObservability observability;

    @Autowired
    public ProjectAssistantConversationService(ProjectAssistantPersistenceService persistence,
            ObjectProvider<ProjectRagService> ragProvider,
            ProjectAuthorizationService authorization,
            ProjectAssistantFinalizationHook finalizationHook, AiProperties properties,
            AiUsageGuard usageGuard, AiObservability observability) {
        this.persistence = persistence;
        this.ragProvider = ragProvider;
        this.authorization = authorization;
        this.finalizationHook = finalizationHook;
        this.properties = properties;
        this.usageGuard = usageGuard;
        this.observability = observability;
    }

    /** Compatibility constructor for focused orchestration tests. */
    public ProjectAssistantConversationService(ProjectAssistantPersistenceService persistence,
            ObjectProvider<ProjectRagService> ragProvider,
            ProjectAuthorizationService authorization,
            ProjectAssistantFinalizationHook finalizationHook, AiProperties properties) {
        this(persistence, ragProvider, authorization, finalizationHook, properties,
                userId -> { }, new AiObservability());
    }

    public CreateAiConversationResponse create(UUID projectId, CustomUserPrincipal principal,
            String message) {
        long startedAt = System.nanoTime();
        String outcome = "SUCCESS";
        try {
            String question = validMessage(message);
            ProjectRagService rag = requireRag();
            authorization.requireProjectAccess(projectId, principal);
            usageGuard.consume(principal.getUserId());
            StartedTurn started = persistence.create(projectId, principal, question, initialTitle(question));
            AiTurnResponse turn = answer(projectId, principal, started, rag);
            return new CreateAiConversationResponse(started.conversation(), turn.message(), turn.sources());
        } catch (RuntimeException failure) {
            outcome = AiObservability.requestOutcome(failure);
            throw failure;
        } finally {
            observability.recordInteractiveRequest("PROJECT_ASSISTANT_CREATE", outcome,
                    System.nanoTime() - startedAt);
        }
    }

    public AiTurnResponse send(UUID projectId, UUID conversationId,
            CustomUserPrincipal principal, String message) {
        long startedAt = System.nanoTime();
        String outcome = "SUCCESS";
        try {
            String question = validMessage(message);
            ProjectRagService rag = requireRag();
            persistence.preflightSend(projectId, conversationId, principal);
            usageGuard.consume(principal.getUserId());
            StartedTurn started = persistence.startSend(projectId, conversationId, principal, question);
            return answer(projectId, principal, started, rag);
        } catch (RuntimeException failure) {
            outcome = AiObservability.requestOutcome(failure);
            throw failure;
        } finally {
            observability.recordInteractiveRequest("PROJECT_ASSISTANT_SEND", outcome,
                    System.nanoTime() - startedAt);
        }
    }

    public PageResponse<AiConversationResponse> list(UUID projectId, CustomUserPrincipal principal,
            Pageable pageable) {
        return persistence.list(projectId, principal, pageable);
    }

    public AiConversationResponse get(UUID projectId, UUID conversationId,
            CustomUserPrincipal principal) {
        return persistence.get(projectId, conversationId, principal);
    }

    public AiConversationResponse rename(UUID projectId, UUID conversationId,
            CustomUserPrincipal principal, String title) {
        if (title == null || stripEdges(title).isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        String trimmed = stripEdges(title);
        if (trimmed.codePointCount(0, trimmed.length()) > 100) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        return persistence.rename(projectId, conversationId, principal, trimmed);
    }

    public void delete(UUID projectId, UUID conversationId, CustomUserPrincipal principal) {
        persistence.delete(projectId, conversationId, principal);
    }

    public PageResponse<AiTurnResponse> listMessages(UUID projectId, UUID conversationId,
            CustomUserPrincipal principal, Pageable pageable) {
        return persistence.listMessages(projectId, conversationId, principal, pageable);
    }

    static String initialTitle(String firstQuestion) {
        String trimmed = stripEdges(firstQuestion);
        int codePoints = trimmed.codePointCount(0, trimmed.length());
        return codePoints <= 100 ? trimmed : trimmed.substring(0, trimmed.offsetByCodePoints(0, 100));
    }

    private String validMessage(String message) {
        if (message == null || stripEdges(message).isEmpty()
                || message.codePointCount(0, message.length()) > properties.getMaxMessageChars()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        return message;
    }

    private static String stripEdges(String value) {
        int start = 0;
        int end = value.length();
        while (start < end) {
            int codePoint = value.codePointAt(start);
            if (!Character.isWhitespace(codePoint) && !Character.isSpaceChar(codePoint)) break;
            start += Character.charCount(codePoint);
        }
        while (end > start) {
            int codePoint = value.codePointBefore(end);
            if (!Character.isWhitespace(codePoint) && !Character.isSpaceChar(codePoint)) break;
            end -= Character.charCount(codePoint);
        }
        return value.substring(start, end);
    }

    private ProjectRagService requireRag() {
        ProjectRagService rag = properties.isEnabled() ? ragProvider.getIfAvailable() : null;
        if (rag == null) {
            throw new BusinessException(ErrorCode.AI_PROVIDER_UNAVAILABLE);
        }
        return rag;
    }

    private AiTurnResponse answer(UUID projectId, CustomUserPrincipal principal,
            StartedTurn started, ProjectRagService rag) {
        GroundedResult result;
        try {
            result = rag.answer(projectId, principal, started.question(), started.history());
        } catch (RuntimeException failure) {
            throw failTurn(projectId, principal, started, failure);
        }
        try {
            finalizationHook.beforeFinalization(projectId, started.conversationId());
            AiTurnResponse response = persistence.complete(projectId, principal, started, result);
            authorization.requireProjectAccess(projectId, principal);
            return response;
        } catch (RuntimeException failure) {
            throw failTurn(projectId, principal, started, failure);
        }
    }

    private RuntimeException failTurn(UUID projectId, CustomUserPrincipal principal,
            StartedTurn started, RuntimeException failure) {
        KBaseException accessFailure = null;
        try {
            authorization.requireProjectAccess(projectId, principal);
        } catch (KBaseException revoked) {
            accessFailure = revoked;
        }
        String safeCode = accessFailure != null ? "PROJECT_ACCESS_REVOKED"
                : failure instanceof AiProviderException provider
                        ? "AI_PROVIDER_" + provider.category().name() : "AI_PROVIDER_UNAVAILABLE";
        persistence.markFailed(projectId, principal.getUserId(), started, safeCode);
        if (accessFailure != null) {
            return accessFailure;
        }
        if (failure instanceof KBaseException known) {
            return known;
        }
        return new BusinessException(ErrorCode.AI_PROVIDER_UNAVAILABLE);
    }
}
```

## src/main/java/com/kbase/config/properties/InvitationProperties.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/config/properties/InvitationProperties.java)

```java
package com.kbase.config.properties;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "kbase.invitation")
public class InvitationProperties {

    private Duration expiration = Duration.ofHours(72);
    private String acceptBaseUrl = "http://localhost:3000/invitations/accept";

    public Duration getExpiration() {
        return expiration;
    }

    public void setExpiration(Duration expiration) {
        this.expiration = expiration;
    }

    public String getAcceptBaseUrl() {
        return acceptBaseUrl;
    }

    public void setAcceptBaseUrl(String acceptBaseUrl) {
        this.acceptBaseUrl = acceptBaseUrl;
    }
}
```

## src/main/java/com/kbase/config/properties/UploadProperties.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/config/properties/UploadProperties.java)

```java
package com.kbase.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;

@ConfigurationProperties(prefix = "kbase.upload")
public class UploadProperties {

    private DataSize documentMaxSize = DataSize.ofMegabytes(50);
    private DataSize imageMaxSize = DataSize.ofMegabytes(20);
    private DataSize videoMaxSize = DataSize.ofMegabytes(500);
    private int maxBatchFiles = 10;

    public DataSize getDocumentMaxSize() {
        return documentMaxSize;
    }

    public void setDocumentMaxSize(DataSize documentMaxSize) {
        this.documentMaxSize = documentMaxSize;
    }

    public DataSize getImageMaxSize() {
        return imageMaxSize;
    }

    public void setImageMaxSize(DataSize imageMaxSize) {
        this.imageMaxSize = imageMaxSize;
    }

    public DataSize getVideoMaxSize() {
        return videoMaxSize;
    }

    public void setVideoMaxSize(DataSize videoMaxSize) {
        this.videoMaxSize = videoMaxSize;
    }

    public int getMaxBatchFiles() {
        return maxBatchFiles;
    }

    public void setMaxBatchFiles(int maxBatchFiles) {
        this.maxBatchFiles = maxBatchFiles;
    }
}
```

## src/main/java/com/kbase/document/service/DocumentAuthorizationService.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/document/service/DocumentAuthorizationService.java)

```java
package com.kbase.document.service;

import com.kbase.document.entity.Document;
import com.kbase.project.enums.ProjectRole;
import com.kbase.project.service.ProjectAuthorizationService;
import com.kbase.security.principal.CustomUserPrincipal;
import com.kbase.shared.exception.ForbiddenOperationException;
import com.kbase.shared.exception.ErrorCode;

import org.springframework.stereotype.Service;

/** Central document ownership policy; former members fail the project access check. */
@Service
public class DocumentAuthorizationService {
    private final ProjectAuthorizationService projectAuthorizationService;

    public DocumentAuthorizationService(ProjectAuthorizationService projectAuthorizationService) {
        this.projectAuthorizationService = projectAuthorizationService;
    }

    public void requireReadPermission(Document document, CustomUserPrincipal principal) {
        projectAuthorizationService.requireProjectAccess(document.getProject().getId(), principal);
    }

    public void requireModifyPermission(Document document, CustomUserPrincipal principal) {
        var access = projectAuthorizationService.requireProjectAccess(document.getProject().getId(), principal);
        if (access.adminOverride() || access.hasRole(ProjectRole.OWNER)
                || (access.hasRole(ProjectRole.MEMBER)
                && document.getUploadedBy().getId().equals(principal.getUserId()))) {
            return;
        }
        throw new ForbiddenOperationException(ErrorCode.DOCUMENT_MODIFICATION_FORBIDDEN);
    }
}
```

## src/main/java/com/kbase/document/service/DocumentService.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/document/service/DocumentService.java)

```java
package com.kbase.document.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import com.kbase.ai.service.DocumentAiIntentService;
import com.kbase.document.dto.request.DocumentMetadataRequest;
import com.kbase.document.dto.request.UpdateDocumentRequest;
import com.kbase.document.dto.response.BatchDocumentUploadResponse;
import com.kbase.document.dto.response.DocumentResponse;
import com.kbase.document.entity.Document;
import com.kbase.document.entity.DocumentTag;
import com.kbase.document.mapper.DocumentMapper;
import com.kbase.document.repository.DocumentRepository;
import com.kbase.document.repository.DocumentTagRepository;
import com.kbase.project.service.ProjectAuthorizationService;
import com.kbase.security.principal.CustomUserPrincipal;
import com.kbase.shared.exception.BusinessException;
import com.kbase.shared.exception.ErrorCode;
import com.kbase.shared.exception.InfrastructureException;
import com.kbase.storage.exception.StorageException;
import com.kbase.storage.exception.StorageUnavailableException;
import com.kbase.storage.model.StorageUploadRequest;
import com.kbase.storage.model.StoredResource;
import com.kbase.storage.service.StorageKeyFactory;
import com.kbase.storage.service.StorageService;
import com.kbase.user.entity.User;
import com.kbase.user.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/** Owns document orchestration; MinIO is reachable only through StorageService. */
@Service
public class DocumentService {
    private static final Logger LOGGER = LoggerFactory.getLogger(DocumentService.class);
    private static final Collection<String> PREVIEW_EXTENSIONS = List.of(
            "pdf", "jpg", "jpeg", "png", "gif", "svg", "bmp", "txt", "md", "mp4");

    private final DocumentRepository documentRepository;
    private final DocumentTagRepository documentTagRepository;
    private final ProjectAuthorizationService projectAuthorizationService;
    private final DocumentAuthorizationService documentAuthorizationService;
    private final DocumentMetadataResolver metadataResolver;
    private final FileValidationService fileValidationService;
    private final StorageService storageService;
    private final StorageKeyFactory storageKeyFactory;
    private final DocumentMapper documentMapper;
    private final UserRepository userRepository;
    private final DocumentAiIntentService documentAiIntentService;

    @Autowired
    public DocumentService(DocumentRepository documentRepository, DocumentTagRepository documentTagRepository,
            ProjectAuthorizationService projectAuthorizationService,
            DocumentAuthorizationService documentAuthorizationService,
            DocumentMetadataResolver metadataResolver, FileValidationService fileValidationService,
            StorageService storageService, StorageKeyFactory storageKeyFactory,
            DocumentMapper documentMapper, UserRepository userRepository,
            DocumentAiIntentService documentAiIntentService) {
        this.documentRepository = documentRepository;
        this.documentTagRepository = documentTagRepository;
        this.projectAuthorizationService = projectAuthorizationService;
        this.documentAuthorizationService = documentAuthorizationService;
        this.metadataResolver = metadataResolver;
        this.fileValidationService = fileValidationService;
        this.storageService = storageService;
        this.storageKeyFactory = storageKeyFactory;
        this.documentMapper = documentMapper;
        this.userRepository = userRepository;
        this.documentAiIntentService = documentAiIntentService;
    }

    /** Compatibility constructor for focused Core unit tests that predate M3 AI intent. */
    public DocumentService(DocumentRepository documentRepository, DocumentTagRepository documentTagRepository,
            ProjectAuthorizationService projectAuthorizationService,
            DocumentAuthorizationService documentAuthorizationService,
            DocumentMetadataResolver metadataResolver, FileValidationService fileValidationService,
            StorageService storageService, StorageKeyFactory storageKeyFactory,
            DocumentMapper documentMapper, UserRepository userRepository) {
        this(documentRepository, documentTagRepository, projectAuthorizationService,
                documentAuthorizationService, metadataResolver, fileValidationService,
                storageService, storageKeyFactory, documentMapper, userRepository, null);
    }

    @Transactional
    public DocumentResponse upload(UUID projectId, MultipartFile file, DocumentMetadataRequest metadata,
            CustomUserPrincipal principal) {
        return uploadInternal(projectId, file, metadata, principal);
    }

    @Transactional
    public BatchDocumentUploadResponse batchUpload(UUID projectId, List<MultipartFile> files,
            DocumentMetadataRequest metadata, CustomUserPrincipal principal) {
        projectAuthorizationService.requireProjectAccess(projectId, principal);
        fileValidationService.validateBatchCount(files == null ? 0 : files.size());
        // Validate every file before creating any external object.
        for (MultipartFile file : files) { fileValidationService.validate(file); }
        List<DocumentResponse> saved = new ArrayList<>();
        List<String> uploadedKeys = new ArrayList<>();
        try {
            for (MultipartFile file : files) {
                DocumentResponse response = uploadInternal(projectId, file, metadata, principal, uploadedKeys);
                saved.add(response);
            }
            return new BatchDocumentUploadResponse(List.copyOf(saved));
        } catch (RuntimeException exception) {
            cleanupUploaded(projectId, null, uploadedKeys, exception);
            throw exception;
        }
    }

    private DocumentResponse uploadInternal(UUID projectId, MultipartFile file, DocumentMetadataRequest metadata,
            CustomUserPrincipal principal) {
        return uploadInternal(projectId, file, metadata, principal, new ArrayList<>());
    }

    private DocumentResponse uploadInternal(UUID projectId, MultipartFile file, DocumentMetadataRequest metadata,
            CustomUserPrincipal principal, List<String> uploadedKeys) {
        var access = projectAuthorizationService.requireProjectAccess(projectId, principal);
        ValidatedFile validated = fileValidationService.validate(file);
        DocumentMetadataRequest safeMetadata = metadata == null
                ? new DocumentMetadataRequest(null, null, null, null, List.of()) : metadata;
        ResolvedDocumentMetadata resolved = metadataResolver.resolve(projectId, safeMetadata.folderId(),
                safeMetadata.categoryId(), safeMetadata.tagIds());
        UUID documentId = UUID.randomUUID();
        String storageKey = storageKeyFactory.documentObjectKey(projectId, documentId, validated.extension());
        try (InputStream input = file.getInputStream()) {
            storageService.upload(new StorageUploadRequest(storageKey, input, validated.sizeBytes(), validated.mimeType()));
            uploadedKeys.add(storageKey);
        } catch (StorageException exception) {
            throw storageFailureForUpload(exception);
        } catch (IOException exception) {
            throw new InfrastructureException(ErrorCode.FILE_UPLOAD_FAILED, exception);
        }
        try {
            User uploader = userRepository.findById(principal.getUserId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
            String displayName = safeDisplayName(safeMetadata.displayName(), validated.originalFilename());
            Document document = new Document(access.project(), uploader, displayName, validated.originalFilename(),
                    validated.fileKind(), validated.extension(), validated.mimeType(), validated.sizeBytes(), storageKey);
            document.setId(documentId);
            document.setDescription(safeMetadata.description());
            document.setFolder(resolved.folder());
            document.setCategory(resolved.category());
            // A backend-generated UUID makes Spring Data choose merge for a
            // new entity. Keep the returned managed instance so lifecycle
            // timestamps and subsequent tag associations are reflected in the
            // response and transaction.
            document = documentRepository.saveAndFlush(document);
            persistTags(document, resolved.tags());
            if (documentAiIntentService != null) {
                documentAiIntentService.recordUploadIntent(document);
            }
            return documentMapper.toResponse(document, documentTagRepository.findAllByIdDocumentId(documentId));
        } catch (RuntimeException exception) {
            // This key is compensated here, so drop it from the batch list to
            // keep the outer batch cleanup from deleting it a second time.
            uploadedKeys.remove(storageKey);
            cleanupUploaded(projectId, documentId, List.of(storageKey), exception);
            if (exception instanceof BusinessException) { throw exception; }
            throw new InfrastructureException(ErrorCode.FILE_UPLOAD_FAILED, exception);
        }
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocument(UUID documentId, CustomUserPrincipal principal) {
        Document document = requireDetail(documentId);
        documentAuthorizationService.requireReadPermission(document, principal);
        return documentMapper.toResponse(document, documentTagRepository.findAllByIdDocumentId(documentId));
    }

    @Transactional
    public DocumentResponse updateMetadata(UUID documentId, UpdateDocumentRequest request,
            CustomUserPrincipal principal) {
        Objects.requireNonNull(request, "request");
        Document document = requireDetail(documentId);
        documentAuthorizationService.requireModifyPermission(document, principal);
        ResolvedDocumentMetadata resolved = metadataResolver.resolve(document.getProject().getId(),
                request.folderId() == null ? document.getFolderId() : request.folderId(),
                request.categoryId() == null ? document.getCategoryId() : request.categoryId(),
                request.tagIds() == null ? documentTagRepository.findAllByIdDocumentId(documentId).stream()
                        .map(relation -> relation.getTag().getId()).toList() : request.tagIds());
        if (request.displayName() != null) {
            document.setDisplayName(safeDisplayName(request.displayName(), document.getOriginalFilename()));
        }
        if (request.description() != null) { document.setDescription(request.description()); }
        document.setFolder(resolved.folder());
        document.setCategory(resolved.category());
        documentTagRepository.deleteAllByIdDocumentId(documentId);
        documentTagRepository.flush();
        persistTags(document, resolved.tags());
        // storageKey intentionally remains untouched for rename/move/category/tag changes.
        return documentMapper.toResponse(document, documentTagRepository.findAllByIdDocumentId(documentId));
    }

    @Transactional(readOnly = true)
    public FileDelivery download(UUID documentId, CustomUserPrincipal principal) {
        Document document = requireDetail(documentId);
        documentAuthorizationService.requireReadPermission(document, principal);
        return delivery(document, false, null);
    }

    @Transactional(readOnly = true)
    public FileDelivery preview(UUID documentId, CustomUserPrincipal principal, String rangeHeader) {
        Document document = requireDetail(documentId);
        documentAuthorizationService.requireReadPermission(document, principal);
        if (!PREVIEW_EXTENSIONS.contains(document.getExtension())) {
            throw new BusinessException(ErrorCode.PREVIEW_NOT_SUPPORTED);
        }
        return delivery(document, true, rangeHeader);
    }

    @Transactional
    public void delete(UUID documentId, CustomUserPrincipal principal) {
        Document document = requireDetail(documentId);
        documentAuthorizationService.requireModifyPermission(document, principal);
        try {
            storageService.delete(document.getStorageKey());
        } catch (StorageException exception) {
            throw storageFailureForDelete(exception, ErrorCode.DOCUMENT_DELETE_FAILED);
        }
        try {
            documentRepository.delete(document); // schema cascade removes DocumentTag after storage success.
            documentRepository.flush();
        } catch (RuntimeException exception) {
            LOGGER.error("Document DB delete failed after storage deletion documentId={} projectId={}",
                    documentId, document.getProject().getId(), exception);
            throw new InfrastructureException(ErrorCode.DOCUMENT_DELETE_FAILED, exception);
        }
    }

    private FileDelivery delivery(Document document, boolean preview, String rangeHeader) {
        try {
            if (preview && "mp4".equals(document.getExtension()) && rangeHeader != null) {
                long total = storageService.stat(document.getStorageKey()).sizeBytes();
                long[] range = parseRange(rangeHeader, total);
                StoredResource resource = storageService.getRange(document.getStorageKey(), range[0], range[1] - range[0] + 1);
                return new FileDelivery(resource.inputStream(), resource.contentLength(), total, document.getMimeType(),
                        document.getDisplayName(), true, range[0], range[1]);
            }
            StoredResource resource = storageService.get(document.getStorageKey());
            return new FileDelivery(resource.inputStream(), resource.contentLength(), resource.contentLength(),
                    document.getMimeType(), document.getDisplayName(), false, 0, resource.contentLength() - 1);
        } catch (StorageException exception) {
            if (exception instanceof StorageUnavailableException) {
                throw new InfrastructureException(ErrorCode.STORAGE_SERVICE_UNAVAILABLE, exception);
            }
            LOGGER.error("Storage read failed documentId={} projectId={}", document.getId(),
                    document.getProject().getId(), exception);
            throw new InfrastructureException(ErrorCode.INTERNAL_SERVER_ERROR, exception);
        }
    }

    private static long[] parseRange(String header, long total) {
        if (total <= 0 || !header.startsWith("bytes=") || header.contains(",")) throw new InvalidRangeException(total);
        try {
            String[] parts = header.substring(6).split("-", -1);
            if (parts.length != 2 || parts[0].isBlank()) throw new InvalidRangeException(total);
            long start = Long.parseLong(parts[0]);
            long end = parts[1].isBlank() ? total - 1 : Long.parseLong(parts[1]);
            if (start < 0 || end < start || start >= total) throw new InvalidRangeException(total);
            return new long[] {start, Math.min(end, total - 1)};
        } catch (NumberFormatException exception) { throw new InvalidRangeException(total); }
    }

    private Document requireDetail(UUID documentId) {
        return documentRepository.findDetailById(documentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND));
    }

    private void persistTags(Document document, List<com.kbase.tag.entity.Tag> tags) {
        // Retain both object references as well as the composite key. The
        // response mapper needs the tag projection in this transaction, while
        // the database composite foreign keys remain the final integrity check.
        List<DocumentTag> relations = tags.stream().map(tag -> new DocumentTag(
                document, tag, document.getProject().getId())).toList();
        documentTagRepository.saveAll(relations);
        documentTagRepository.flush();
    }

    private static String safeDisplayName(String requested, String fallback) {
        String name = requested == null || requested.isBlank() ? fallback : requested.trim();
        if (name.length() > 255) throw new BusinessException(ErrorCode.INVALID_FILE_METADATA);
        return name;
    }

    private void cleanupUploaded(UUID projectId, UUID documentId, Collection<String> keys, RuntimeException root) {
        for (String key : keys) {
            try { storageService.delete(key); }
            catch (RuntimeException cleanupFailure) {
                LOGGER.error("COMPENSATION FAILURE projectId={} documentId={} rootFailure={}",
                        projectId, documentId, root.getClass().getSimpleName(), cleanupFailure);
            }
        }
    }

    private static InfrastructureException storageFailureForUpload(StorageException exception) {
        return new InfrastructureException(exception instanceof StorageUnavailableException
                ? ErrorCode.STORAGE_SERVICE_UNAVAILABLE : ErrorCode.FILE_UPLOAD_FAILED, exception);
    }

    private static InfrastructureException storageFailureForDelete(StorageException exception, ErrorCode fallback) {
        return new InfrastructureException(exception instanceof StorageUnavailableException
                ? ErrorCode.STORAGE_SERVICE_UNAVAILABLE : fallback, exception);
    }
}
```

## src/main/java/com/kbase/document/service/FileValidationService.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/document/service/FileValidationService.java)

```java
package com.kbase.document.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import com.kbase.config.properties.UploadProperties;
import com.kbase.document.enums.FileKind;
import com.kbase.shared.exception.BusinessException;
import com.kbase.shared.exception.ErrorCode;

import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/** Validates upload content without trusting a client filename or content type. */
@Service
public class FileValidationService {

    private static final Map<String, FileKind> KINDS = Map.ofEntries(
            Map.entry("pdf", FileKind.DOCUMENT), Map.entry("doc", FileKind.DOCUMENT),
            Map.entry("docx", FileKind.DOCUMENT), Map.entry("xls", FileKind.DOCUMENT),
            Map.entry("xlsx", FileKind.DOCUMENT), Map.entry("ppt", FileKind.DOCUMENT),
            Map.entry("pptx", FileKind.DOCUMENT), Map.entry("md", FileKind.DOCUMENT),
            Map.entry("txt", FileKind.DOCUMENT), Map.entry("jpg", FileKind.IMAGE),
            Map.entry("jpeg", FileKind.IMAGE), Map.entry("png", FileKind.IMAGE),
            Map.entry("gif", FileKind.IMAGE), Map.entry("svg", FileKind.IMAGE),
            Map.entry("bmp", FileKind.IMAGE), Map.entry("mp4", FileKind.VIDEO),
            Map.entry("mov", FileKind.VIDEO), Map.entry("avi", FileKind.VIDEO));
    private static final Map<String, Set<String>> MIME_TYPES = Map.ofEntries(
            Map.entry("pdf", Set.of("application/pdf")),
            Map.entry("doc", Set.of("application/msword")),
            Map.entry("docx", Set.of("application/vnd.openxmlformats-officedocument.wordprocessingml.document")),
            Map.entry("xls", Set.of("application/vnd.ms-excel")),
            Map.entry("xlsx", Set.of("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")),
            Map.entry("ppt", Set.of("application/vnd.ms-powerpoint")),
            Map.entry("pptx", Set.of("application/vnd.openxmlformats-officedocument.presentationml.presentation")),
            Map.entry("md", Set.of("text/markdown", "text/plain")), Map.entry("txt", Set.of("text/plain")),
            Map.entry("jpg", Set.of("image/jpeg")), Map.entry("jpeg", Set.of("image/jpeg")),
            Map.entry("png", Set.of("image/png")), Map.entry("gif", Set.of("image/gif")),
            Map.entry("svg", Set.of("image/svg+xml")), Map.entry("bmp", Set.of("image/bmp", "image/x-ms-bmp")),
            Map.entry("mp4", Set.of("video/mp4")), Map.entry("mov", Set.of("video/quicktime")),
            Map.entry("avi", Set.of("video/x-msvideo")));

    private final UploadProperties properties;
    private final Tika tika = new Tika();

    public FileValidationService(UploadProperties properties) {
        this.properties = properties;
    }

    public void validateBatchCount(int count) {
        if (count < 1 || count > properties.getMaxBatchFiles()) {
            throw new BusinessException(ErrorCode.INVALID_FILE_METADATA,
                    "The number of uploaded files is invalid.");
        }
    }

    public ValidatedFile validate(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() <= 0) {
            throw new BusinessException(ErrorCode.FILE_EMPTY);
        }
        String original = file.getOriginalFilename();
        if (original == null || original.isBlank() || original.length() > 255) {
            throw new BusinessException(ErrorCode.INVALID_FILE_METADATA);
        }
        String extension = extensionOf(original);
        FileKind kind = KINDS.get(extension);
        if (kind == null) {
            throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);
        }
        if (file.getSize() > limitFor(kind)) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE);
        }
        String detected = detect(file, original);
        if (!MIME_TYPES.get(extension).contains(detected)) {
            throw new BusinessException(ErrorCode.MIME_TYPE_MISMATCH);
        }
        String reported = normalizeMime(file.getContentType());
        if (reported != null && !MIME_TYPES.get(extension).contains(reported)) {
            throw new BusinessException(ErrorCode.MIME_TYPE_MISMATCH);
        }
        return new ValidatedFile(original, extension, detected, kind, file.getSize());
    }

    private long limitFor(FileKind kind) {
        return switch (kind) {
            case DOCUMENT -> properties.getDocumentMaxSize().toBytes();
            case IMAGE -> properties.getImageMaxSize().toBytes();
            case VIDEO -> properties.getVideoMaxSize().toBytes();
        };
    }

    private String detect(MultipartFile file, String name) {
        try (InputStream stream = file.getInputStream()) {
            return normalizeMime(tika.detect(stream, name));
        } catch (IOException exception) {
            throw new BusinessException(ErrorCode.INVALID_FILE_METADATA);
        }
    }

    private static String extensionOf(String original) {
        String filename = original.replace('\\', '/');
        int slash = filename.lastIndexOf('/');
        int dot = filename.lastIndexOf('.');
        if (dot <= slash + 1 || dot == filename.length() - 1) {
            throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);
        }
        return filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static String normalizeMime(String mime) {
        if (mime == null || mime.isBlank()) {
            return null;
        }
        int semicolon = mime.indexOf(';');
        return (semicolon < 0 ? mime : mime.substring(0, semicolon)).trim().toLowerCase(Locale.ROOT);
    }
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

## src/main/java/com/kbase/project/service/ProjectAuthorizationService.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/project/service/ProjectAuthorizationService.java)

```java
package com.kbase.project.service;

import java.util.Objects;
import java.util.UUID;

import com.kbase.project.entity.Project;
import com.kbase.project.entity.ProjectMember;
import com.kbase.project.enums.ProjectRole;
import com.kbase.project.repository.ProjectMemberRepository;
import com.kbase.project.repository.ProjectRepository;
import com.kbase.security.principal.CustomUserPrincipal;
import com.kbase.shared.exception.BusinessException;
import com.kbase.shared.exception.ErrorCode;
import com.kbase.user.enums.SystemRole;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Centralized project-level authorization. ADMIN is a system-level override
 * and never receives a fake ProjectMember row; project roles are always read
 * from the current {@code project_members} data.
 */
@Service
public class ProjectAuthorizationService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;

    public ProjectAuthorizationService(
            ProjectRepository projectRepository,
            ProjectMemberRepository projectMemberRepository) {
        this.projectRepository = Objects.requireNonNull(projectRepository, "projectRepository");
        this.projectMemberRepository =
                Objects.requireNonNull(projectMemberRepository, "projectMemberRepository");
    }

    /**
     * Requires read access: MEMBER, OWNER or ADMIN. Returns the membership
     * role, or null when access is granted through the ADMIN override.
     */
    @Transactional(readOnly = true)
    public ProjectAccess requireProjectAccess(UUID projectId, CustomUserPrincipal principal) {
        Objects.requireNonNull(principal, "principal");
        Project project = requireProject(projectId);
        if (principal.getSystemRole() == SystemRole.ADMIN) {
            return ProjectAccess.adminOverride(project);
        }
        ProjectMember membership = projectMemberRepository
                .findByProjectIdAndUserId(projectId, principal.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PROJECT_ACCESS_FORBIDDEN));
        return new ProjectAccess(project, membership.getRole(), false, membership.getId());
    }

    /**
     * Requires management rights: project OWNER or ADMIN. A non-member caller
     * without ADMIN fails with the management-forbidden contract of the
     * update/delete endpoints.
     */
    @Transactional(readOnly = true)
    public ProjectAccess requireOwner(UUID projectId, CustomUserPrincipal principal) {
        Objects.requireNonNull(principal, "principal");
        Project project = requireProject(projectId);
        if (principal.getSystemRole() == SystemRole.ADMIN) {
            return ProjectAccess.adminOverride(project);
        }
        ProjectMember membership = projectMemberRepository
                .findByProjectIdAndUserId(projectId, principal.getUserId())
                .filter(member -> member.getRole() == ProjectRole.OWNER)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROJECT_MANAGEMENT_FORBIDDEN));
        return new ProjectAccess(project, membership.getRole(), false, membership.getId());
    }

    private Project requireProject(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROJECT_NOT_FOUND));
    }

    /**
     * Result of an authorization check. {@code role} is null for the ADMIN
     * override and must never be rendered as a fake project role.
     */
    public record ProjectAccess(Project project, ProjectRole role, boolean adminOverride,
            UUID membershipId) {

        /** Compatibility constructor for Core callers that do not need continuity state. */
        public ProjectAccess(Project project, ProjectRole role, boolean adminOverride) {
            this(project, role, adminOverride, null);
        }

        static ProjectAccess adminOverride(Project project) {
            return new ProjectAccess(project, null, true, null);
        }

        public boolean hasRole(ProjectRole expected) {
            return role == expected;
        }
    }
}
```

## src/main/java/com/kbase/security/config/SecurityConfig.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/security/config/SecurityConfig.java)

```java
package com.kbase.security.config;

import java.util.List;

import com.kbase.config.properties.CorsProperties;
import com.kbase.config.properties.JwtProperties;
import com.kbase.config.properties.OpenApiProperties;
import com.kbase.security.handler.RestAccessDeniedHandler;
import com.kbase.security.handler.RestAuthenticationEntryPoint;
import com.kbase.security.handler.RestSecurityErrorWriter;
import com.kbase.security.jwt.JwtAuthenticationFilter;
import com.kbase.security.jwt.JwtService;
import com.kbase.security.principal.CustomUserDetailsService;
import com.kbase.shared.exception.RequestIdFilter;

import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Stateless security baseline: authentication through short-lived JWTs,
 * system-role authorization only. Project and document authorization live in
 * their domain services, never in this configuration.
 */
@Configuration(proxyBeanMethods = false)
@EnableWebSecurity
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class SecurityConfig {

    private static final String[] PUBLIC_AUTH_ENDPOINTS = {
            "/api/v1/auth/register",
            "/api/v1/auth/verify-email",
            "/api/v1/auth/resend-verification-otp",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/logout"
    };

    @Bean
    public CorsConfigurationSource corsConfigurationSource(CorsProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = properties.getAllowedOrigins() == null
                ? List.of()
                : List.copyOf(properties.getAllowedOrigins());
        if (origins.contains("*")) {
            if (properties.isAllowCredentials()) {
                throw new IllegalStateException(
                        "CORS configuration is invalid: wildcard origin cannot allow credentials");
            }
            configuration.setAllowedOrigins(List.of("*"));
        } else {
            configuration.setAllowedOrigins(origins);
            configuration.setAllowCredentials(properties.isAllowCredentials());
        }
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                HttpHeaders.AUTHORIZATION,
                HttpHeaders.CONTENT_TYPE,
                RequestIdFilter.REQUEST_ID_HEADER));
        configuration.setExposedHeaders(List.of(RequestIdFilter.REQUEST_ID_HEADER));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtService jwtService,
            CustomUserDetailsService userDetailsService,
            RestSecurityErrorWriter errorWriter,
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler,
            CorsConfigurationSource corsConfigurationSource,
            OpenApiProperties openApiProperties) throws Exception {

        JwtAuthenticationFilter jwtAuthenticationFilter =
                new JwtAuthenticationFilter(jwtService, userDetailsService, errorWriter);

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> {
                    authorize.requestMatchers(HttpMethod.POST, PUBLIC_AUTH_ENDPOINTS).permitAll();
                    if (openApiProperties.isEnabled()) {
                        authorize.requestMatchers(openApiDocumentationMatchers(openApiProperties))
                                .permitAll();
                    }
                    authorize.requestMatchers("/error").permitAll();
                    authorize.requestMatchers("/api/v1/admin/**").hasRole("ADMIN");
                    authorize.anyRequest().authenticated();
                })
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private static String[] openApiDocumentationMatchers(OpenApiProperties properties) {
        String apiDocsPath = properties.getApiDocsPath();
        String swaggerUiPath = properties.getSwaggerUiPath();
        return new String[] {
                apiDocsPath,
                apiDocsPath + "/**",
                swaggerUiPath,
                swaggerUiPath + "/**",
                "/swagger-ui/**"
        };
    }
}
```

## src/main/java/com/kbase/shared/exception/ErrorCode.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/shared/exception/ErrorCode.java)

```java
package com.kbase.shared.exception;

import org.springframework.http.HttpStatus;

/**
 * Stable API error codes shared by all Core v1 backend features.
 *
 * <p>The enum owns the transport status and safe default message so that
 * callers do not have to duplicate error literals or expose implementation
 * details from an exception.</p>
 */
public enum ErrorCode {

    // Request and transport errors
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Request validation failed."),
    INVALID_REQUEST_BODY(HttpStatus.BAD_REQUEST,
            "Request body is malformed or contains invalid values."),
    INVALID_PARAMETER(HttpStatus.BAD_REQUEST, "One or more request parameters are invalid."),
    INVALID_RANGE(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE, "The requested byte range is invalid."),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "The requested resource was not found."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "The HTTP method is not supported for this resource."),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
            "The request media type is not supported."),

    // Authentication and account state
    AUTHENTICATION_REQUIRED(HttpStatus.UNAUTHORIZED, "Authentication is required."),
    INVALID_ACCESS_TOKEN(HttpStatus.UNAUTHORIZED, "The access token is invalid."),
    ACCESS_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "The access token has expired."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Invalid email or password."),
    EMAIL_NOT_VERIFIED(HttpStatus.FORBIDDEN, "Email verification is required."),
    ACCOUNT_DISABLED(HttpStatus.FORBIDDEN, "The account is disabled."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "You do not have permission to perform this action."),
    EMAIL_ALREADY_VERIFIED(HttpStatus.CONFLICT, "The email address is already verified."),
    INVALID_OTP(HttpStatus.BAD_REQUEST, "The verification code is invalid."),
    OTP_EXPIRED(HttpStatus.BAD_REQUEST, "The verification code has expired."),
    OTP_ATTEMPTS_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS,
            "The maximum number of verification attempts has been exceeded."),
    OTP_RESEND_COOLDOWN(HttpStatus.TOO_MANY_REQUESTS,
            "Please wait before requesting another verification code."),
    REFRESH_TOKEN_MISSING(HttpStatus.UNAUTHORIZED, "A refresh token is required."),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "The refresh token is invalid."),
    REFRESH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "The refresh token has expired."),
    REFRESH_SESSION_REVOKED(HttpStatus.UNAUTHORIZED, "The refresh session is no longer valid."),
    CURRENT_PASSWORD_INVALID(HttpStatus.UNAUTHORIZED, "The current password is invalid."),

    // User and project
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "The email address is already registered."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "The requested user was not found."),
    USER_HAS_DEPENDENCIES(HttpStatus.CONFLICT, "The user still has dependent resources."),
    USER_OWNS_PROJECT(HttpStatus.CONFLICT, "The user still owns a project."),
    INVALID_USER_STATUS(HttpStatus.BAD_REQUEST, "The requested user status is invalid."),
    PROJECT_NOT_FOUND(HttpStatus.NOT_FOUND, "The requested project was not found."),
    PROJECT_ACCESS_FORBIDDEN(HttpStatus.FORBIDDEN, "You do not have access to this project."),
    PROJECT_MANAGEMENT_FORBIDDEN(HttpStatus.FORBIDDEN,
            "You do not have permission to manage this project."),
    PROJECT_OWNER_ALREADY_EXISTS(HttpStatus.CONFLICT, "The project already has an owner."),
    PROJECT_DELETE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "The project could not be deleted."),

    // Membership and invitation
    PROJECT_MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "The requested project member was not found."),
    PROJECT_MEMBER_ALREADY_EXISTS(HttpStatus.CONFLICT, "The user is already a project member."),
    PROJECT_OWNER_REMOVAL_FORBIDDEN(HttpStatus.CONFLICT, "The project owner cannot be removed."),
    OWNER_CANNOT_LEAVE_PROJECT(HttpStatus.CONFLICT, "The project owner cannot leave the project."),
    INVITATION_NOT_FOUND(HttpStatus.NOT_FOUND, "The requested invitation was not found."),
    INVITATION_ALREADY_PENDING(HttpStatus.CONFLICT, "A pending invitation already exists for this email."),
    INVITATION_NOT_PENDING(HttpStatus.CONFLICT, "The invitation is no longer pending."),
    INVITATION_EXPIRED(HttpStatus.CONFLICT, "The invitation has expired."),
    INVITATION_EMAIL_MISMATCH(HttpStatus.FORBIDDEN,
            "The invitation email does not match the current account."),

    // Project organization
    FOLDER_NOT_FOUND(HttpStatus.NOT_FOUND, "The requested folder was not found."),
    PARENT_FOLDER_NOT_FOUND(HttpStatus.NOT_FOUND, "The requested parent folder was not found."),
    FOLDER_NAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "A folder with this name already exists here."),
    FOLDER_CYCLE_DETECTED(HttpStatus.CONFLICT, "The folder move would create a cycle."),
    FOLDER_NOT_EMPTY(HttpStatus.CONFLICT, "The folder is not empty."),
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "The requested category was not found."),
    CATEGORY_NAME_ALREADY_EXISTS(HttpStatus.CONFLICT,
            "A category with this name already exists in the project."),
    CATEGORY_IN_USE(HttpStatus.CONFLICT, "The category is still used by one or more documents."),
    TAG_NOT_FOUND(HttpStatus.NOT_FOUND, "The requested tag was not found."),
    TAG_NAME_ALREADY_EXISTS(HttpStatus.CONFLICT,
            "A tag with this name already exists in the project."),
    TAG_MANAGEMENT_FORBIDDEN(HttpStatus.FORBIDDEN,
            "You do not have permission to manage this tag."),

    // Documents and storage
    DOCUMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "The requested document was not found."),
    DOCUMENT_MODIFICATION_FORBIDDEN(HttpStatus.FORBIDDEN,
            "You do not have permission to modify this document."),
    FILE_EMPTY(HttpStatus.BAD_REQUEST, "The uploaded file is empty."),
    FILE_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE, "The uploaded file is too large."),
    UNSUPPORTED_FILE_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "The uploaded file type is not supported."),
    MIME_TYPE_MISMATCH(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "The file media type is not valid."),
    INVALID_FILE_METADATA(HttpStatus.BAD_REQUEST, "The file metadata is invalid."),
    PREVIEW_NOT_SUPPORTED(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
            "Preview is not supported for this file type."),
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "The file could not be uploaded."),
    DOCUMENT_DELETE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "The document could not be deleted."),
    STORAGE_SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE,
            "The storage service is temporarily unavailable."),

    // AI Project Assistant and document indexing
    AI_CONVERSATION_LIMIT_REACHED(HttpStatus.CONFLICT,
            "The project conversation limit has been reached."),
    AI_CONVERSATION_NOT_FOUND(HttpStatus.NOT_FOUND,
            "The requested conversation was not found."),
    AI_REQUEST_IN_PROGRESS(HttpStatus.CONFLICT,
            "A response is already being generated for this conversation."),
    AI_INDEX_RETRY_NOT_ALLOWED(HttpStatus.CONFLICT,
            "Only a failed document index can be retried."),
    AI_PROVIDER_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE,
            "The AI service is temporarily unavailable."),
    AI_RATE_LIMIT_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS,
            "The AI usage limit has been reached. Please try again later."),
    AI_USAGE_GUARD_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE,
            "The AI usage guard is temporarily unavailable."),

    // External services and final fallback
    OTP_SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE,
            "The verification service is temporarily unavailable."),
    EMAIL_SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE,
            "The email service is temporarily unavailable."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred.");

    private final HttpStatus httpStatus;
    private final String defaultMessage;

    ErrorCode(HttpStatus httpStatus, String defaultMessage) {
        this.httpStatus = httpStatus;
        this.defaultMessage = defaultMessage;
    }

    public String getCode() {
        return name();
    }

    public String code() {
        return name();
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public HttpStatus httpStatus() {
        return httpStatus;
    }

    public int getStatus() {
        return httpStatus.value();
    }

    public int status() {
        return httpStatus.value();
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }

    public String defaultMessage() {
        return defaultMessage;
    }
}
```

## src/main/java/com/kbase/shared/pagination/PageResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/shared/pagination/PageResponse.java)

```java
package com.kbase.shared.pagination;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Stable pagination envelope shared by all list endpoints.
 *
 * @param <T> mapped item type
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,

        @JsonProperty("first")
        boolean first,

        @JsonProperty("last")
        boolean last) {

    public PageResponse {
        content = content == null ? List.of() : List.copyOf(content);
    }

    /** Maps a repository page to the standard envelope with mapped items. */
    public static <S, T> PageResponse<T> from(Page<S> page, Function<S, T> mapper) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast());
    }
}
```

## src/main/java/com/kbase/shared/pagination/PaginationParser.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/shared/pagination/PaginationParser.java)

```java
package com.kbase.shared.pagination;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

import com.kbase.shared.exception.BusinessException;
import com.kbase.shared.exception.ErrorCode;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

/**
 * Parses list-endpoint pagination parameters against the Core v1 baseline:
 * {@code page=0}, {@code size=20}, max size 100, sort whitelist per resource.
 */
@Component
public class PaginationParser {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    /**
     * Builds a Pageable from raw query parameters.
     *
     * @param sort        raw {@code field,direction} value; may be null
     * @param allowedSortFields whitelist of sortable fields
     * @param defaultSort applied when sort is absent
     */
    public Pageable parse(Integer page, Integer size, String sort,
            List<String> allowedSortFields, Sort defaultSort) {
        int pageNumber = page == null ? DEFAULT_PAGE : Math.max(DEFAULT_PAGE, page);
        int pageSize = size == null ? DEFAULT_SIZE : Math.min(MAX_SIZE, Math.max(1, size));

        Sort requestedSort = parseSort(sort, allowedSortFields);
        return PageRequest.of(pageNumber, pageSize, requestedSort.isUnsorted() ? defaultSort : requestedSort);
    }

    private Sort parseSort(String sort, List<String> allowedSortFields) {
        if (sort == null || sort.isBlank()) {
            return Sort.unsorted();
        }
        String[] parts = sort.split(",", 2);
        String field = parts[0].trim();
        Sort.Direction direction = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        String canonicalField = allowedSortFields.stream()
                .filter(allowedField -> allowedField.equalsIgnoreCase(field))
                .findFirst()
                .orElse(null);
        if (canonicalField == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Sort field is not supported for this resource.");
        }
        // The persistence property always comes from the resource whitelist;
        // a client-provided spelling is never forwarded as a raw Sort path.
        return Sort.by(direction, canonicalField);
    }

    /** Normalizes a free-text {@code q} filter into a blank-or-lowercase token. */
    public static String normalizeQuery(String q) {
        Objects.requireNonNull(q, "q");
        String trimmed = q.trim();
        return trimmed.isEmpty() ? null : trimmed.toLowerCase(Locale.ROOT);
    }
}
```

## src/main/java/com/kbase/shared/response/ApiErrorResponse.java

[Source](https://github.com/KBase-Knowledge-Base/KBase-BE/blob/636ea26469823bc475732d1e0f79f147556d1f63/src/main/java/com/kbase/shared/response/ApiErrorResponse.java)

```java
package com.kbase.shared.response;

import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Stable, implementation-safe REST error response. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String code,
        String message,
        String path,
        String requestId,
        Map<String, String> errors) {

    public ApiErrorResponse {
        timestamp = Objects.requireNonNull(timestamp, "timestamp");
        code = Objects.requireNonNull(code, "code");
        message = Objects.requireNonNull(message, "message");
        path = Objects.requireNonNull(path, "path");
        requestId = Objects.requireNonNull(requestId, "requestId");
        errors = errors == null
                ? null
                : Collections.unmodifiableMap(new LinkedHashMap<>(errors));
    }
}
```
