import React, { useState, useCallback } from 'react';
import { HOUR_BRANCHES } from '../data/hourBranches.js';
import { SOLAR_TERMS } from '../data/solarTerms.js';

/**
 * Form nhập liệu: việc cần xem, ngày giờ, người lập, tiết khí, động tâm
 */
export default function CastingForm({ formData, onChange, showLucHaoOptions }) {
  function set(key, value) {
    onChange({ ...formData, [key]: value });
  }

  function setMovingTime(key, value) {
    onChange({
      ...formData,
      movingMindTime: { ...formData.movingMindTime, [key]: value },
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Việc cần xem */}
      <div>
        <label className="form-label">Việc cần xem *</label>
        <textarea
          className="form-input"
          rows={2}
          placeholder="Ví dụ: Hỏi về công việc năm nay..."
          value={formData.question}
          onChange={e => set('question', e.target.value)}
          style={{ resize: 'vertical', minHeight: 60 }}
        />
      </div>

      {/* Người lập */}
      <div>
        <label className="form-label">Người lập quẻ</label>
        <input
          className="form-input"
          type="text"
          placeholder="Họ tên (tuỳ chọn)"
          value={formData.caster}
          onChange={e => set('caster', e.target.value)}
        />
      </div>

      {/* Ngày giờ lập quẻ */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 2 }}>
          <label className="form-label">Ngày lập quẻ</label>
          <input
            className="form-input"
            type="date"
            value={formData.castDate}
            onChange={e => set('castDate', e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">Giờ</label>
          <input
            className="form-input"
            type="time"
            value={formData.castTime}
            onChange={e => set('castTime', e.target.value)}
          />
        </div>
      </div>

      {/* Thuật toán gieo quẻ Lục Hào (Chỉ hiển thị khi gieo Lục Hào) */}
      {showLucHaoOptions && (
        <div>
          <label className="form-label">Thuật toán gieo Lục Hào</label>
          <select
            className="form-input"
            value={formData.lucHaoAlgorithm || 'three-coin'}
            onChange={e => set('lucHaoAlgorithm', e.target.value)}
          >
            <option value="three-coin">🪙 3 Đồng xu truyền thống (Cân bằng)</option>
            <option value="yarrow-stalks">🌿 Phác thảo Cỏ Thi (Cổ xưa)</option>
            <option value="equal-prob">⚖️ Đồng xác suất (25% mỗi loại)</option>
          </select>
        </div>
      )}

      {/* Toggle tiết khí */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        userSelect: 'none',
      }}>
        <ToggleSwitch
          checked={formData.useSolarTerm}
          onChange={v => set('useSolarTerm', v)}
        />
        <span style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)' }}>
          Dùng lịch tiết khí
        </span>
      </label>

      {formData.useSolarTerm && (
        <div style={{ paddingLeft: 0 }}>
          <label className="form-label">Tiết khí</label>
          <select
            className="form-input"
            value={formData.solarTermId || ''}
            onChange={e => {
              const st = SOLAR_TERMS.find(t => t.id === e.target.value) || null;
              onChange({ ...formData, solarTermId: e.target.value, solarTerm: st });
            }}
          >
            <option value="">— Chọn tiết khí —</option>
            {SOLAR_TERMS.map(t => (
              <option key={t.id} value={t.id}>{t.nameVi}</option>
            ))}
          </select>
        </div>
      )}

      <hr className="divider" />

      {/* Ngày động tâm */}
      <div>
        <label className="form-label">Ngày động tâm</label>
        <input
          className="form-input"
          type="date"
          value={formData.movingMindDate}
          onChange={e => set('movingMindDate', e.target.value)}
        />
      </div>

      {/* Giờ động tâm */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, cursor: 'pointer' }}>
          <ToggleSwitch
            checked={formData.movingMindTime?.enabled}
            onChange={v => setMovingTime('enabled', v)}
          />
          <span className="form-label" style={{ margin: 0 }}>Giờ động tâm</span>
        </label>

        {formData.movingMindTime?.enabled && (
          <select
            className="form-input"
            value={formData.movingMindTime?.hourBranch || ''}
            onChange={e => setMovingTime('hourBranch', e.target.value)}
          >
            <option value="">— Chọn giờ —</option>
            {HOUR_BRANCHES.map(h => (
              <option key={h.value} value={h.label}>{h.label}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: 'none',
        background: checked ? 'var(--color-vermillion)' : 'rgba(44,24,16,0.15)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3,
        left: checked ? 21 : 3,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}
