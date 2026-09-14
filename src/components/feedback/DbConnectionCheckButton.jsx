import React, { useState } from 'react';
import { apiClient } from '../../lib/axios';

/**
 * Nút kiểm tra kết nối thời gian thực giữa Frontend -> Backend Spring Boot -> Aiven Cloud MySQL.
 * Hiển thị trạng thái chi tiết (Service, Database, Catalog, Độ trễ phản hồi).
 */
export default function DbConnectionCheckButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const checkConnection = async () => {
    setLoading(true);
    setResult(null);
    setIsOpen(true);
    const startTime = Date.now();

    try {
      // Gọi endpoint health check của backend
      const res = await apiClient.get('/public/health');
      const latency = Date.now() - startTime;

      setResult({
        success: res.database === 'CONNECTED',
        status: res.status || 'UP',
        database: res.database || 'DISCONNECTED',
        databaseInfo: res.databaseInfo || 'MySQL Cloud',
        databaseCatalog: res.databaseCatalog || 'defaultdb',
        latency: `${latency}ms`,
        message: res.database === 'CONNECTED' 
          ? 'Đã kết nối thành công tới Cơ sở dữ liệu Aiven Cloud MySQL!'
          : 'Server đang chạy nhưng không kết nối được Database!',
        error: res.databaseError,
      });
    } catch (err) {
      const latency = Date.now() - startTime;
      setResult({
        success: false,
        status: 'DOWN',
        database: 'UNREACHABLE',
        latency: `${latency}ms`,
        message: 'Không thể kết nối tới Backend Spring Boot (localhost:8080)',
        error: err.message || 'Server chưa khởi động hoặc bị chặn mạng',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Nút bấm kiểm tra kết nối */}
      <button
        onClick={checkConnection}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 hover:border-gold/60 text-xs font-semibold transition-all duration-200 shadow-sm active:scale-95"
        title="Bấm để kiểm tra kết nối tới Backend và Aiven Cloud Database"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
        </span>
        Kiểm tra kết nối DB (Aiven)
      </button>

      {/* Modal hiển thị kết quả kiểm tra */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#18181B] border border-surface-border rounded-xl max-w-md w-full p-5 shadow-2xl relative text-left">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-surface-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h3 className="text-sm font-bold text-[#EDEDED] uppercase tracking-wide">
                  Trạng thái kết nối Hệ thống
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* Nội dung kết quả */}
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gold font-medium">Đang gửi tín hiệu kiểm tra tới Aiven Cloud...</p>
              </div>
            ) : result ? (
              <div className="space-y-3 text-xs">
                {/* Banner trạng thái chính */}
                <div
                  className={`p-3 rounded-lg border flex items-start gap-3 ${
                    result.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <span className="text-xl">{result.success ? '✅' : '❌'}</span>
                  <div>
                    <p className="font-bold text-sm">
                      {result.success ? 'KẾT NỐI THÀNH CÔNG!' : 'KẾT NỐI THẤT BẠI!'}
                    </p>
                    <p className="text-[11px] opacity-90 mt-0.5">{result.message}</p>
                  </div>
                </div>

                {/* Bảng chi tiết thông số */}
                <div className="bg-[#121214] border border-surface-border rounded-lg p-3 space-y-2 text-[#A0A0A5]">
                  <div className="flex justify-between items-center py-1 border-b border-surface-border/50">
                    <span>Backend Server:</span>
                    <span className={`font-mono font-bold ${result.status === 'UP' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {result.status} (Spring Boot 3.3.4)
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-surface-border/50">
                    <span>Aiven MySQL Database:</span>
                    <span className={`font-mono font-bold ${result.database === 'CONNECTED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {result.database}
                    </span>
                  </div>

                  {result.databaseCatalog && (
                    <div className="flex justify-between items-center py-1 border-b border-surface-border/50">
                      <span>Database Name:</span>
                      <span className="font-mono text-gold font-semibold">{result.databaseCatalog}</span>
                    </div>
                  )}

                  {result.databaseInfo && (
                    <div className="flex justify-between items-center py-1 border-b border-surface-border/50">
                      <span>Database Engine:</span>
                      <span className="font-mono text-[#EDEDED]">{result.databaseInfo}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-1">
                    <span>Độ trễ phản hồi (Latency):</span>
                    <span className="font-mono text-sky-400 font-bold">{result.latency}</span>
                  </div>
                </div>

                {/* Chi tiết lỗi nếu có */}
                {result.error && (
                  <div className="p-2.5 rounded bg-rose-900/20 border border-rose-800/40 text-[11px] text-rose-300 break-all font-mono">
                    <strong>Chi tiết lỗi:</strong> {result.error}
                  </div>
                )}

                {/* Nút bấm thử lại & đóng */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={checkConnection}
                    className="flex-1 py-2 rounded-lg bg-surface-elevated hover:bg-surface-hover text-white text-xs font-medium border border-surface-border"
                  >
                    🔄 Kiểm tra lại
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="py-2 px-5 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold text-xs font-bold border border-gold/40"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
