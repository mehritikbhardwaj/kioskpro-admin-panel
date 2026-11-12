'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, LogOut, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  iconType?: 'alert' | 'block' | 'clock' | 'logout' | 'check';
  isLoading?: boolean;
  inputLabel?: string;
  inputValue?: string;
  inputPlaceholder?: string;
  onInputChange?: (value: string) => void;
  inputRequired?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  iconType = 'alert',
  isLoading = false,
  inputLabel,
  inputValue,
  inputPlaceholder,
  onInputChange,
  inputRequired = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-100 text-rose-600',
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-100 text-emerald-600',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
        };
      case 'primary':
      default:
        return {
          iconBg: 'bg-teal-100 text-teal-700',
          confirmBtn: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20',
        };
    }
  };

  const renderIcon = () => {
    switch (iconType) {
      case 'block':
        return <ShieldAlert className="h-6 w-6" />;
      case 'clock':
        return <Clock className="h-6 w-6" />;
      case 'logout':
        return <LogOut className="h-6 w-6" />;
      case 'check':
        return <CheckCircle2 className="h-6 w-6" />;
      case 'alert':
      default:
        return <AlertTriangle className="h-6 w-6" />;
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 scale-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${styles.iconBg}`}>
              {renderIcon()}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                {title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Please confirm your action</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-xs text-slate-700 leading-relaxed font-medium">
          {message}
        </div>

        {inputLabel && (
          <div className="pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {inputLabel} {inputRequired && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="text"
              required={inputRequired}
              placeholder={inputPlaceholder}
              value={inputValue || ''}
              onChange={(e) => onInputChange?.(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-inner"
              autoFocus
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || (inputRequired && !inputValue?.trim())}
            className={`rounded-xl px-4 py-2 text-xs font-bold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmBtn}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
