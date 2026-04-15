import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    ArrowLeft, Folder, Layers, TrendingUp, Package,
    Trash2, X, ZoomIn, Calendar, Ruler, Hash,
    Camera, Upload, RotateCcw, CheckCircle, Plus, Save,
    Download, MousePointer, Pencil
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import './ProjectDetail.css';
import backgroundImg from '../../assets/images/background.png';

function calcArea(pts, ppc) {
    if (!pts || pts.length < 3 || !ppc) return 0;
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        s += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    }
    return Math.abs(s) / 2 / (ppc * ppc);
}

function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    if (max !== min) {
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 180), s: Math.round(s * 255), v: Math.round(v * 255) };
}

/* ══════════════════════════════════════════════════════════
   MANUAL DRAW PANEL
══════════════════════════════════════════════════════════ */
function ManualDrawPanel({ project, onSaved }) {
    const { t } = useTranslation();
    const [image, setImage] = useState(null);
    const [step, setStep] = useState('upload');
    const [points, setPoints] = useState([]);
    const [pixelsPerCm, setPixelsPerCm] = useState(null);
    const [area, setArea] = useState(null);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [fileName, setFileName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [saving, setSaving] = useState(false);
    const [hoverIdx, setHoverIdx] = useState(-1);
    const [dragIdx, setDragIdx] = useState(-1);

    const [rulerPos, setRulerPos] = useState({ x: 100, y: 100 });
    const [rulerLength, setRulerLength] = useState(300);
    const [rulerAngle, setRulerAngle] = useState(0);
    const [isDraggingRuler, setIsDraggingRuler] = useState(false);
    const [rulerDragOffset, setRulerDragOffset] = useState({ x: 0, y: 0 });

    const [zoom, setZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

    const [editingMeasurement, setEditingMeasurement] = useState(null);
    const [editName, setEditName] = useState('');
    const [editQuantity, setEditQuantity] = useState(1);
    const [editSaving, setEditSaving] = useState(false);
    const [savedMeasurements, setSavedMeasurements] = useState([]);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const uploadRef = useRef(null);
    const cameraRef = useRef(null);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;
        const ctx = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        const W = image.width;
        const displayScale = canvas.width / (canvas.getBoundingClientRect().width || canvas.width);

        if (step === 'calibrate') {
            ctx.save();
            ctx.translate(rulerPos.x, rulerPos.y);
            ctx.rotate((rulerAngle * Math.PI) / 180);
            const rw = Math.max(28, W / 28);
            ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3;
            ctx.fillStyle = 'rgba(255,255,255,0.97)';
            ctx.fillRect(-rw / 2, 0, rw, rulerLength);
            ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
            ctx.strokeStyle = '#6366f1'; ctx.lineWidth = Math.max(2, W / 300);
            ctx.strokeRect(-rw / 2, 0, rw, rulerLength);
            const ppc = rulerLength / 30; const fs = Math.max(10, W / 80);
            for (let i = 0; i <= 30; i++) {
                const y = i * ppc; const major = i % 5 === 0;
                ctx.strokeStyle = major ? '#4f46e5' : '#bbb';
                ctx.lineWidth = major ? Math.max(1.5, W / 500) : 1;
                ctx.beginPath();
                ctx.moveTo(major ? -rw / 2 : -rw / 4, y);
                ctx.lineTo(major ? rw / 2 : rw / 4, y);
                ctx.stroke();
                if (major && i > 0) {
                    ctx.fillStyle = '#1e1b4b'; ctx.font = `bold ${fs}px Arial`;
                    ctx.textAlign = 'center'; ctx.fillText(i, 0, y - fs * 0.3);
                }
                if (i === 0) {
                    ctx.fillStyle = '#1e1b4b'; ctx.font = `bold ${fs}px Arial`;
                    ctx.textAlign = 'left'; ctx.fillText('0', rw / 2 + 4, fs);
                    ctx.textAlign = 'center';
                }
            }
            const hr = Math.max(8, Math.min(16, 12 * displayScale));
            ctx.fillStyle = '#6366f1';
            ctx.shadowColor = 'rgba(99,102,241,0.55)'; ctx.shadowBlur = 16;
            ctx.beginPath(); ctx.arc(0, rulerLength, hr, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2.5, W / 380); ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = `bold ${hr * 0.85}px Arial`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('≡', 0, rulerLength); ctx.textBaseline = 'alphabetic';
            ctx.restore();
        }

        if (points.length > 0 && (step === 'draw' || step === 'result')) {
            ctx.beginPath();
            points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            if (points.length > 2) ctx.closePath();
            ctx.fillStyle = 'rgba(99,102,241,0.12)';
            if (points.length > 2) ctx.fill();
            ctx.strokeStyle = '#6366f1'; ctx.lineWidth = Math.max(2, W / 300);
            ctx.setLineDash([]); ctx.stroke();

            const R = Math.max(8, Math.min(18, 14 * displayScale));
            points.forEach((p, i) => {
                const isH = i === hoverIdx; const isD = i === dragIdx;
                ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 8;
                ctx.beginPath(); ctx.arc(p.x, p.y, R + 2, 0, Math.PI * 2);
                ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowBlur = 0;
                ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
                ctx.fillStyle = isD ? '#f59e0b' : isH ? '#818cf8' : '#6366f1'; ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${Math.max(10, R * 0.7)}px Arial`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(i + 1, p.x, p.y); ctx.textBaseline = 'alphabetic';
            });

            if (area && points.length > 2) {
                const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
                const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
                const fs = Math.max(18, W / 28);
                const txt = `${(area / 10000).toFixed(4)} m²`;
                ctx.font = `bold ${fs}px Arial`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                const tw = ctx.measureText(txt).width; const pad = fs * 0.5;
                ctx.fillStyle = 'rgba(79,70,229,0.88)';
                if (ctx.roundRect) ctx.roundRect(cx - tw / 2 - pad, cy - fs / 2 - pad * 0.5, tw + pad * 2, fs + pad, 8);
                else ctx.rect(cx - tw / 2 - pad, cy - fs / 2 - pad * 0.5, tw + pad * 2, fs + pad);
                ctx.fill();
                ctx.fillStyle = '#fff'; ctx.fillText(txt, cx, cy);
                ctx.textBaseline = 'alphabetic';
            }
        }
    }, [image, step, points, hoverIdx, dragIdx, area, rulerPos, rulerLength, rulerAngle]);

    useEffect(() => { draw(); }, [draw]);

    const toCanvas = useCallback((clientX, clientY) => {
        const c = canvasRef.current; const r = c.getBoundingClientRect();
        return { x: (clientX - r.left) * (c.width / r.width), y: (clientY - r.top) * (c.height / r.height) };
    }, []);

    const hitTest = useCallback((cx, cy) => {
        const canvas = canvasRef.current;
        const scale = canvas ? canvas.width / (canvas.getBoundingClientRect().width || canvas.width) : 1;
        const R = Math.max(8, Math.min(18, 14 * scale)) + 12;
        for (let i = points.length - 1; i >= 0; i--) {
            const dx = cx - points[i].x, dy = cy - points[i].y;
            if (Math.sqrt(dx * dx + dy * dy) <= R) return i;
        }
        return -1;
    }, [points]);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(z => Math.min(5, Math.max(0.5, z * delta)));
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    const handleCanvasDown = (clientX, clientY) => {
        const { x, y } = toCanvas(clientX, clientY);
        if (step === 'calibrate') {
            const rad = (-rulerAngle * Math.PI) / 180;
            const dx = x - rulerPos.x, dy = y - rulerPos.y;
            const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
            const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
            if (Math.abs(lx) < 30 && ly >= -20 && ly <= rulerLength + 20) {
                setIsDraggingRuler(true); setRulerDragOffset({ x: dx, y: dy });
            }
            return;
        }
        if (step === 'draw') {
            const idx = hitTest(x, y);
            if (idx >= 0) { setDragIdx(idx); return; }
            const newPts = [...points, { x, y }];
            setPoints(newPts);
            if (newPts.length >= 3 && pixelsPerCm) setArea(calcArea(newPts, pixelsPerCm));
        }
    };

    const handleCanvasMove = (clientX, clientY) => {
        const { x, y } = toCanvas(clientX, clientY);
        if (step === 'calibrate' && isDraggingRuler) {
            setRulerPos({ x: x - rulerDragOffset.x, y: y - rulerDragOffset.y }); return;
        }
        if (step === 'draw') {
            setHoverIdx(dragIdx >= 0 ? dragIdx : hitTest(x, y));
            if (dragIdx >= 0) {
                const newPts = points.map((p, i) => i === dragIdx ? { x, y } : p);
                setPoints(newPts);
                if (newPts.length >= 3 && pixelsPerCm) setArea(calcArea(newPts, pixelsPerCm));
            }
        }
    };

    const handleCanvasUp = () => { setIsDraggingRuler(false); setDragIdx(-1); };

    const getCursor = () => {
        if (step === 'calibrate') return isDraggingRuler ? 'grabbing' : 'grab';
        if (step === 'draw') return dragIdx >= 0 ? 'grabbing' : hoverIdx >= 0 ? 'grab' : 'crosshair';
        return 'default';
    };

    const removeLastPoint = () => {
        const newPts = points.slice(0, -1);
        setPoints(newPts);
        setArea(newPts.length >= 3 && pixelsPerCm ? calcArea(newPts, pixelsPerCm) : null);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                setImage(img); setStep('calibrate');
                setPoints([]); setArea(null); setPixelsPerCm(null);
                setZoom(1); setPanOffset({ x: 0, y: 0 });
                setRulerPos({ x: img.width * 0.5, y: img.height * 0.1 });
                setRulerLength(img.height * 0.65); setRulerAngle(180);
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file); e.target.value = '';
    };

    const confirmCalibrate = () => { setPixelsPerCm(rulerLength / 30); setStep('draw'); };

    const reset = () => {
        setImage(null); setStep('upload'); setPoints([]); setArea(null);
        setPixelsPerCm(null); setZoom(1); setPanOffset({ x: 0, y: 0 });
        setDragIdx(-1); setHoverIdx(-1);
    };

    const saveResult = async () => {
        if (!fileName.trim()) { alert(t('enter_detail_name')); return; }
        if (!area) { alert(t('no_area')); return; }
        setSaving(true);
        try {
            const saved = await api.createMeasurement({
                name: fileName.trim(), area_cm2: area, pixels_per_cm: pixelsPerCm,
                polygon_points: points, image_width: image.width, image_height: image.height,
                image_data: canvasRef.current.toDataURL('image/jpeg', 0.75),
                quantity, project_id: project.id,
            });
            setSavedMeasurements(prev => [...prev, { ...saved, name: fileName.trim(), quantity, area_cm2: area }]);
            setShowSaveModal(false); setStep('result'); onSaved?.();
        } catch (e) { alert(t('save_error', { msg: e.message })); } finally { setSaving(false); }
    };

    const openEdit = (m) => { setEditingMeasurement(m); setEditName(m.name); setEditQuantity(m.quantity || 1); };

    const saveEdit = async () => {
        if (!editName.trim()) { alert(t('detail_name_required')); return; }
        setEditSaving(true);
        try {
            await api.updateMeasurement(editingMeasurement.id, { name: editName.trim(), quantity: editQuantity });
            setSavedMeasurements(prev => prev.map(m =>
                m.id === editingMeasurement.id ? { ...m, name: editName.trim(), quantity: editQuantity } : m
            ));
            setEditingMeasurement(null);
        } catch (e) { alert(t('update_error', { msg: e.message })); } finally { setEditSaving(false); }
    };

    const STEPS = [t('step_upload'), t('step_calibrate'), t('step_draw'), t('step_result')];
    const stepIdx = { upload: 0, calibrate: 1, draw: 2, result: 3 }[step] ?? 0;

    return (
        <div className="pd-scan-wrap">
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span className="pd-cv-badge ready" translate="no">{t('manual_badge')}</span>
            </div>

            {step !== 'upload' && (
                <div className="pd-step-bar">
                    {STEPS.map((label, i) => (
                        <React.Fragment key={i}>
                            <div className={`pd-step ${i < stepIdx ? 'done' : ''} ${i === stepIdx ? 'active' : ''}`}>
                                <div className="pd-step-content">
                                    <div className="pd-step-dot">{i < stepIdx ? '✓' : i + 1}</div>
                                    <span className="pd-step-label">{label}</span>
                                </div>
                            </div>
                            {i < STEPS.length - 1 && <div className={`pd-step-line ${i < stepIdx ? 'done' : ''}`} />}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {step === 'upload' && (
                <div className="pd-upload-screen">
                    <div className="pd-upload-hero">
                        <div className="pd-upload-hero-icon"><Pencil size={48} color="#6366f1" /></div>
                        <h2>{t('manual_upload_title')}</h2>
                        <p dangerouslySetInnerHTML={{ __html: t('manual_upload_sub') }} />
                    </div>
                    <input ref={uploadRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} style={{ display: 'none' }} />
                    <div className="pd-upload-btns">
                        <button className="pd-upload-btn primary" onClick={() => uploadRef.current?.click()}>
                            <Upload size={22} /><span>{t('upload_image')}</span><small>{t('upload_formats')}</small>
                        </button>
                        <button className="pd-upload-btn" onClick={() => cameraRef.current?.click()}>
                            <Camera size={22} /><span>{t('take_photo')}</span><small>{t('use_camera')}</small>
                        </button>
                    </div>
                </div>
            )}

            {image && step !== 'upload' && (
                <>
                    <div className="pd-guide">
                        <span className="pd-guide-icon">
                            {step === 'calibrate' ? '📏' : step === 'draw' ? '✋' : '✅'}
                        </span>
                        <div>
                            <strong>
                                {step === 'calibrate' && t('guide_calibrate_title')}
                                {step === 'draw' && t('guide_draw_title', {
                                    count: points.length,
                                    area: points.length >= 3 && area ? ` · ${(area / 10000).toFixed(4)} m²` : ''
                                })}
                                {step === 'result' && t('guide_result_title')}
                            </strong>
                            <span>
                                {step === 'calibrate' && t('guide_calibrate_sub')}
                                {step === 'draw' && t('guide_draw_sub', { scale: pixelsPerCm?.toFixed(2) })}
                                {step === 'result' && <span translate="no">{area?.toFixed(2)} cm² · {(area / 10000).toFixed(4)} m²</span>}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{t('zoom_label')}</span>
                        <button className="pd-btn ghost" style={{ padding: '5px 12px', fontSize: 13 }}
                            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>−</button>
                        <span className="pd-badge accent" style={{ minWidth: 50, textAlign: 'center' }} translate="no">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button className="pd-btn ghost" style={{ padding: '5px 12px', fontSize: 13 }}
                            onClick={() => setZoom(z => Math.min(5, z + 0.25))}>+</button>
                        <button className="pd-btn ghost" style={{ padding: '5px 12px', fontSize: 13 }}
                            onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}>{t('zoom_reset')}</button>
                        <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>{t('zoom_hint')}</span>
                    </div>

                    <div ref={containerRef} className="pd-canvas-wrap" style={{ overflow: 'hidden', cursor: getCursor() }}>
                        <div style={{
                            transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                            transformOrigin: 'center center',
                            transition: isDraggingRuler || dragIdx >= 0 ? 'none' : 'transform 0.1s ease',
                            width: '100%',
                        }}>
                            <canvas ref={canvasRef}
                                style={{ maxWidth: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
                                onMouseDown={e => handleCanvasDown(e.clientX, e.clientY)}
                                onMouseMove={e => handleCanvasMove(e.clientX, e.clientY)}
                                onMouseUp={handleCanvasUp}
                                onMouseLeave={() => { handleCanvasUp(); setHoverIdx(-1); }}
                                onTouchStart={e => { e.preventDefault(); const t = e.touches[0]; handleCanvasDown(t.clientX, t.clientY); }}
                                onTouchMove={e => { e.preventDefault(); const t = e.touches[0]; handleCanvasMove(t.clientX, t.clientY); }}
                                onTouchEnd={e => { e.preventDefault(); handleCanvasUp(); }}
                            />
                        </div>
                        {step === 'draw' && area !== null && (
                            <div className="pd-area-badge" translate="no">{(area / 10000).toFixed(4)} m²</div>
                        )}
                    </div>

                    {step === 'calibrate' && (
                        <div className="pd-controls">
                            <div className="pd-control-group">
                                <label>{t('ruler_length')}</label>
                                <div className="pd-slider-row">
                                    <input type="range" min="100" max={image.height}
                                        value={rulerLength} onChange={e => setRulerLength(Number(e.target.value))} />
                                    <div className="pd-badges">
                                        <span className="pd-badge" translate="no">{Math.round(rulerLength)} px = 30cm</span>
                                        <span className="pd-badge accent" translate="no">{(rulerLength / 30).toFixed(2)} px/cm</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pd-control-group">
                                <label>{t('direct_px_cm')}</label>
                                <input type="number" min="1" step="0.1"
                                    value={(rulerLength / 30).toFixed(2)}
                                    onChange={e => setRulerLength(parseFloat(e.target.value) * 30 || rulerLength)}
                                    className="pd-field-input" style={{ maxWidth: 160 }} />
                            </div>
                            <div className="pd-control-group">
                                <label>{t('rotation_angle')}</label>
                                <div className="pd-angle-row">
                                    <button onClick={() => setRulerAngle(a => (a - 10 + 360) % 360)}>↺ −10°</button>
                                    <button onClick={() => setRulerAngle(a => (a - 1 + 360) % 360)}>−1°</button>
                                    <input type="number" min="0" max="359" value={rulerAngle}
                                        onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setRulerAngle(((v % 360) + 360) % 360); }}
                                        className="pd-angle-input" />
                                    <span className="pd-angle-deg">°</span>
                                    <button onClick={() => setRulerAngle(a => (a + 1) % 360)}>+1°</button>
                                    <button onClick={() => setRulerAngle(a => (a + 10) % 360)}>↻ +10°</button>
                                    <button onClick={() => setRulerAngle(90)}>90°</button>
                                    <button onClick={() => setRulerAngle(0)}>0°</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {(step === 'draw' || step === 'result') && (
                        <div className="pd-result-grid">
                            <div className="pd-result-card accent">
                                <span>{step === 'result' ? t('area_one_detail') : t('area_label')}</span>
                                <strong translate="no">{area ? area.toFixed(2) : '—'}<em>cm²</em></strong>
                            </div>
                            <div className="pd-result-card accent">
                                <span>{t('convert_m2')}</span>
                                <strong translate="no">{area ? (area / 10000).toFixed(4) : '—'}<em>m²</em></strong>
                            </div>
                            <div className="pd-result-card">
                                <span>{t('ratio')}</span>
                                <strong translate="no">{pixelsPerCm?.toFixed(2)}<em>px/cm</em></strong>
                            </div>
                            <div className="pd-result-card">
                                <span>{t('points_label')}</span>
                                <strong translate="no">{points.length}</strong>
                            </div>
                            {step === 'result' && quantity > 1 && (
                                <div className="pd-result-card accent">
                                    <span>{t('total_qty_detail', { qty: quantity })}</span>
                                    <strong translate="no">{(area * quantity / 10000).toFixed(4)}<em>m²</em></strong>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'result' && savedMeasurements.length > 0 && (
                        <div className="pd-csv-preview">
                            <div className="pd-csv-header">
                                <h3>{t('preview_title')}</h3>
                                <span className="pd-badge accent">{savedMeasurements.length} {t('total_items')}</span>
                            </div>
                            <div className="pd-csv-table-wrap">
                                <table className="pd-csv-table">
                                    <thead>
                                        <tr>
                                            <th>{t('col_name')}</th>
                                            <th>{t('col_area_one')}</th>
                                            <th>{t('col_quantity')}</th>
                                            <th>{t('col_total_area')}</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {savedMeasurements.map((m, i) => (
                                            <tr key={m.id || i}>
                                                <td>{m.name}</td>
                                                <td translate="no">{Number(m.area_cm2).toFixed(2)} cm²</td>
                                                <td>{m.quantity || 1}</td>
                                                <td translate="no">{(Number(m.area_cm2) * (m.quantity || 1) / 10000).toFixed(4)} m²</td>
                                                <td>
                                                    <button className="pd-btn ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEdit(m)}>
                                                        <Pencil size={12} /> {t('update')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="pd-actions">
                        <button className="pd-btn ghost" onClick={reset}><RotateCcw size={15} /> {t('redo')}</button>
                        {step === 'calibrate' && (
                            <button className="pd-btn primary" onClick={confirmCalibrate} translate="no">
                                <CheckCircle size={15} /> {t('confirm_calibrate', { value: (rulerLength / 30).toFixed(2) })}
                            </button>
                        )}
                        {step === 'draw' && points.length > 0 && (
                            <button className="pd-btn ghost" onClick={removeLastPoint}>{t('delete_last_point')}</button>
                        )}
                        {step === 'draw' && points.length >= 3 && area && (
                            <button className="pd-btn success" translate="no" onClick={() => { setFileName(''); setQuantity(1); setShowSaveModal(true); }}>
                                <CheckCircle size={15} /> {t('confirm_area', { value: (area / 10000).toFixed(4) })}
                            </button>
                        )}
                        {step === 'result' && (
                            <>
                                <button className="pd-btn primary" onClick={() => {
                                    setPoints([]); setArea(null); setStep('calibrate');
                                    setZoom(1); setPanOffset({ x: 0, y: 0 });
                                    setRulerPos({ x: image.width * 0.5, y: image.height * 0.1 });
                                    setRulerLength(image.height * 0.65); setRulerAngle(0);
                                }}>
                                    <Pencil size={15} /> {t('draw_another')}
                                </button>
                                <button className="pd-btn ghost" onClick={reset}>
                                    <Upload size={15} /> {t('new_image')}
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}

            {showSaveModal && (
                <div className="pd-modal-bg" onClick={e => e.target === e.currentTarget && setShowSaveModal(false)}>
                    <div className="pd-qty-modal">
                        <button className="pd-modal-x" onClick={() => setShowSaveModal(false)}><X size={18} /></button>
                        <h3>{t('save_detail_title')}</h3>
                        <p className="pd-qty-sub"
                            dangerouslySetInnerHTML={{ __html: t('save_area_info', { area: (area / 10000).toFixed(4), folder: project.name }) }}
                        />
                        <div className="pd-field-group">
                            <label className="pd-field-label">{t('detail_name_label')} <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="pd-field-input" type="text" value={fileName}
                                onChange={e => setFileName(e.target.value)}
                                placeholder={t('detail_name_eg')} maxLength={100} autoFocus
                                onKeyDown={e => e.key === 'Enter' && !saving && fileName.trim() && saveResult()} />
                        </div>
                        <div className="pd-field-group">
                            <label className="pd-field-label">{t('quantity')}</label>
                            <div className="pd-qty-control">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                                <input type="number" min="1" max="9999" value={quantity}
                                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
                                <button onClick={() => setQuantity(q => Math.min(9999, q + 1))}>+</button>
                            </div>
                        </div>
                        <div className="pd-qty-preview">
                            <div><span>{t('area_one_preview')}</span><strong translate="no">{(area / 10000)?.toFixed(4)} m²</strong></div>
                            <div><span>{t('total_preview', { qty: quantity })}</span><strong translate="no">{((area || 0) * quantity / 10000).toFixed(4)} m²</strong></div>
                        </div>
                        <div className="pd-qty-actions">
                            <button className="pd-btn ghost" onClick={() => setShowSaveModal(false)} disabled={saving}>{t('cancel')}</button>
                            <button className="pd-btn primary" onClick={saveResult} disabled={saving || !fileName.trim()}>
                                <Save size={15} />{saving ? t('saving') : t('save_to_folder')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingMeasurement && (
                <div className="pd-modal-bg" onClick={e => e.target === e.currentTarget && setEditingMeasurement(null)}>
                    <div className="pd-qty-modal">
                        <button className="pd-modal-x" onClick={() => setEditingMeasurement(null)}><X size={18} /></button>
                        <h3>{t('edit_detail')}</h3>
                        <p className="pd-qty-sub">{t('area_one')}: <strong translate="no">{Number(editingMeasurement.area_cm2).toFixed(2)} cm²</strong></p>
                        <div className="pd-field-group">
                            <label className="pd-field-label">{t('detail_name')} <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="pd-field-input" type="text" value={editName}
                                onChange={e => setEditName(e.target.value)}
                                placeholder={t('detail_name_placeholder')} maxLength={100} autoFocus
                                onKeyDown={e => e.key === 'Enter' && !editSaving && editName.trim() && saveEdit()} />
                        </div>
                        <div className="pd-field-group">
                            <label className="pd-field-label">{t('quantity')}</label>
                            <div className="pd-qty-control">
                                <button onClick={() => setEditQuantity(q => Math.max(1, q - 1))}>−</button>
                                <input type="number" min="1" max="9999" value={editQuantity}
                                    onChange={e => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
                                <button onClick={() => setEditQuantity(q => Math.min(9999, q + 1))}>+</button>
                            </div>
                        </div>
                        <div className="pd-qty-preview">
                            <div><span>{t('area_one')}</span><strong translate="no">{(Number(editingMeasurement.area_cm2) / 10000).toFixed(4)} m²</strong></div>
                            <div><span>{t('total_area_qty', { qty: editQuantity })}</span>
                                <strong translate="no">{(Number(editingMeasurement.area_cm2) * editQuantity / 10000).toFixed(4)} m²</strong></div>
                        </div>
                        <div className="pd-qty-actions">
                            <button className="pd-btn ghost" onClick={() => setEditingMeasurement(null)} disabled={editSaving}>{t('cancel')}</button>
                            <button className="pd-btn primary" onClick={saveEdit} disabled={editSaving || !editName.trim()}>
                                <Save size={15} />{editSaving ? t('updating') : t('update')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   SCAN PANEL
══════════════════════════════════════════════════════════ */
function ScanPanel({ project, cvReady, onSaved }) {
    const { t } = useTranslation();
    const [image, setImage] = useState(null);
    const [rawImageData, setRawImageData] = useState(null);
    const [step, setStep] = useState('upload');
    const [loading, setLoading] = useState(false);

    const [rulerPos, setRulerPos] = useState({ x: 100, y: 100 });
    const [rulerLength, setRulerLength] = useState(300);
    const [rulerAngle, setRulerAngle] = useState(0);
    const [pixelsPerCm, setPixelsPerCm] = useState(null);
    const [isDraggingRuler, setIsDraggingRuler] = useState(false);
    const [rulerDragOffset, setRulerDragOffset] = useState({ x: 0, y: 0 });

    const [polygonPoints, setPolygonPoints] = useState([]);
    const [area, setArea] = useState(null);
    const [dragPointIdx, setDragPointIdx] = useState(-1);
    const [hoverPointIdx, setHoverPointIdx] = useState(-1);

    const [pickedColor, setPickedColor] = useState(null);
    const [pickedRgb, setPickedRgb] = useState(null);

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [fileName, setFileName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [saving, setSaving] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

    const canvasRef = useRef(null);
    const uploadRef = useRef(null);
    const cameraRef = useRef(null);
    const containerRef = useRef(null);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(z => Math.min(5, Math.max(0.5, z * delta)));
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;
        const ctx = canvas.getContext('2d');
        canvas.width = image.width; canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        const W = image.width;
        const displayScale = canvas.width / (canvas.getBoundingClientRect().width || canvas.width);

        if (step === 'pick') {
            ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, image.height);
            const fs = Math.max(22, W / 22);
            ctx.font = `bold ${fs}px Arial`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillText(t('guide_pick_sub'), W / 2 + 3, image.height / 2 + 3);
            ctx.fillStyle = '#fff';
            ctx.fillText(t('guide_pick_sub'), W / 2, image.height / 2);
            ctx.textBaseline = 'alphabetic';
        }

        if (step === 'calibrate') {
            ctx.save();
            ctx.translate(rulerPos.x, rulerPos.y);
            ctx.rotate((rulerAngle * Math.PI) / 180);
            const rw = Math.max(28, W / 28);
            ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3;
            ctx.fillStyle = 'rgba(255,255,255,0.97)'; ctx.fillRect(-rw / 2, 0, rw, rulerLength);
            ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
            ctx.strokeStyle = '#6366f1'; ctx.lineWidth = Math.max(2, W / 300);
            ctx.strokeRect(-rw / 2, 0, rw, rulerLength);
            const ppc = rulerLength / 30; const fs = Math.max(10, W / 80);
            for (let i = 0; i <= 30; i++) {
                const y = i * ppc; const major = i % 5 === 0;
                ctx.strokeStyle = major ? '#4f46e5' : '#bbb';
                ctx.lineWidth = major ? Math.max(1.5, W / 500) : 1;
                ctx.beginPath();
                ctx.moveTo(major ? -rw / 2 : -rw / 4, y); ctx.lineTo(major ? rw / 2 : rw / 4, y); ctx.stroke();
                if (major && i > 0) {
                    ctx.fillStyle = '#1e1b4b'; ctx.font = `bold ${fs}px Arial`;
                    ctx.textAlign = 'center'; ctx.fillText(i, 0, y - fs * 0.3);
                }
                if (i === 0) {
                    ctx.fillStyle = '#1e1b4b'; ctx.font = `bold ${fs}px Arial`;
                    ctx.textAlign = 'left'; ctx.fillText('0', rw / 2 + 4, fs);
                    ctx.textAlign = 'center';
                }
            }
            const hr = Math.max(8, Math.min(16, 12 * displayScale));
            ctx.fillStyle = '#6366f1';
            ctx.shadowColor = 'rgba(99,102,241,0.55)'; ctx.shadowBlur = 16;
            ctx.beginPath(); ctx.arc(0, rulerLength, hr, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2.5, W / 380); ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = `bold ${hr * 0.85}px Arial`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('≡', 0, rulerLength); ctx.textBaseline = 'alphabetic';
            ctx.restore();
        }

        if (polygonPoints.length > 1 && (step === 'adjust' || step === 'result')) {
            ctx.beginPath();
            polygonPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.fillStyle = 'rgba(99,102,241,0.14)'; ctx.fill();
            ctx.strokeStyle = '#6366f1'; ctx.lineWidth = Math.max(2.5, W / 280);
            ctx.setLineDash([]); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.52)'; ctx.lineWidth = Math.max(1, W / 600);
            ctx.setLineDash([Math.max(7, W / 90), Math.max(5, W / 130)]); ctx.stroke();
            ctx.setLineDash([]);

            const R = Math.max(8, Math.min(18, 14 * displayScale)); const RH = R * 1.6;
            polygonPoints.forEach((p, i) => {
                const isHover = i === hoverPointIdx; const isDrag = i === dragPointIdx;
                if (isHover || isDrag) {
                    const g = ctx.createRadialGradient(p.x, p.y, R * 0.5, p.x, p.y, RH);
                    g.addColorStop(0, isDrag ? 'rgba(245,158,11,0.38)' : 'rgba(99,102,241,0.30)');
                    g.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.beginPath(); ctx.arc(p.x, p.y, RH, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
                }
                ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 10;
                ctx.beginPath(); ctx.arc(p.x, p.y, R + Math.max(2, W / 400), 0, Math.PI * 2);
                ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowBlur = 0;
                ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
                ctx.fillStyle = isDrag ? '#f59e0b' : isHover ? '#818cf8' : '#6366f1'; ctx.fill();
                ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.max(10, R * 0.72)}px Arial`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(i + 1, p.x, p.y); ctx.textBaseline = 'alphabetic';
            });

            if (area) {
                const cx = polygonPoints.reduce((s, p) => s + p.x, 0) / polygonPoints.length;
                const cy = polygonPoints.reduce((s, p) => s + p.y, 0) / polygonPoints.length;
                const fs = Math.max(20, W / 25);
                ctx.font = `bold ${fs}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                const txt = `${(area / 10000).toFixed(4)} m²`;
                const tw = ctx.measureText(txt).width; const pad = fs * 0.55;
                ctx.fillStyle = 'rgba(79,70,229,0.88)';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(cx - tw / 2 - pad, cy - fs / 2 - pad * 0.6, tw + pad * 2, fs + pad * 1.2, 10);
                else ctx.rect(cx - tw / 2 - pad, cy - fs / 2 - pad * 0.6, tw + pad * 2, fs + pad * 1.2);
                ctx.fill();
                ctx.fillStyle = '#fff'; ctx.fillText(txt, cx, cy); ctx.textBaseline = 'alphabetic';
            }
        }
    }, [image, step, rulerPos, rulerLength, rulerAngle, polygonPoints, hoverPointIdx, dragPointIdx, area, t]);

    useEffect(() => { drawCanvas(); }, [drawCanvas]);

    const toCanvas = (clientX, clientY) => {
        const c = canvasRef.current; const r = c.getBoundingClientRect();
        return { x: (clientX - r.left) * (c.width / r.width), y: (clientY - r.top) * (c.height / r.height) };
    };

    const hitTestPoint = useCallback((cx, cy) => {
        const canvas = canvasRef.current;
        const displayScale = canvas ? canvas.width / (canvas.getBoundingClientRect().width || canvas.width) : 1;
        const R = Math.max(8, Math.min(18, 14 * displayScale)) + 10;
        for (let i = polygonPoints.length - 1; i >= 0; i--) {
            const p = polygonPoints[i]; const dx = cx - p.x, dy = cy - p.y;
            if (Math.sqrt(dx * dx + dy * dy) <= R) return i;
        }
        return -1;
    }, [polygonPoints]);

    const handleColorPick = (clientX, clientY) => {
        if (step !== 'pick' || !rawImageData) return;
        const { x, y } = toCanvas(clientX, clientY);
        const px = Math.max(0, Math.min(Math.floor(x), rawImageData.width - 1));
        const py = Math.max(0, Math.min(Math.floor(y), rawImageData.height - 1));
        const idx = (py * rawImageData.width + px) * 4;
        const r = rawImageData.data[idx], g = rawImageData.data[idx + 1], b = rawImageData.data[idx + 2];
        setPickedColor(rgbToHsv(r, g, b)); setPickedRgb({ r, g, b }); setStep('scan');
    };

    const onPointerDown = (clientX, clientY) => {
        if (step === 'pick') { handleColorPick(clientX, clientY); return; }
        const { x, y } = toCanvas(clientX, clientY);
        if (step === 'calibrate') {
            const rad = (-rulerAngle * Math.PI) / 180;
            const dx = x - rulerPos.x, dy = y - rulerPos.y;
            const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
            const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
            if (Math.abs(lx) < 30 && ly >= -20 && ly <= rulerLength + 20) {
                setIsDraggingRuler(true); setRulerDragOffset({ x: dx, y: dy });
            }
        } else if (step === 'adjust') {
            const idx = hitTestPoint(x, y); if (idx >= 0) setDragPointIdx(idx);
        }
    };

    const onPointerMove = (clientX, clientY) => {
        if (step === 'pick') return;
        const { x, y } = toCanvas(clientX, clientY);
        if (step === 'calibrate' && isDraggingRuler) {
            setRulerPos({ x: x - rulerDragOffset.x, y: y - rulerDragOffset.y }); return;
        }
        if (step === 'adjust') {
            setHoverPointIdx(dragPointIdx >= 0 ? dragPointIdx : hitTestPoint(x, y));
            if (dragPointIdx >= 0) {
                const newPts = polygonPoints.map((p, i) => i === dragPointIdx ? { x, y } : p);
                setPolygonPoints(newPts); setArea(calcArea(newPts, pixelsPerCm));
            }
        }
    };

    const onPointerUp = () => { setIsDraggingRuler(false); setDragPointIdx(-1); };

    const getCursor = () => {
        if (step === 'pick') return 'crosshair';
        if (step === 'calibrate') return isDraggingRuler ? 'grabbing' : 'grab';
        if (step === 'adjust') return dragPointIdx >= 0 ? 'grabbing' : hoverPointIdx >= 0 ? 'grab' : 'default';
        return 'default';
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                setImage(img);
                const off = document.createElement('canvas');
                off.width = img.width; off.height = img.height;
                const octx = off.getContext('2d'); octx.drawImage(img, 0, 0);
                setRawImageData(octx.getImageData(0, 0, img.width, img.height));
                setStep('calibrate'); setPolygonPoints([]); setArea(null); setPixelsPerCm(null);
                setDragPointIdx(-1); setHoverPointIdx(-1); setPickedColor(null); setPickedRgb(null);
                setRulerPos({ x: img.width * 0.5, y: img.height * 0.1 });
                setRulerLength(img.height * 0.65); setRulerAngle(180);
                setZoom(1); setPanOffset({ x: 0, y: 0 });
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file); e.target.value = '';
    };

    const scanAndCalc = async () => {
        if (!rawImageData || !cvReady || !pixelsPerCm) { alert(t('calibrate_warning')); return; }
        setLoading(true);
        try {
            const cv = window.cv;
            const src = cv.matFromImageData(rawImageData);
            const hsv = new cv.Mat();
            cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB); cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
            let loArr, hiArr;
            if (pickedColor) {
                const { h, s, v } = pickedColor; const hR = 18, sR = 70, vR = 70;
                loArr = [Math.max(0, h - hR), Math.max(0, s - sR), Math.max(0, v - vR), 0];
                hiArr = [Math.min(180, h + hR), Math.min(255, s + sR), Math.min(255, v + vR), 255];
            } else { loArr = [0, 0, 60, 0]; hiArr = [180, 60, 255, 255]; }
            const lo = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), loArr);
            const hi = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), hiArr);
            const mask = new cv.Mat(); cv.inRange(hsv, lo, hi, mask);
            const k1 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
            const cl = new cv.Mat(); cv.morphologyEx(mask, cl, cv.MORPH_OPEN, k1, new cv.Point(-1, -1), 1);
            const k2 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
            const fi = new cv.Mat(); cv.morphologyEx(cl, fi, cv.MORPH_CLOSE, k2, new cv.Point(-1, -1), 1);
            const cs = new cv.MatVector(); const hr = new cv.Mat();
            cv.findContours(fi, cs, hr, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
            let best = null, mx = 0;
            const imgArea = src.cols * src.rows;
            for (let i = 0; i < cs.size(); i++) {
                const c = cs.get(i); const a = cv.contourArea(c); const pct = (a / imgArea) * 100;
                if (pct < 2 || pct > 90) continue;
                const rb = cv.boundingRect(c);
                const ar = Math.max(rb.width, rb.height) / Math.min(rb.width, rb.height);
                if (ar > 20) continue;
                if (rb.x <= 10 || rb.y <= 10 || rb.x + rb.width >= src.cols - 10 || rb.y + rb.height >= src.rows - 10) continue;
                const p = cv.arcLength(c, true); const sc = a * ((4 * Math.PI * a) / (p * p));
                if (sc > mx) { mx = sc; best = c; }
            }
            if (!best) {
                const gray = new cv.Mat(); cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
                const blurred = new cv.Mat(); cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
                const edges = new cv.Mat(); cv.Canny(blurred, edges, 30, 100);
                const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
                const dilated = new cv.Mat(); cv.dilate(edges, dilated, kernel, new cv.Point(-1, -1), 3);
                const cs2 = new cv.MatVector(); const hr2 = new cv.Mat();
                cv.findContours(dilated, cs2, hr2, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
                let mx2 = 0;
                for (let i = 0; i < cs2.size(); i++) {
                    const c = cs2.get(i); const a = cv.contourArea(c); const pct = (a / imgArea) * 100;
                    if (pct < 2 || pct > 90) continue;
                    const rb = cv.boundingRect(c);
                    if (rb.x <= 5 || rb.y <= 5 || rb.x + rb.width >= src.cols - 5 || rb.y + rb.height >= src.rows - 5) continue;
                    const p = cv.arcLength(c, true); const sc = a * ((4 * Math.PI * a) / (p * p));
                    if (sc > mx2) { mx2 = sc; best = c; }
                }
                [gray, blurred, edges, kernel, dilated, cs2, hr2].forEach(m => m?.delete?.());
            }
            if (!best) throw new Error(t('no_pattern_found'));
            const pe = cv.arcLength(best, true); const ap = new cv.Mat();
            cv.approxPolyDP(best, ap, 0.002 * pe, true);
            let pts = [];
            for (let i = 0; i < ap.rows; i++) pts.push({ x: ap.data32S[i * 2], y: ap.data32S[i * 2 + 1] });
            if (pts.length < 4) {
                const hu = new cv.Mat(); cv.convexHull(best, hu, false, true); pts = [];
                for (let i = 0; i < hu.data32S.length; i += 2) pts.push({ x: hu.data32S[i], y: hu.data32S[i + 1] });
                hu.delete();
            }
            setPolygonPoints(pts); setArea(calcArea(pts, pixelsPerCm)); setStep('adjust');
            [src, hsv, lo, hi, mask, k1, cl, k2, fi, cs, hr, ap].forEach(m => m?.delete?.());
        } catch (err) { alert(`⚠️ ${err.message}`); } finally { setLoading(false); }
    };

    const openSaveModal = () => { setFileName(''); setQuantity(1); setShowSaveModal(true); };

    const saveResult = async () => {
        if (!fileName.trim()) { alert(t('enter_detail_name')); return; }
        setSaving(true);
        try {
            await api.createMeasurement({
                name: fileName.trim(), area_cm2: area, pixels_per_cm: pixelsPerCm,
                polygon_points: polygonPoints, image_width: image.width, image_height: image.height,
                image_data: canvasRef.current.toDataURL('image/jpeg', 0.75),
                quantity, project_id: project.id,
            });
            setShowSaveModal(false); setStep('result'); onSaved?.();
        } catch (e) { alert(t('save_error', { msg: e.message })); } finally { setSaving(false); }
    };

    const reset = () => {
        setImage(null); setRawImageData(null); setStep('upload');
        setPolygonPoints([]); setArea(null); setPixelsPerCm(null);
        setDragPointIdx(-1); setHoverPointIdx(-1); setPickedColor(null); setPickedRgb(null);
        setZoom(1); setPanOffset({ x: 0, y: 0 });
    };

    const STEPS = [
        { key: 'upload', label: t('step_upload') },
        { key: 'calibrate', label: t('step_calibrate') },
        { key: 'pick', label: t('step_pick_color') },
        { key: 'scan', label: t('step_scan') },
        { key: 'adjust', label: t('step_adjust') },
        { key: 'result', label: t('step_result') },
    ];
    const stepIdx = STEPS.findIndex(s => s.key === step);

    return (
        <div className="pd-scan-wrap">
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span className={`pd-cv-badge ${cvReady ? 'ready' : ''}`} translate="no">
                    {cvReady ? t('scan_badge_ready') : t('scan_badge_loading')}
                </span>
            </div>

            {step !== 'upload' && (
                <div className="pd-step-bar">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s.key}>
                            <div className={`pd-step ${i < stepIdx ? 'done' : ''} ${i === stepIdx ? 'active' : ''}`}>
                                <div className="pd-step-content">
                                    <div className="pd-step-dot">{i < stepIdx ? '✓' : i + 1}</div>
                                    <span className="pd-step-label">{s.label}</span>
                                </div>
                            </div>
                            {i < STEPS.length - 1 && <div className={`pd-step-line ${i < stepIdx ? 'done' : ''}`} />}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {step === 'upload' && (
                <div className="pd-upload-screen">
                    <div className="pd-upload-hero">
                        <div className="pd-upload-hero-icon"><Ruler size={48} color="#6366f1" /></div>
                        <h2>{t('scan_upload_title')}</h2>
                        <p dangerouslySetInnerHTML={{ __html: t('scan_upload_sub', { name: project.name }) }} />
                    </div>
                    <input ref={uploadRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} style={{ display: 'none' }} />
                    <div className="pd-upload-btns">
                        <button className="pd-upload-btn primary" disabled={!cvReady} onClick={() => uploadRef.current?.click()}>
                            <Upload size={22} /><span>{t('upload_image')}</span><small>{t('upload_formats')}</small>
                        </button>
                        <button className="pd-upload-btn" disabled={!cvReady} onClick={() => cameraRef.current?.click()}>
                            <Camera size={22} /><span>{t('take_photo')}</span><small>{t('use_camera')}</small>
                        </button>
                    </div>
                </div>
            )}

            {image && step !== 'upload' && (
                <>
                    <div className="pd-guide">
                        <span className="pd-guide-icon">
                            {step === 'calibrate' ? '📏' : step === 'pick' ? '🎯' : step === 'scan' ? '🔍' : step === 'adjust' ? '✋' : '✅'}
                        </span>
                        <div>
                            <strong>
                                {step === 'calibrate' && t('guide_calibrate_title')}
                                {step === 'pick' && t('guide_pick_title')}
                                {step === 'scan' && t('guide_scan_title')}
                                {step === 'adjust' && t('guide_adjust_title')}
                                {step === 'result' && t('guide_result_title')}
                            </strong>
                            <span>
                                {step === 'calibrate' && t('guide_calibrate_sub')}
                                {step === 'pick' && t('guide_pick_sub')}
                                {step === 'scan' && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <span translate="no">{t('ratio')}: {pixelsPerCm?.toFixed(2)} px/cm</span> · {project.name}
                                        {pickedRgb && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                · {t('pattern_color')}
                                                <span style={{
                                                    display: 'inline-block', width: 14, height: 14, borderRadius: 3,
                                                    background: `rgb(${pickedRgb.r},${pickedRgb.g},${pickedRgb.b})`,
                                                    border: '1px solid #ccc', verticalAlign: 'middle'
                                                }} />
                                            </span>
                                        )}
                                    </span>
                                )}
                                {step === 'adjust' && t('guide_adjust_sub')}
                                {step === 'result' && <span translate="no">{area?.toFixed(2)} cm² · {(area / 10000)?.toFixed(4)} m²</span>}
                            </span>
                        </div>
                    </div>

                    {/* Zoom controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{t('zoom_label')}</span>
                        <button className="pd-btn ghost" style={{ padding: '5px 12px', fontSize: 13 }}
                            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>−</button>
                        <span className="pd-badge accent" style={{ minWidth: 50, textAlign: 'center' }} translate="no">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button className="pd-btn ghost" style={{ padding: '5px 12px', fontSize: 13 }}
                            onClick={() => setZoom(z => Math.min(5, z + 0.25))}>+</button>
                        <button className="pd-btn ghost" style={{ padding: '5px 12px', fontSize: 13 }}
                            onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}>{t('zoom_reset')}</button>
                        <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>{t('zoom_hint')}</span>
                    </div>

                    <div ref={containerRef} className="pd-canvas-wrap" style={{ overflow: 'hidden', cursor: getCursor() }}>
                        <div style={{
                            transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                            transformOrigin: 'center center',
                            transition: isDraggingRuler || dragPointIdx >= 0 ? 'none' : 'transform 0.1s ease',
                            width: '100%',
                        }}>
                            <canvas ref={canvasRef}
                                style={{ maxWidth: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
                                onMouseDown={e => onPointerDown(e.clientX, e.clientY)}
                                onMouseMove={e => onPointerMove(e.clientX, e.clientY)}
                                onMouseUp={onPointerUp}
                                onMouseLeave={() => { onPointerUp(); setHoverPointIdx(-1); }}
                                onTouchStart={e => { e.preventDefault(); const t = e.touches[0]; onPointerDown(t.clientX, t.clientY); }}
                                onTouchMove={e => { e.preventDefault(); const t = e.touches[0]; onPointerMove(t.clientX, t.clientY); }}
                                onTouchEnd={e => { e.preventDefault(); onPointerUp(); }}
                            />
                        </div>
                        {loading && (
                            <div className="pd-overlay"><div className="pd-overlay-spinner" /><span>{t('loading')}</span></div>
                        )}
                        {step === 'adjust' && area !== null && (
                            <div className="pd-area-badge" translate="no">{(area / 10000).toFixed(4)} m²</div>
                        )}
                    </div>

                    {step === 'calibrate' && (
                        <div className="pd-controls">
                            <div className="pd-control-group">
                                <label>{t('ruler_length')}</label>
                                <div className="pd-slider-row">
                                    <input type="range" min="100" max={image.height}
                                        value={rulerLength} onChange={e => setRulerLength(Number(e.target.value))} />
                                    <div className="pd-badges">
                                        <span className="pd-badge" translate="no">{Math.round(rulerLength)} px</span>
                                        <span className="pd-badge accent" translate="no">{(rulerLength / 30).toFixed(1)} px/cm</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pd-control-group">
                                <label>{t('rotation_angle')}</label>
                                <div className="pd-angle-row">
                                    <button onClick={() => setRulerAngle(a => (a - 10 + 360) % 360)}>↺ −10°</button>
                                    <button onClick={() => setRulerAngle(a => (a - 1 + 360) % 360)}>−1°</button>
                                    <input type="number" min="0" max="359" value={rulerAngle}
                                        onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setRulerAngle(((v % 360) + 360) % 360); }}
                                        className="pd-angle-input" />
                                    <span className="pd-angle-deg">°</span>
                                    <button onClick={() => setRulerAngle(a => (a + 1) % 360)}>+1°</button>
                                    <button onClick={() => setRulerAngle(a => (a + 10) % 360)}>↻ +10°</button>
                                    <button onClick={() => setRulerAngle(90)}>90°</button>
                                    <button onClick={() => setRulerAngle(0)}>0°</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'adjust' && (
                        <div className="pd-result-grid">
                            <div className="pd-result-card accent"><span>{t('area_label')}</span><strong translate="no">{area?.toFixed(2)}<em>cm²</em></strong></div>
                            <div className="pd-result-card"><span>{t('convert_m2')}</span><strong translate="no">{(area / 10000)?.toFixed(4)}<em>m²</em></strong></div>
                            <div className="pd-result-card"><span>{t('ratio')}</span><strong translate="no">{pixelsPerCm?.toFixed(2)}<em>px/cm</em></strong></div>
                            <div className="pd-result-card"><span>{t('vertices_label')}</span><strong translate="no">{polygonPoints.length}</strong></div>
                        </div>
                    )}

                    {step === 'result' && area !== null && (
                        <div className="pd-result-grid">
                            <div className="pd-result-card accent"><span>{t('area_one_detail')}</span><strong translate="no">{area?.toFixed(2)}<em>cm²</em></strong></div>
                            <div className="pd-result-card"><span>{t('convert_m2')}</span><strong translate="no">{(area / 10000).toFixed(4)}<em>m²</em></strong></div>
                            <div className="pd-result-card"><span>{t('ratio')}</span><strong translate="no">{pixelsPerCm?.toFixed(2)}<em>px/cm</em></strong></div>
                            <div className="pd-result-card"><span>{t('vertices_label')}</span><strong translate="no">{polygonPoints.length}</strong></div>
                            {quantity > 1 && (
                                <div className="pd-result-card accent">
                                    <span>{t('total_qty_detail', { qty: quantity })}</span>
                                    <strong translate="no">{(area * quantity / 10000).toFixed(4)}<em>m²</em></strong>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pd-actions">
                        <button className="pd-btn ghost" onClick={reset}><RotateCcw size={15} /> {t('redo')}</button>
                        {step === 'calibrate' && (
                            <button className="pd-btn primary" translate="no" onClick={() => { setPixelsPerCm(rulerLength / 30); setStep('pick'); }}>
                                <CheckCircle size={15} /> {t('confirm_calibrate', { value: (rulerLength / 30).toFixed(1) })}
                            </button>
                        )}
                        {step === 'pick' && (
                            <button className="pd-btn ghost" onClick={() => setStep('calibrate')}>{t('recalibrate')}</button>
                        )}
                        {step === 'scan' && (
                            <>
                                <button className="pd-btn ghost" onClick={() => setStep('pick')}>🎯 {t('repick_color')}</button>
                                <button className="pd-btn primary" disabled={loading} onClick={scanAndCalc}>
                                    <Ruler size={15} /> {t('scan_calculate')}
                                </button>
                            </>
                        )}
                        {step === 'adjust' && (
                            <>
                                <button className="pd-btn ghost" onClick={() => { setStep('scan'); setPolygonPoints([]); setArea(null); }}>{t('rescan')}</button>
                                <button className="pd-btn success" translate="no" onClick={openSaveModal}>
                                    <CheckCircle size={15} /> {t('confirm_area', { value: (area / 10000)?.toFixed(4) })}
                                </button>
                            </>
                        )}
                        {step === 'result' && (
                            <button className="pd-btn primary" onClick={reset}><Upload size={15} /> {t('measure_another')}</button>
                        )}
                    </div>
                </>
            )}

            {showSaveModal && (
                <div className="pd-modal-bg" onClick={e => e.target === e.currentTarget && setShowSaveModal(false)}>
                    <div className="pd-qty-modal">
                        <button className="pd-modal-x" onClick={() => setShowSaveModal(false)}><X size={18} /></button>
                        <h3>{t('save_detail_title')}</h3>
                        <p className="pd-qty-sub"
                            dangerouslySetInnerHTML={{ __html: t('save_area_info', { area: (area / 10000)?.toFixed(4), folder: project.name }) }}
                        />
                        <div className="pd-field-group">
                            <label className="pd-field-label">{t('detail_name_label')} <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="pd-field-input" type="text" value={fileName}
                                onChange={e => setFileName(e.target.value)}
                                placeholder={t('detail_name_eg')} maxLength={100} autoFocus
                                onKeyDown={e => e.key === 'Enter' && !saving && fileName.trim() && saveResult()} />
                        </div>
                        <div className="pd-field-group">
                            <label className="pd-field-label">{t('quantity')}</label>
                            <div className="pd-qty-control">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                                <input type="number" min="1" max="9999" value={quantity}
                                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
                                <button onClick={() => setQuantity(q => Math.min(9999, q + 1))}>+</button>
                            </div>
                        </div>
                        <div className="pd-qty-preview">
                            <div><span>{t('area_one_preview')}</span><strong translate="no">{(area / 10000)?.toFixed(4)} m²</strong></div>
                            <div><span>{t('total_preview', { qty: quantity })}</span><strong translate="no">{(((area || 0) * quantity) / 10000).toFixed(4)} m²</strong></div>
                        </div>
                        <div className="pd-qty-actions">
                            <button className="pd-btn ghost" onClick={() => setShowSaveModal(false)} disabled={saving}>{t('cancel')}</button>
                            <button className="pd-btn primary" onClick={saveResult} disabled={saving || !fileName.trim()}>
                                <Save size={15} />{saving ? t('saving') : t('save_to_folder')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   DOWNLOAD CSV
══════════════════════════════════════════════════════════ */
function DownloadPanel({ project, measurements }) {
    const { t } = useTranslation();

    const downloadCSV = () => {
        const headers = [t('col_name'), 'Diện tích (cm²)', 'Diện tích (m²)', t('col_quantity'), 'Tổng diện tích (cm²)', 'Tổng diện tích (m²)', 'Tỷ lệ (px/cm)', 'Số đỉnh', t('col_date')];
        const rows = measurements.map(m => {
            const area = Number(m.area_cm2); const qty = m.quantity || 1; const total = area * qty;
            const pts = (() => { try { const p = typeof m.polygon_points === 'string' ? JSON.parse(m.polygon_points) : m.polygon_points; return Array.isArray(p) ? p.length : 0; } catch { return 0; } })();
            const date = new Date(m.created_at).toLocaleDateString('vi-VN');
            return [m.name, area.toFixed(2), (area / 10000).toFixed(4), qty, total.toFixed(2), (total / 10000).toFixed(4), Number(m.pixels_per_cm).toFixed(2), pts, date];
        });
        const totalArea = measurements.reduce((s, m) => s + Number(m.area_cm2) * (m.quantity || 1), 0);
        const totalQty = measurements.reduce((s, m) => s + (m.quantity || 1), 0);
        rows.push([]);
        rows.push([t('grand_total'), '', '', totalQty, totalArea.toFixed(2), (totalArea / 10000).toFixed(4), '', '', '']);
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    return (
        <div className="pd-scan-wrap">
            <div className="pd-guide">
                <span className="pd-guide-icon">📊</span>
                <div>
                    <strong>{t('export_title')}</strong>
                    <span dangerouslySetInnerHTML={{ __html: t('export_sub', { name: project.name }) }} />
                </div>
            </div>
            <div className="pd-csv-preview">
                <div className="pd-csv-header">
                    <h3>{t('preview_title')}</h3>
                    <span className="pd-badge accent">{measurements.length} {t('total_items')}</span>
                </div>
                <div className="pd-csv-table-wrap">
                    <table className="pd-csv-table">
                        <thead>
                            <tr>
                                <th>{t('col_name')}</th>
                                <th>{t('col_area_one')}</th>
                                <th>{t('col_quantity')}</th>
                                <th>{t('col_total_area')}</th>
                                <th>{t('col_date')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {measurements.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px' }}>{t('no_data')}</td></tr>
                            ) : measurements.map(m => {
                                const area = Number(m.area_cm2); const qty = m.quantity || 1;
                                return (
                                    <tr key={m.id}>
                                        <td>{m.name}</td>
                                        <td translate="no">{area.toFixed(2)} cm²</td>
                                        <td>{qty}</td>
                                        <td translate="no">{(area * qty / 10000).toFixed(4)} m²</td>
                                        <td>{new Date(m.created_at).toLocaleDateString('vi-VN')}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {measurements.length > 0 && (
                            <tfoot>
                                <tr>
                                    <td><strong>{t('grand_total')}</strong></td>
                                    <td>—</td>
                                    <td><strong>{measurements.reduce((s, m) => s + (m.quantity || 1), 0)}</strong></td>
                                    <td translate="no"><strong>{(measurements.reduce((s, m) => s + Number(m.area_cm2) * (m.quantity || 1), 0) / 10000).toFixed(4)} m²</strong></td>
                                    <td>—</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
            <div className="pd-actions">
                <button className="pd-btn primary" onClick={downloadCSV} disabled={measurements.length === 0}>
                    <Download size={16} /> {t('download_csv')}
                </button>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   PROJECT DETAIL — MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function ProjectDetail({ project, onBack }) {
    const { t } = useTranslation();
    const [tab, setTab] = useState('list');
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [cvReady, setCvReady] = useState(false);

    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editQuantity, setEditQuantity] = useState(1);
    const [editSaving, setEditSaving] = useState(false);

    useEffect(() => {
        const check = () => { if (window.cv && window.cv.Mat) setCvReady(true); else setTimeout(check, 100); };
        if (!document.getElementById('opencv-script')) {
            const s = document.createElement('script');
            s.id = 'opencv-script'; s.src = 'https://docs.opencv.org/4.5.2/opencv.js';
            s.async = true; s.onload = check; document.body.appendChild(s);
        } else check();
    }, []);

    useEffect(() => { loadDetail(); }, [project.id]);

    const loadDetail = async () => {
        setLoading(true);
        try { const data = await api.getProject(project.id); setMeasurements(data.measurements || []); }
        catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm(t('delete_confirm'))) return;
        setDeletingId(id);
        try {
            await api.deleteMeasurement(id);
            setMeasurements(prev => prev.filter(m => m.id !== id));
            if (selected?.id === id) setSelected(null);
        } catch { alert(t('delete_failed')); } finally { setDeletingId(null); }
    };

    const fmt = d => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const totalArea = measurements.reduce((s, m) => s + (Number(m.area_cm2) * (m.quantity || 1)), 0);
    const totalQty = measurements.reduce((s, m) => s + (m.quantity || 1), 0);

    const saveEdit = async () => {
        if (!editName.trim()) { alert(t('detail_name_required')); return; }
        setEditSaving(true);
        try {
            await api.updateMeasurement(editingId, { name: editName.trim(), quantity: editQuantity });
            setMeasurements(prev => prev.map(m =>
                m.id === editingId ? { ...m, name: editName.trim(), quantity: editQuantity } : m
            ));
            setEditingId(null);
        } catch (e) { alert(t('update_error', { msg: e.message })); } finally { setEditSaving(false); }
    };

    const TABS = [
        { key: 'list', icon: <Layers size={15} />, label: t('list_tab', { count: measurements.length }) },
        { key: 'scan', icon: <Ruler size={15} />, label: t('scan_tab') },
        { key: 'manual', icon: <MousePointer size={15} />, label: t('manual_tab') },
        { key: 'export', icon: <Download size={15} />, label: t('export_tab') },
    ];

    return (
        <div className="pd-wrap" style={{
            backgroundImage: `url(${backgroundImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}>
            <header className="pd-header">
                <button className="pd-back-btn" onClick={onBack}><ArrowLeft size={18} /><span>{t('back')}</span></button>
                <div className="pd-header-center">
                    <div className="pd-header-icon"><Folder size={22} color="#fff" /></div>
                    <div>
                        <h1 className="pd-header-title">{project.name}</h1>
                        <p className="pd-header-sub" translate="no">{measurements.length} {t('total_items')} · {(totalArea / 10000).toFixed(4)} m²</p>
                    </div>
                </div>
                <div style={{ width: 110, flexShrink: 0 }} />
            </header>

            <div className="pd-tabs">
                {TABS.map(t => (
                    <button key={t.key} className={`pd-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {tab === 'list' && (
                <>
                    <div className="pd-stats-bar">
                        {[
                            { icon: <Layers size={16} />, label: t('stat_details'), value: measurements.length },
                            { icon: <Package size={16} />, label: t('stat_quantity'), value: totalQty },
                            { icon: <TrendingUp size={16} />, label: t('stat_total_area'), value: `${(totalArea / 10000).toFixed(4)} m²` },
                        ].map((stat, i) => (
                            <div key={i} className="pd-stat-item">
                                <div className="pd-stat-icon">{stat.icon}</div>
                                <div>
                                    <div className="pd-stat-value" translate="no">{stat.value}</div>
                                    <div className="pd-stat-label">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <main className="pd-main">
                        {loading ? (
                            <div className="pd-loading"><div className="pd-spinner" /> {t('loading')}</div>
                        ) : measurements.length === 0 ? (
                            <div className="pd-empty">
                                <div className="pd-empty-icon"><Layers size={40} /></div>
                                <h3 className="pd-empty-title">{t('folder_empty')}</h3>
                                <p className="pd-empty-text">{t('folder_empty_sub')}</p>
                                <button className="pd-empty-action" onClick={() => setTab('scan')}><Plus size={15} /> {t('measure_first')}</button>
                            </div>
                        ) : (
                            <div className="pd-grid">
                                {measurements.map(m => (
                                    <div key={m.id} className={`pd-card${deletingId === m.id ? ' is-deleting' : ''}`} onClick={() => setSelected(m)}>
                                        {m.thumbnail_url ? (
                                            <img className="pd-card-thumb" src={m.thumbnail_url} alt={m.name}
                                                onError={e => { e.target.style.display = 'none'; }} />
                                        ) : (
                                            <div className="pd-card-thumb-placeholder"><Layers size={40} /></div>
                                        )}
                                        <div className="pd-card-hint"><ZoomIn size={12} /> {t('view_detail')}</div>
                                        <button className="pd-delete-btn" onClick={e => handleDelete(e, m.id)} title={t('delete_confirm')}>
                                            <Trash2 size={13} />
                                        </button>
                                        <div className="pd-card-body">
                                            <h3 className="pd-card-title">{m.name}</h3>
                                            <div className="pd-card-meta">
                                                <div className="pd-meta-row"><span className="pd-meta-dot" /><span className="pd-meta-text">{fmt(m.created_at)}</span></div>
                                                <div className="pd-meta-row"><span className="pd-meta-dot" /><span className="pd-meta-text">SL: {m.quantity || 1} {t('total_items')}</span></div>
                                            </div>
                                            <div className="pd-card-area">
                                                <span className="pd-area-value" translate="no">{(Number(m.area_cm2) * (m.quantity || 1) / 10000).toFixed(4)}</span>
                                                <span className="pd-area-unit" translate="no">m²</span>
                                            </div>
                                            <button
                                                className="pd-btn ghost"
                                                style={{ marginTop: 8, width: '100%', justifyContent: 'center', fontSize: 12, padding: '6px 0' }}
                                                onClick={e => { e.stopPropagation(); setEditingId(m.id); setEditName(m.name); setEditQuantity(m.quantity || 1); }}
                                            >
                                                <Pencil size={12} /> {t('edit_name_qty')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </>
            )}

            {tab === 'scan' && <ScanPanel project={project} cvReady={cvReady} onSaved={() => { loadDetail(); setTab('list'); }} />}
            {tab === 'manual' && <ManualDrawPanel project={project} cvReady={cvReady} onSaved={() => { loadDetail(); setTab('list'); }} />}
            {tab === 'export' && <DownloadPanel project={project} measurements={measurements} />}

            {selected && (
                <div className="pd-modal-bg" onClick={() => setSelected(null)}>
                    <div className="pd-modal" onClick={e => e.stopPropagation()}>
                        {selected.image_url ? (
                            <div style={{ position: 'relative' }}>
                                <img className="pd-modal-img" src={selected.image_url} alt={selected.name} />
                                <button className="pd-modal-close" onClick={() => setSelected(null)}><X size={18} /></button>
                            </div>
                        ) : (
                            <div className="pd-modal-img-placeholder" style={{ position: 'relative' }}>
                                <Layers size={56} />
                                <button className="pd-modal-close" onClick={() => setSelected(null)}><X size={18} /></button>
                            </div>
                        )}
                        <div className="pd-modal-body">
                            <h2 className="pd-modal-title">{selected.name}</h2>
                            <div className="pd-modal-grid">
                                <div className="pd-modal-card accent">
                                    <div className="pd-modal-card-label">{t('area_one')}</div>
                                    <div className="pd-modal-card-value" translate="no">{(Number(selected.area_cm2) / 10000)?.toFixed(4)}<em>m²</em></div>
                                </div>
                                <div className="pd-modal-card">
                                    <div className="pd-modal-card-label">{t('quantity')}</div>
                                    <div className="pd-modal-card-row">
                                        <Hash size={16} color="#6366f1" />
                                        <div className="pd-modal-card-value" translate="no">{selected.quantity || 1}<em>{t('total_items')}</em></div>
                                    </div>
                                </div>
                                <div className="pd-modal-card accent">
                                    <div className="pd-modal-card-label">{t('stat_total_area')}</div>
                                    <div className="pd-modal-card-value" translate="no">{(Number(selected.area_cm2) * (selected.quantity || 1) / 10000).toFixed(4)}<em>m²</em></div>
                                </div>
                                <div className="pd-modal-card">
                                    <div className="pd-modal-card-label">{t('px_per_cm')}</div>
                                    <div className="pd-modal-card-row">
                                        <Ruler size={15} color="#6366f1" />
                                        <div className="pd-modal-card-value" style={{ fontSize: 17 }} translate="no">{Number(selected.pixels_per_cm).toFixed(2)}<em>px/cm</em></div>
                                    </div>
                                </div>
                            </div>
                            <div className="pd-modal-footer">
                                <Calendar size={13} />
                                {t('measured_at')} {fmt(selected.created_at)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editingId && (
                <div className="pd-modal-bg" onClick={e => e.target === e.currentTarget && setEditingId(null)}>
                    <div className="pd-qty-modal">
                        <button className="pd-modal-x" onClick={() => setEditingId(null)}><X size={18} /></button>
                        <h3>{t('edit_detail')}</h3>
                        {(() => {
                            const m = measurements.find(m => m.id === editingId);
                            const areaCm2 = Number(m?.area_cm2 || 0);
                            return (
                                <>
                                    <p className="pd-qty-sub">{t('area_one')}: <strong translate="no">{(areaCm2 / 10000)?.toFixed(4)} m²</strong></p>
                                    <div className="pd-field-group">
                                        <label className="pd-field-label">{t('detail_name')} <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input className="pd-field-input" type="text" value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            placeholder={t('detail_name_placeholder')} maxLength={100} autoFocus
                                            onKeyDown={e => e.key === 'Enter' && !editSaving && editName.trim() && saveEdit()} />
                                    </div>
                                    <div className="pd-field-group">
                                        <label className="pd-field-label">{t('quantity')}</label>
                                        <div className="pd-qty-control">
                                            <button onClick={() => setEditQuantity(q => Math.max(1, q - 1))}>−</button>
                                            <input type="number" min="1" max="9999" value={editQuantity}
                                                onChange={e => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
                                            <button onClick={() => setEditQuantity(q => Math.min(9999, q + 1))}>+</button>
                                        </div>
                                    </div>
                                    <div className="pd-qty-preview">
                                        <div><span>{t('area_one')}</span><strong translate="no">{(areaCm2 / 10000)?.toFixed(4)} m²</strong></div>
                                        <div><span>{t('total_area_qty', { qty: editQuantity })}</span>
                                            <strong translate="no">{(areaCm2 * editQuantity / 10000).toFixed(4)} m²</strong></div>
                                    </div>
                                    <div className="pd-qty-actions">
                                        <button className="pd-btn ghost" onClick={() => setEditingId(null)} disabled={editSaving}>{t('cancel')}</button>
                                        <button className="pd-btn primary" onClick={saveEdit} disabled={editSaving || !editName.trim()}>
                                            <Save size={15} />{editSaving ? t('updating') : t('update')}
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}

ScanPanel.propTypes = {
    project: PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired }).isRequired,
    cvReady: PropTypes.bool.isRequired,
    onSaved: PropTypes.func,
};
ManualDrawPanel.propTypes = {
    project: PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired }).isRequired,
    cvReady: PropTypes.bool,
    onSaved: PropTypes.func,
};
DownloadPanel.propTypes = {
    project: PropTypes.shape({ name: PropTypes.string.isRequired }).isRequired,
    measurements: PropTypes.array.isRequired,
};
ProjectDetail.propTypes = {
    project: PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired }).isRequired,
    onBack: PropTypes.func.isRequired,
};