import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  FileText,
  Search,
  Bot,
  Sparkles,
  ArrowRight,
  FolderTree,
  ShieldCheck,
  CheckCircle2,
  FileQuestion,
  Check,
  AlertCircle,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 py-8">
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 text-center lg:text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-subtle border border-accent-light text-accent text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nền tảng quản lý tri thức & Trợ lý tài liệu AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink tracking-tight leading-[1.15]">
              Tri thức của nhóm,{' '}
              <span className="text-accent underline decoration-accent-light decoration-4 underline-offset-4">
                trong một nơi
              </span>{' '}
              dễ tìm.
            </h1>

            <p className="text-base sm:text-lg text-ink-muted max-w-2xl leading-relaxed">
              Biến hàng trăm tài liệu PDF, Word, báo cáo phân tán thành không gian tri thức có tổ chức.
              Hỏi đáp với Trợ lý AI và nhận câu trả lời kèm nguồn trích dẫn chính xác từng số trang.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 justify-center lg:justify-start">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto shadow-md">
                  Tạo tài khoản miễn phí
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Đăng nhập không gian làm việc
                </Button>
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-ink-muted">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-semantic-success" />
                <span>Trích dẫn nguồn trực tiếp</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-semantic-success" />
                <span>Không chia sẻ dữ liệu ra ngoài</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-semantic-success" />
                <span>Giao diện White Neumorphism hiện đại</span>
              </div>
            </div>
          </div>

          {/* 2. ORIGINAL HERO VISUAL (CONVERGING DOCUMENTS INTO KNOWLEDGE HUB) */}
          <div className="lg:col-span-5 relative">
            <div className="neu-card rounded-hero p-6 sm:p-8 bg-white border border-border space-y-5 shadow-neu-elevated relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[11px] font-mono text-ink-muted">KBase — Trực quan hóa tri thức</span>
              </div>

              {/* Scattered docs converging to Hub */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-card bg-surface-subtle/80 border border-border-subtle shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-semibold text-ink">Quy chuẩn kỹ thuật 2026.pdf</p>
                      <p className="text-[10px] text-ink-muted">Chương 3 — Tiêu chuẩn bảo mật</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Đã lập chỉ mục</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-card bg-surface-subtle/80 border border-border-subtle shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold text-ink">Ke_hoach_trien_khai_v1.docx</p>
                      <p className="text-[10px] text-ink-muted">Giai đoạn 2 — Tích hợp hệ thống</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Đã lập chỉ mục</Badge>
                </div>
              </div>

              {/* AI Answer Card Simulation */}
              <div className="p-4 rounded-card bg-accent-subtle/40 border border-accent-light space-y-2 text-left">
                <div className="flex items-center gap-2 text-accent font-semibold text-xs">
                  <Bot className="w-4 h-4" />
                  <span>Trợ lý AI KBase trả lời:</span>
                </div>
                <p className="text-xs text-ink leading-relaxed">
                  "Theo mục 3.2 trong Quy chuẩn kỹ thuật 2026, toàn bộ dữ liệu xác thực phải sử dụng access token lưu trong bộ nhớ và cơ chế refresh token an toàn."
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-ink-muted uppercase">Nguồn:</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-accent-light font-medium text-accent">
                    Quy chuẩn kỹ thuật 2026.pdf (Trang 14)
                  </span>
                </div>
              </div>

              <div className="text-center pt-1">
                <span className="text-[10px] text-ink-subtle italic">
                  * Minh họa luồng tri thức tài liệu và câu trả lời có nguồn dẫn
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM STRIP */}
      <section id="problem" className="bg-surface-subtle py-16 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              Thực trạng tài liệu rời rạc trong các nhóm làm việc
            </h2>
            <p className="text-sm text-ink-muted mt-2">
              Những vấn đề thường gặp khi tri thức tổ chức bị thất lạc và khó tìm lại.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="neu-card rounded-card p-6 bg-white border border-border space-y-3 text-left">
              <div className="w-10 h-10 rounded-full bg-semantic-danger-bg border border-semantic-danger-border flex items-center justify-center text-semantic-danger">
                <FileQuestion className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-ink">Tài liệu phân tán khắp nơi</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Tệp tin nằm rải rác trên Google Drive, email, máy tính cá nhân khiến thành viên mới hoặc người kế nhiệm mất hàng tuần để nắm bắt.
              </p>
            </div>

            <div className="neu-card rounded-card p-6 bg-white border border-border space-y-3 text-left">
              <div className="w-10 h-10 rounded-full bg-semantic-warning-bg border border-semantic-warning-border flex items-center justify-center text-semantic-warning">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-ink">Tra cứu thủ công tốn thời gian</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Mỗi khi cần tìm một điều khoản hợp đồng hay quy chuẩn kỹ thuật, bạn phải mở từng tệp dài hàng trăm trang và tìm kiếm từng từ khóa.
              </p>
            </div>

            <div className="neu-card rounded-card p-6 bg-white border border-border space-y-3 text-left">
              <div className="w-10 h-10 rounded-full bg-accent-subtle border border-accent-light flex items-center justify-center text-accent">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-ink">Câu trả lời AI thiếu kiểm chứng</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Các chatbot thông thường thường suy đoán hoặc "ảo giác" thông tin. Bạn không thể biết câu trả lời có căn cứ từ văn bản nội bộ nào.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THREE MAIN FEATURE GROUPS */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="accent" className="mb-2">Giải pháp KBase</Badge>
          <h2 className="text-3xl font-extrabold text-ink tracking-tight">
            Ba trụ cột xây dựng cơ sở tri thức vững chắc
          </h2>
          <p className="text-sm text-ink-muted mt-2">
            Được thiết kế từ gốc để phục vụ nhu cầu lưu trữ, phân loại và khai thác thông tin chính xác.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="neu-card rounded-card p-8 bg-white border border-border space-y-4 text-left hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-card neu-flat flex items-center justify-center text-accent">
              <FolderTree className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-ink">1. Tổ chức tri thức khoa học</h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Tổ chức tài liệu theo không gian dự án độc lập, cây thư mục đa cấp, danh mục chuyên đề và hệ thống thẻ từ khóa linh hoạt. Dễ dàng di chuyển, lọc và tìm kiếm theo metadata.
            </p>
            <ul className="text-xs text-ink-muted space-y-2 pt-2 border-t border-border-subtle">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>Hỗ trợ tệp đơn và tải lên hàng loạt (Batch upload)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>Xem trước trực tiếp tài liệu PDF, Markdown, hình ảnh</span>
              </li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="neu-card rounded-card p-8 bg-white border border-border space-y-4 text-left hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-card neu-flat flex items-center justify-center text-ink">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-ink">2. Phân quyền và bảo mật chặt chẽ</h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Phân định vai trò rõ ràng giữa Chủ sở hữu (Owner) và Thành viên (Member). Mời đồng nghiệp tham gia dự án qua email an toàn với mã xác thực có thời hạn.
            </p>
            <ul className="text-xs text-ink-muted space-y-2 pt-2 border-t border-border-subtle">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-semantic-success shrink-0" />
                <span>Hội thoại AI hoàn toàn riêng tư theo từng người dùng</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-semantic-success shrink-0" />
                <span>Mã hóa đường dẫn và bảo vệ tệp tin bằng Bearer token</span>
              </li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="neu-card rounded-card p-8 bg-white border border-border space-y-4 text-left hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-card neu-flat flex items-center justify-center text-accent">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-ink">3. Trợ lý AI có trích dẫn nguồn</h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Trợ lý dự án tự động lập chỉ mục văn bản và trả lời câu hỏi kèm danh sách nguồn trích dẫn cụ thể. Khi không tìm thấy căn cứ, hệ thống thông báo trung thực thay vì bịa đặt.
            </p>
            <ul className="text-xs text-ink-muted space-y-2 pt-2 border-t border-border-subtle">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>Trích dẫn trực tiếp số trang và đoạn văn bản gốc</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>KBase Guide hỗ trợ hướng dẫn sử dụng hệ thống</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. WORKFLOW: TẢI LÊN → SẮP XẾP → HỎI CÓ NGUỒN */}
      <section id="workflow" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-ink tracking-tight">
            Quy trình làm việc 3 bước đơn giản
          </h2>
          <p className="text-sm text-ink-muted mt-2">
            Từ tài liệu thô ban đầu đến câu trả lời thông minh được xác thực.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="neu-card rounded-card p-6 bg-white border border-border space-y-3 text-left relative group hover:border-accent transition-colors">
            <div className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-base font-bold text-ink">Tải lên tài liệu</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Tải lên các tệp báo cáo, tài liệu nghiên cứu hoặc hướng dẫn kỹ thuật vào dự án của bạn dưới dạng tệp đơn hoặc nhiều tệp cùng lúc.
            </p>
          </div>

          {/* Step 2 */}
          <div className="neu-card rounded-card p-6 bg-white border border-border space-y-3 text-left relative group hover:border-accent transition-colors">
            <div className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-base font-bold text-ink">Sắp xếp & Lập chỉ mục</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Gán tài liệu vào các thư mục, danh mục và thẻ từ khóa. Hệ thống tự động xử lý và trích xuất chỉ mục vector cho AI.
            </p>
          </div>

          {/* Step 3 */}
          <div className="neu-card rounded-card p-6 bg-white border border-border space-y-3 text-left relative group hover:border-accent transition-colors">
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="text-base font-bold text-ink">Hỏi đáp có nguồn dẫn</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Mở Trợ lý AI của dự án, nhập câu hỏi bằng ngôn ngữ tự nhiên và nhận câu trả lời có trích dẫn từng trang tài liệu để kiểm chứng ngay.
            </p>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA STRIP */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="neu-elevated rounded-hero p-8 sm:p-12 text-center bg-white border border-border space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            Sẵn sàng tổ chức tri thức cho nhóm của bạn?
          </h2>
          <p className="text-sm sm:text-base text-ink-muted max-w-xl mx-auto leading-relaxed">
            Đăng ký tài khoản ngay hôm nay để trải nghiệm không gian lưu trữ hiện đại cùng Trợ lý AI có trích dẫn nguồn tin cậy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Bắt đầu ngay bây giờ
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
