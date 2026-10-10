// src/components/modals/SpotManagerModal.tsx

import React, { useState } from 'react';
import {
  X,
  MapPin,
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit2,
  Plus,
  RotateCcw,
  Navigation,
  Check,
} from 'lucide-react';
import { SkiSpot, SpotFormData } from '../../types/spot';
import { SpotStorageService } from '../../services/spotStorageService';
import { WeatherService } from '../../services/weatherService';

export interface SpotManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpotsUpdated: (spots: SkiSpot[], activeSpotId: string) => void;
}

export const SpotManagerModal: React.FC<SpotManagerModalProps> = ({
  isOpen,
  onClose,
  onSpotsUpdated,
}) => {
  const [spots, setSpots] = useState<SkiSpot[]>(() => SpotStorageService.getSpots());
  const [activeSpotId, setActiveSpotId] = useState<string>(() => SpotStorageService.getActiveSpotId());

  // Form states
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SpotFormData>({ name: '', lat: '', lon: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);

  if (!isOpen) return null;

  const refreshSpots = () => {
    const updated = SpotStorageService.getSpots();
    const activeId = SpotStorageService.getActiveSpotId();
    setSpots(updated);
    setActiveSpotId(activeId);
    onSpotsUpdated(updated, activeId);
  };

  const handleSelectActive = (spotId: string) => {
    SpotStorageService.setActiveSpotId(spotId);
    setActiveSpotId(spotId);
    onSpotsUpdated(spots, spotId);
  };

  const handleStartAdd = () => {
    setEditingSpotId(null);
    setFormData({ name: '', lat: '', lon: '' });
    setFormError(null);
  };

  const handleStartEdit = (spot: SkiSpot) => {
    setEditingSpotId(spot.id);
    setFormData({ name: spot.name, lat: String(spot.lat), lon: String(spot.lon) });
    setFormError(null);
  };

  const handleCancelForm = () => {
    setEditingSpotId(null);
    setFormData({ name: '', lat: '', lon: '' });
    setFormError(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (editingSpotId) {
      const res = SpotStorageService.updateSpot(editingSpotId, formData);
      if (!res.validation.isValid) {
        const firstErr =
          res.validation.errors.name ||
          res.validation.errors.lat ||
          res.validation.errors.lon ||
          res.validation.errors.general;
        setFormError(firstErr || '入力内容を確認してください');
        return;
      }
      setEditingSpotId(null);
    } else {
      const res = SpotStorageService.addSpot(formData);
      if (!res.validation.isValid) {
        const firstErr =
          res.validation.errors.name ||
          res.validation.errors.lat ||
          res.validation.errors.lon ||
          res.validation.errors.general;
        setFormError(firstErr || '入力内容を確認してください');
        return;
      }
    }

    setFormData({ name: '', lat: '', lon: '' });
    refreshSpots();
  };

  const handleDelete = (id: string) => {
    const res = SpotStorageService.deleteSpot(id);
    if (!res.success) {
      alert(res.error);
      return;
    }
    refreshSpots();
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    SpotStorageService.moveSpot(index, direction);
    refreshSpots();
  };

  const handleResetPresets = () => {
    if (window.confirm('初期プリセット5拠点（やぶはら・高鷲・ダイナ・よませ・白馬岩岳）に戻しますか？')) {
      SpotStorageService.resetToPresets();
      refreshSpots();
      setEditingSpotId(null);
      setFormData({ name: '', lat: '', lon: '' });
    }
  };

  const handleFillGpsCoords = async () => {
    setIsGettingGps(true);
    setFormError(null);
    try {
      const coords = await WeatherService.getCurrentPosition();
      setFormData((prev) => ({
        ...prev,
        lat: String(Number(coords.lat.toFixed(4))),
        lon: String(Number(coords.lon.toFixed(4))),
      }));
    } catch {
      setFormError('現在地のGPS座標が取得できませんでした');
    } finally {
      setIsGettingGps(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="spot-manager-modal"
    >
      <div className="modal-dialog spot-dialog">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <MapPin size={22} color="var(--cd-amber-primary)" />
            <span>スポット管理 (Ski Spots CRUD)</span>
          </div>
          <button
            onClick={onClose}
            className="modal-close-btn"
            title="閉じる"
            data-testid="btn-close-spot-modal"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="spot-modal-content">
          {/* Spot List */}
          <div className="spot-list" data-testid="spot-list">
            {spots.map((spot, index) => {
              const isActive = spot.id === activeSpotId;
              const isFirst = index === 0;
              const isLast = index === spots.length - 1;

              return (
                <div
                  key={spot.id}
                  className={`spot-item-card ${isActive ? 'active-spot' : ''}`}
                  data-testid={`spot-item-${spot.id}`}
                >
                  <div
                    className="spot-info"
                    onClick={() => handleSelectActive(spot.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="spot-name-row">
                      <span className="spot-name">{spot.name}</span>
                      {isActive && <span className="spot-active-tag">選択中</span>}
                    </div>
                    <div className="spot-coords">
                      緯度: {spot.lat.toFixed(4)} / 経度: {spot.lon.toFixed(4)}
                    </div>
                  </div>

                  <div className="spot-actions">
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'up')}
                      disabled={isFirst}
                      className="spot-ctrl-btn"
                      title="上へ移動"
                      data-testid={`btn-move-up-${index}`}
                    >
                      <ChevronUp size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'down')}
                      disabled={isLast}
                      className="spot-ctrl-btn"
                      title="下へ移動"
                      data-testid={`btn-move-down-${index}`}
                    >
                      <ChevronDown size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(spot)}
                      className="spot-ctrl-btn"
                      title="編集"
                      data-testid={`btn-edit-spot-${spot.id}`}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(spot.id)}
                      disabled={spots.length <= 1}
                      className="spot-ctrl-btn delete"
                      title={spots.length <= 1 ? '最低1件のスポットが必要です' : '削除'}
                      data-testid={`btn-delete-spot-${spot.id}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add / Edit Form */}
          <form className="spot-form-card" onSubmit={handleSaveForm} data-testid="spot-form">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="spot-form-title">
                {editingSpotId ? '✏️ スポット情報の編集' : '➕ 新規スポット追加'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {editingSpotId && (
                  <button
                    type="button"
                    onClick={handleStartAdd}
                    className="btn-secondary"
                    style={{ fontSize: '0.85rem', minHeight: '52px', padding: '0 14px' }}
                    title="新規スポット追加フォームに切り替え"
                  >
                    新規追加へ
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFillGpsCoords}
                  disabled={isGettingGps}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem', minHeight: '52px', padding: '0 14px' }}
                  title="現在地GPSの座標を自動入力"
                  data-testid="btn-fill-gps"
                >
                  <Navigation size={14} />
                  <span>{isGettingGps ? '取得中...' : '現在地座標を取得'}</span>
                </button>
              </div>
            </div>

            <div className="form-row">
              <label className="form-label">スポット名称</label>
              <input
                type="text"
                className="form-input"
                placeholder="例: 野沢温泉スキー場"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-spot-name"
                required
              />
            </div>

            <div className="form-coords-grid">
              <div className="form-row">
                <label className="form-label">緯度 (Latitude: -90 〜 90)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="36.9205"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  data-testid="input-spot-lat"
                  required
                />
              </div>
              <div className="form-row">
                <label className="form-label">経度 (Longitude: -180 〜 180)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="138.4447"
                  value={formData.lon}
                  onChange={(e) => setFormData({ ...formData, lon: e.target.value })}
                  data-testid="input-spot-lon"
                  required
                />
              </div>
            </div>

            {formError && <div className="form-error" data-testid="form-error">⚠️ {formError}</div>}

            <div className="form-buttons">
              {editingSpotId && (
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="btn-secondary"
                  data-testid="btn-cancel-edit"
                >
                  キャンセル
                </button>
              )}
              <button type="submit" className="btn-primary" data-testid="btn-save-spot">
                {editingSpotId ? (
                  <>
                    <Check size={18} />
                    <span>変更を保存</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>スポットを追加</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="spot-modal-footer">
          <button
            type="button"
            onClick={handleResetPresets}
            className="btn-secondary"
            title="初期の5拠点プリセットに復元"
            data-testid="btn-reset-presets"
          >
            <RotateCcw size={16} />
            <span>初期プリセットにリセット</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary"
            data-testid="btn-done-spot-modal"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};
