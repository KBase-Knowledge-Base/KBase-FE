import { ApiErrorResponse } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly path?: string;
  readonly requestId?: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(response: ApiErrorResponse) {
    const userMessage = getLocalizedErrorMessage(response.code, response.message);
    super(userMessage);
    this.name = 'ApiError';
    this.status = response.status;
    this.code = response.code;
    this.path = response.path;
    this.requestId = response.requestId;
    this.fieldErrors = response.errors;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getLocalizedErrorMessage(code: string, fallbackMessage?: string): string {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return 'Email hoặc mật khẩu không chính xác.';
    case 'AUTHENTICATION_REQUIRED':
      return 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.';
    case 'ACCESS_TOKEN_EXPIRED':
    case 'INVALID_ACCESS_TOKEN':
      return 'Phiên truy cập đã hết hạn. Đang làm mới phiên...';
    case 'REFRESH_TOKEN_EXPIRED':
    case 'INVALID_REFRESH_TOKEN':
      return 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
    case 'ACCOUNT_DISABLED':
      return 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.';
    case 'EMAIL_NOT_VERIFIED':
      return 'Email chưa được xác thực. Vui lòng xác thực mã OTP trước khi tiếp tục.';
    case 'ACCESS_DENIED':
      return 'Bạn không có quyền thực hiện thao tác này.';
    case 'CURRENT_PASSWORD_INVALID':
      return 'Mật khẩu hiện tại không đúng.';
    case 'RESOURCE_NOT_FOUND':
      return 'Không tìm thấy dữ liệu yêu cầu hoặc dữ liệu đã bị xóa.';
    case 'RESOURCE_ALREADY_EXISTS':
    case 'DUPLICATE_RESOURCE':
      return 'Dữ liệu đã tồn tại trong hệ thống.';
    case 'USER_OWNS_PROJECT':
      return 'Không thể xóa người dùng đang là chủ sở hữu (Owner) của một hoặc nhiều dự án.';
    case 'USER_HAS_DEPENDENCIES':
      return 'Không thể xóa người dùng có dữ liệu phụ thuộc trong hệ thống.';
    case 'FOLDER_NOT_EMPTY':
      return 'Thư mục không rỗng. Vui lòng di chuyển hoặc xóa các mục con trước.';
    case 'CYCLE_DETECTED':
      return 'Không thể di chuyển thư mục vào chính nó hoặc thư mục con của nó.';
    case 'CATEGORY_IN_USE':
      return 'Danh mục đang được sử dụng bởi các tài liệu. Không thể xóa.';
    case 'INVITATION_EXPIRED':
      return 'Lời mời đã hết hạn. Vui lòng yêu cầu chủ dự án gửi lại lời mời mới.';
    case 'INVITATION_ALREADY_ACCEPTED':
      return 'Lời mời này đã được chấp nhận trước đó.';
    case 'INVITATION_CANCELLED':
      return 'Lời mời này đã bị hủy bởi người gửi.';
    case 'EMAIL_MISMATCH':
      return 'Tài khoản hiện tại không khớp với địa chỉ email nhận lời mời.';
    case 'OTP_EXPIRED':
      return 'Mã xác thực OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.';
    case 'OTP_INVALID':
      return 'Mã xác thực OTP không chính xác.';
    case 'OTP_MAX_ATTEMPTS_EXCEEDED':
      return 'Bạn đã nhập sai mã OTP quá số lần cho phép. Vui lòng yêu cầu gửi lại mã.';
    case 'AI_RATE_LIMIT_EXCEEDED':
      return 'Hệ thống AI đang quá tải hoặc bạn đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau giây lát.';
    case 'AI_PROVIDER_UNAVAILABLE':
      return 'Dịch vụ AI hiện không khả dụng. Bạn vẫn có thể truy cập và quản lý tài liệu bình thường.';
    case 'AI_USAGE_GUARD_UNAVAILABLE':
      return 'Hệ thống kiểm soát sử dụng AI hiện không phản hồi. Vui lòng thử lại sau.';
    case 'AI_CONVERSATION_LIMIT_EXCEEDED':
      return 'Bạn đã đạt giới hạn tối đa 5 cuộc hội thoại cho dự án này.';
    case 'AI_CONVERSATION_PROCESSING':
      return 'Trợ lý AI đang xử lý câu hỏi trước đó. Vui lòng đợi trong giây lát.';
    case 'VALIDATION_FAILED':
      return 'Dữ liệu nhập vào chưa hợp lệ. Vui lòng kiểm tra lại.';
    default:
      return fallbackMessage || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
  }
}
