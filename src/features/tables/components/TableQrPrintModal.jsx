import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Download, Sparkles, ShieldCheck } from 'lucide-react';
import logoTabImg from '@/assets/images/logo_tab.png';

export default function TableQrPrintModal({ table, isOpen, onClose }) {
  const printRef = useRef(null);

  if (!isOpen || !table) return null;

  const qrUrl = window.location.origin + `/table/${table.tableNumber.toLowerCase()}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSvg = () => {
    const svgElement = printRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `QR_${table.tableNumber}_HoaDiemCac.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Container */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#27272A] flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <h3 className="font-semibold text-[#EDEDED] text-sm tracking-wide">
              Biển QR Bàn Ăn Chuẩn In Ấn
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8E8E93] hover:text-[#EDEDED] hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Standee Area */}
        <div className="p-6 flex flex-col items-center justify-center bg-[#0E0E10] overflow-y-auto max-h-[70vh]">
          <div
            ref={printRef}
            id="printable-standee"
            className="w-[320px] bg-gradient-to-b from-[#1C1616] via-[#121214] to-[#0E0E10] border-2 border-gold/40 rounded-2xl p-6 text-center shadow-2xl relative flex flex-col items-center"
          >
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-gold/70" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-gold/70" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-gold/70" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-gold/70" />

            {/* Restaurant Logo & Title */}
            <div className="flex flex-col items-center mb-3">
              <img
                src={logoTabImg}
                alt="Hỏa Diệm Các"
                className="w-12 h-12 object-contain drop-shadow-[0_2px_10px_rgba(212,175,55,0.35)] mb-1"
              />
              <h2 className="text-sm font-bold font-serif text-gold tracking-widest uppercase">
                HỎA DIỆM CÁC
              </h2>
              <p className="text-[9px] tracking-widest text-gold/80 uppercase font-serif">
                Mỹ Vị Lẩu Hoàng Triều
              </p>
            </div>

            {/* Table Name */}
            <div className="mb-4">
              <span className="inline-block px-4 py-1 rounded-full bg-crimson-subtle border border-crimson-border text-gold font-bold text-base tracking-wider shadow-inner">
                {table.name || table.tableNumber}
              </span>
              <p className="text-[10px] text-[#A0A0A5] mt-1">
                {table.area === 'VIP' ? 'Phòng VIP Hoàng Gia' : 'Khu Vực Sảnh Chung'} • Sức chứa {table.capacity} khách
              </p>
            </div>

            {/* High Resolution QR Code with Frame */}
            <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gold/40 flex items-center justify-center mb-4">
              <QRCodeSVG
                value={qrUrl}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Instructions */}
            <div className="space-y-1.5 text-center">
              <div className="flex items-center justify-center gap-1 text-gold text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>QUÉT MÃ ĐỂ XEM THỰC ĐƠN & GỌI MÓN</span>
              </div>
              <p className="text-[10px] text-[#A0A0A5] leading-relaxed max-w-[260px] mx-auto">
                Mở camera điện thoại hoặc Zalo quét mã để gọi món trực tiếp vào bếp nhà hàng.
              </p>

              {/* Anti-abuse Security Tag */}
              <div className="mt-3 pt-3 border-t border-surface-border/60 flex items-center justify-center gap-1 text-[10px] text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Mã QR cố định an toàn • Bảo mật mã PIN 4 số</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-[#27272A] bg-[#121214] flex items-center justify-between gap-3">
          <button
            onClick={handleDownloadSvg}
            className="flex-1 py-2 px-3 rounded-lg border border-[#3F3F46] hover:bg-[#27272A] text-xs font-medium text-[#EDEDED] flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-gold" />
            <span>Tải file SVG In</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-crimson to-[#B91C1C] hover:from-[#B91C1C] hover:to-crimson text-white text-xs font-semibold shadow-lg shadow-crimson/20 flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>In Biển Để Bàn</span>
          </button>
        </div>
      </div>
    </div>
  );
}
