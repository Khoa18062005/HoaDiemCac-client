import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, Delete, Sparkles, X } from 'lucide-react';
import { tableApi, saveTableSession } from '../api/tableApi';

export default function TablePasscodeModal({ isOpen, onClose, tableCode, onSuccess }) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = (num) => {
    if (pin.length < 4 && !loading) {
      const next = pin + num;
      setPin(next);
      setErrorMsg('');
      if (next.length === 4) {
        verify(next);
      }
    }
  };

  const verify = async (codeToVerify) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await tableApi.verifyPasscode(tableCode || 'B01', codeToVerify);
      saveTableSession({
        tableNumber: res.tableNumber || tableCode,
        tableName: res.tableName,
        sessionToken: res.sessionToken,
        deviceToken: res.deviceToken,
        verifiedAt: new Date().toISOString(),
      });
      if (onSuccess) onSuccess(res);
      if (onClose) onClose();
    } catch (err) {
      setPin('');
      setErrorMsg(err.response?.data?.message || err.message || 'Mã PIN không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#18181B] border border-gold/30 rounded-2xl w-full max-w-xs p-6 shadow-2xl flex flex-col items-center relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#8E8E93] hover:text-[#EDEDED]"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-gold mb-3">
          <Lock className="w-5 h-5" />
        </div>

        <h3 className="font-serif text-base font-bold text-gold">Xác Thực Bàn Ăn</h3>
        <p className="text-xs text-[#A0A0A5] text-center mt-1 mb-4">
          Nhập mã PIN 4 số của bàn <strong className="text-white">{tableCode}</strong> để gọi món
        </p>

        {/* 4 dots */}
        <div className="flex gap-2.5 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-11 h-12 rounded-lg border flex items-center justify-center text-lg font-bold font-mono ${
                pin[i]
                  ? 'border-gold bg-[#221C16] text-gold'
                  : 'border-[#27272A] bg-[#121214] text-[#71717A]'
              }`}
            >
              {pin[i] ? '•' : ''}
            </div>
          ))}
        </div>

        {errorMsg && (
          <div className="w-full mb-3 px-2 py-1.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] text-center flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleKeyPress(String(n))}
              className="h-11 rounded-lg bg-[#27272A]/70 hover:bg-[#323238] active:scale-95 text-base font-mono font-medium text-[#EDEDED] transition-all"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="h-11 rounded-lg bg-[#27272A]/40 text-[11px] font-medium text-[#8E8E93] hover:text-[#EDEDED]"
          >
            XÓA
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="h-11 rounded-lg bg-[#27272A]/70 hover:bg-[#323238] active:scale-95 text-base font-mono font-medium text-[#EDEDED]"
          >
            0
          </button>
          <button
            onClick={() => setPin((p) => p.slice(0, -1))}
            className="h-11 rounded-lg bg-[#27272A]/40 flex items-center justify-center text-[#8E8E93] hover:text-rose-400"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
