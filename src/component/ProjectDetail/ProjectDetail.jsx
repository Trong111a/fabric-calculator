import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
    ArrowLeft, Folder, Layers, TrendingUp, Package,
    Trash2, X, ZoomIn, Calendar, Ruler, Hash,
    Camera, Upload, RotateCcw, CheckCircle, Plus
} from 'lucide-react';
import { api } from '../../services/api';
import './ProjectDetail.css';

/* ══════════════════════════════════════════════════════════════════
   SCAN SUB-COMPONENT
══════════════════════════════════════════════════════════════════ */
function ScanPanel({ project, cvReady, onSaved }) {
    const [image, setImage] = useState(null);
    const [rawImageData, setRawImageData] = useState(null);
    const [step, setStep] = useState('upload');
    const [polygonPoints, setPolygonPoints] = useState([]);
    const [pixelsPerCm, setPixelsPerCm] = useState(null);
    const [area, setArea] = useState(null);
    const [loading, setLoading] = useState(false);

    const [rulerPos, setRulerPos] = useState({ x: 100, y: 100 });
    const [rulerLength, setRulerLength] = useState(300);
    const [rulerAngle, setRulerAngle] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const [showQtyModal, setShowQtyModal] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [fileName, setFileName] = useState('');
    const [tempArea, setTempArea] = useState(null);
    const [tempPolygon, setTempPolygon] = useState(null);
    const [saving, setSaving] = useState(false);

    const canvasRef = useRef(null);
    const uploadRef = useRef(null);
    const cameraRef = useRef(null);

    const stepIndex = { upload: 0, calibrate: 1, scan: 2, result: 3 }[step];

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                setImage(img);
                const off = document.createElement('canvas');
                off.width = img.width; off.height = img.height;
                const octx = off.getContext('2d');
                octx.drawImage(img, 0, 0);
                setRawImageData(octx.getImageData(0, 0, img.width, img.height));
                setStep('calibrate');
                setPolygonPoints([]); setArea(null); setPixelsPerCm(null);
                setRulerPos({ x: img.width * 0.75, y: img.height * 0.2 });
                setRulerLength(img.height * 0.6);
                setRulerAngle(90);
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;
        const ctx = canvas.getContext('2d');
        canvas.width = image.width; canvas.height = image.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        if (step === 'calibrate') drawRuler(ctx);
        if (polygonPoints.length) {
            ctx.strokeStyle = '#6366f1'; ctx.fillStyle = 'rgba(99,102,241,0.15)'; ctx.lineWidth = 3;
            ctx.beginPath();
            polygonPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.closePath(); ctx.stroke(); ctx.fill();
            polygonPoints.forEach(p => {
                ctx.fillStyle = '#ef4444'; ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
            });
        }
    };

    const drawRuler = (ctx) => {
        ctx.save();
        ctx.translate(rulerPos.x, rulerPos.y);
        ctx.rotate((rulerAngle * Math.PI) / 180);
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillRect(-18, 0, 36, rulerLength);
        ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2;
        ctx.strokeRect(-18, 0, 36, rulerLength);
        const pxPerCm = rulerLength / 30;
        for (let i = 0; i <= 30; i++) {
            const y = i * pxPerCm;
            const isMajor = i % 5 === 0;
            ctx.strokeStyle = isMajor ? '#6366f1' : '#aaa';
            ctx.lineWidth = isMajor ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(isMajor ? -18 : -9, y);
            ctx.lineTo(isMajor ? 18 : 9, y);
            ctx.stroke();
            if (isMajor && i > 0) {
                ctx.fillStyle = '#374151'; ctx.font = 'bold 13px Arial';
                ctx.textAlign = 'center'; ctx.fillText(i.toString(), 0, y - 4);
            }
        }
        ctx.fillStyle = '#6366f1'; ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
    };

    useEffect(() => { if (image) drawCanvas(); }, [image, polygonPoints, step, rulerPos, rulerLength, rulerAngle]);

    const getCoords = (clientX, clientY) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height),
        };
    };

    const startDrag = (x, y) => {
        const rad = (-rulerAngle * Math.PI) / 180;
        const dx = x - rulerPos.x, dy = y - rulerPos.y;
        const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
        const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
        if (Math.abs(localX) < 20 && localY >= -10 && localY <= rulerLength + 10) {
            setIsDragging(true); setDragStart({ x: dx, y: dy });
        }
    };
    const doDrag = (x, y) => setRulerPos({ x: x - dragStart.x, y: y - dragStart.y });

    const onMouseDown = (e) => { if (step !== 'calibrate') return; const c = getCoords(e.clientX, e.clientY); startDrag(c.x, c.y); };
    const onMouseMove = (e) => { if (!isDragging) return; const c = getCoords(e.clientX, e.clientY); doDrag(c.x, c.y); };
    const onMouseUp = () => setIsDragging(false);
    const onTouchStart = (e) => { if (step !== 'calibrate') return; e.preventDefault(); const t = e.touches[0]; const c = getCoords(t.clientX, t.clientY); startDrag(c.x, c.y); };
    const onTouchMove = (e) => { if (!isDragging) return; e.preventDefault(); const t = e.touches[0]; const c = getCoords(t.clientX, t.clientY); doDrag(c.x, c.y); };
    const onTouchEnd = (e) => { e.preventDefault(); setIsDragging(false); };

    const rotateRuler = (delta) => setRulerAngle(prev => (prev + delta + 360) % 360);

    const confirmCalibration = () => {
        const ppc = rulerLength / 30;
        setPixelsPerCm(ppc); setStep('scan');
        alert(`✅ Đã hiệu chuẩn: ${ppc.toFixed(2)} px/cm`);
    };

    const scanAndCalc = async () => {
        if (!rawImageData || !cvReady || !pixelsPerCm) {
            alert('⚠️ Chưa hiệu chuẩn hoặc OpenCV chưa sẵn sàng'); return;
        }
        setLoading(true);
        try {
            const cv = window.cv;
            const src = cv.matFromImageData(rawImageData);
            const hsv = new cv.Mat();
            cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
            cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
            const lowerGray = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 0, 60, 0]);
            const upperGray = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [180, 60, 255, 255]);
            const mask = new cv.Mat();
            cv.inRange(hsv, lowerGray, upperGray, mask);
            const k1 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
            const cleaned = new cv.Mat();
            cv.morphologyEx(mask, cleaned, cv.MORPH_OPEN, k1, new cv.Point(-1, -1), 1);
            const k2 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
            const filled = new cv.Mat();
            cv.morphologyEx(cleaned, filled, cv.MORPH_CLOSE, k2, new cv.Point(-1, -1), 1);
            const contours = new cv.MatVector(); const hierarchy = new cv.Mat();
            cv.findContours(filled, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
            let bestCnt = null, maxScore = 0;
            const imgArea = src.cols * src.rows, imgW = src.cols, imgH = src.rows;
            for (let i = 0; i < contours.size(); ++i) {
                const cnt = contours.get(i);
                const area = cv.contourArea(cnt);
                const pct = (area / imgArea) * 100;
                if (pct < 2 || pct > 90) continue;
                const rect = cv.boundingRect(cnt);
                const peri = cv.arcLength(cnt, true);
                const ar = Math.max(rect.width, rect.height) / Math.min(rect.width, rect.height);
                if (rect.x <= 10 || rect.y <= 10 || rect.x + rect.width >= imgW - 10 || rect.y + rect.height >= imgH - 10) continue;
                if (ar > 20) continue;
                const score = area * ((4 * Math.PI * area) / (peri * peri));
                if (score > maxScore) { maxScore = score; bestCnt = cnt; }
            }
            if (!bestCnt) throw new Error('Không tìm thấy rập!');
            const peri = cv.arcLength(bestCnt, true);
            const approx = new cv.Mat();
            cv.approxPolyDP(bestCnt, approx, 0.002 * peri, true);
            const pts = [];
            for (let i = 0; i < approx.rows; ++i) pts.push({ x: approx.data32S[i * 2], y: approx.data32S[i * 2 + 1] });
            if (pts.length < 4) {
                const hull = new cv.Mat();
                cv.convexHull(bestCnt, hull, false, true);
                pts.length = 0;
                for (let i = 0; i < hull.data32S.length; i += 2) pts.push({ x: hull.data32S[i], y: hull.data32S[i + 1] });
                hull.delete();
            }
            let s = 0;
            for (let i = 0; i < pts.length; i++) { const j = (i + 1) % pts.length; s += pts[i].x * pts[j].y - pts[j].x * pts[i].y; }
            const areaCm2 = (Math.abs(s) / 2) / (pixelsPerCm * pixelsPerCm);
            setTempArea(areaCm2);
            setTempPolygon(pts);
            setFileName('');
            setShowQtyModal(true);
            src.delete(); hsv.delete(); lowerGray.delete(); upperGray.delete(); mask.delete();
            k1.delete(); cleaned.delete(); k2.delete(); filled.delete();
            contours.delete(); hierarchy.delete(); approx.delete();
        } catch (e) {
            alert(`⚠️ ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const saveWithQuantity = async () => {
        if (!fileName.trim()) {
            alert('Vui lòng nhập tên chi tiết');
            return;
        }
        setSaving(true);
        try {
            const imageData = canvasRef.current.toDataURL('image/jpeg', 0.7);
            await api.createMeasurement({
                name: fileName.trim(),
                area_cm2: tempArea, pixels_per_cm: pixelsPerCm,
                polygon_points: tempPolygon, image_width: image.width,
                image_height: image.height, image_data: imageData,
                quantity, project_id: project.id
            });
            setArea(tempArea); setPolygonPoints(tempPolygon);
            setStep('result'); setShowQtyModal(false);
            const total = tempArea * quantity;
            alert(`✅ Đã lưu "${fileName.trim()}" vào folder "${project.name}"!\n1 chi tiết: ${tempArea.toFixed(2)} cm²\nSố lượng: ${quantity}\nTổng: ${(total / 10000).toFixed(4)} m²`);
            setTempArea(null); setTempPolygon(null); setQuantity(1); setFileName('');
            onSaved();
        } catch (error) {
            alert('Lỗi lưu: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const reset = () => {
        setImage(null); setRawImageData(null); setStep('upload');
        setPolygonPoints([]); setArea(null); setPixelsPerCm(null);
        setTempArea(null); setTempPolygon(null); setQuantity(1); setFileName('');
    };

    return (
        <div className="pd-scan-wrap">

            {/* cv badge */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {!cvReady
                    ? <span className="pd-cv-badge">⏳ Đang tải OpenCV...</span>
                    : <span className="pd-cv-badge ready">✓ OpenCV sẵn sàng</span>
                }
            </div>

            {/* Step indicator */}
            {step !== 'upload' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
                    {['Tải ảnh', 'Hiệu chuẩn', 'Quét rập', 'Kết quả'].map((label, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 700,
                                    background: i < stepIndex ? '#10b981' : i === stepIndex ? '#6366f1' : '#f4f6fb',
                                    border: `2px solid ${i < stepIndex ? '#10b981' : i === stepIndex ? '#6366f1' : '#e0e4ef'}`,
                                    color: i <= stepIndex ? '#fff' : '#9ca3af',
                                    boxShadow: i === stepIndex ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
                                }}>
                                    {i < stepIndex ? '✓' : i + 1}
                                </div>
                                <span style={{
                                    fontSize: 12, fontWeight: 600,
                                    color: i < stepIndex ? '#10b981' : i === stepIndex ? '#6366f1' : '#9ca3af',
                                }}>{label}</span>
                            </div>
                            {i < 3 && <div style={{ width: 32, height: 2, background: i < stepIndex ? '#10b981' : '#e0e4ef', margin: '0 4px' }} />}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Upload ── */}
            {step === 'upload' && (
                <div className="pd-upload-screen">
                    <div className="pd-upload-hero">
                        <div className="pd-upload-hero-icon">
                            <Ruler size={48} color="#6366f1" />
                        </div>
                        <h2>Đo chi tiết mới</h2>
                        <p>Tải ảnh hoặc chụp ảnh bản rập để đo & lưu vào folder <strong>{project.name}</strong></p>
                    </div>
                    <input ref={uploadRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} style={{ display: 'none' }} />
                    <div className="pd-upload-btns">
                        <button className="pd-upload-btn primary" disabled={!cvReady} onClick={() => uploadRef.current?.click()}>
                            <Upload size={22} />
                            <span>Tải ảnh lên</span>
                            <small>JPG, PNG, WEBP</small>
                        </button>
                        <button className="pd-upload-btn" disabled={!cvReady} onClick={() => cameraRef.current?.click()}>
                            <Camera size={22} />
                            <span>Chụp ảnh</span>
                            <small>Dùng camera</small>
                        </button>
                    </div>
                </div>
            )}

            {/* ── Calibrate ── */}
            {step === 'calibrate' && image && (
                <>
                    <div className="pd-guide">
                        <span className="pd-guide-icon">📏</span>
                        <div>
                            <strong>Hiệu chuẩn thước đo</strong>
                            <span>Kéo thước vào cạnh thước thật · 30 vạch = 30 cm</span>
                        </div>
                    </div>
                    <div className="pd-canvas-wrap">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={onMouseDown} onMouseMove={onMouseMove}
                            onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                        />
                    </div>
                    <div className="pd-controls">
                        <div className="pd-control-group">
                            <label>Chiều dài thước</label>
                            <div className="pd-slider-row">
                                <input type="range" min="100" max={image?.height || 800}
                                    value={rulerLength} onChange={e => setRulerLength(Number(e.target.value))} />
                                <div className="pd-badges">
                                    <span className="pd-badge">{Math.round(rulerLength)} px</span>
                                    <span className="pd-badge accent">{(rulerLength / 30).toFixed(1)} px/cm</span>
                                </div>
                            </div>
                        </div>
                        <div className="pd-control-group">
                            <label>Góc xoay</label>
                            <div className="pd-angle-row">
                                <button onClick={() => rotateRuler(-10)}>↺ −10°</button>
                                <input
                                    type="number"
                                    min="0"
                                    max="359"
                                    value={rulerAngle}
                                    onChange={e => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) setRulerAngle(((val % 360) + 360) % 360);
                                    }}
                                    style={{
                                        width: 64, textAlign: 'center',
                                        fontFamily: "'DM Mono', monospace",
                                        fontSize: 14, fontWeight: 600,
                                        border: '1.5px solid #6366f1', borderRadius: 7,
                                        padding: '5px 4px', color: '#6366f1',
                                        outline: 'none', background: '#eef2ff',
                                    }}
                                />
                                <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: -6 }}>°</span>
                                <button onClick={() => rotateRuler(10)}>↻ +10°</button>
                                <button onClick={() => setRulerAngle(90)}>90°</button>
                                <button onClick={() => setRulerAngle(0)}>0°</button>
                            </div>
                        </div>
                    </div>
                    <div className="pd-actions">
                        <button className="pd-btn ghost" onClick={reset}><RotateCcw size={15} /> Làm lại</button>
                        <button className="pd-btn primary" onClick={confirmCalibration}>
                            <CheckCircle size={15} /> Xác nhận · {(rulerLength / 30).toFixed(1)} px/cm
                        </button>
                    </div>
                </>
            )}

            {/* ── Scan / Result ── */}
            {(step === 'scan' || step === 'result') && image && (
                <>
                    <div className="pd-guide">
                        <span className="pd-guide-icon">{step === 'scan' ? '🔍' : '✅'}</span>
                        <div>
                            <strong>{step === 'scan' ? 'Quét & nhận diện rập' : 'Hoàn tất'}</strong>
                            <span>
                                Tỷ lệ: <b>{pixelsPerCm?.toFixed(2)} px/cm</b>
                                {' · Folder: '}<b>{project.name}</b>
                            </span>
                        </div>
                    </div>
                    <div className="pd-canvas-wrap">
                        <canvas ref={canvasRef} />
                        {loading && (
                            <div className="pd-overlay">
                                <div className="pd-overlay-spinner" />
                                <span>Đang quét...</span>
                            </div>
                        )}
                    </div>

                    {step === 'scan' && (
                        <div className="pd-actions">
                            <button className="pd-btn ghost" onClick={reset}><RotateCcw size={15} /> Làm lại</button>
                            <button className="pd-btn ghost" onClick={() => setStep('calibrate')}>← Hiệu chuẩn lại</button>
                            <button className="pd-btn primary" disabled={loading} onClick={scanAndCalc}>
                                <Ruler size={15} /> Quét & Tính
                            </button>
                        </div>
                    )}

                    {step === 'result' && area !== null && (
                        <>
                            <div className="pd-result-grid">
                                <div className="pd-result-card accent">
                                    <span>Diện tích 1 chi tiết</span>
                                    <strong>{area.toFixed(2)}<em>cm²</em></strong>
                                </div>
                                <div className="pd-result-card">
                                    <span>Quy đổi</span>
                                    <strong>{(area / 10000).toFixed(4)}<em>m²</em></strong>
                                </div>
                                <div className="pd-result-card">
                                    <span>Tỷ lệ</span>
                                    <strong>{pixelsPerCm?.toFixed(2)}<em>px/cm</em></strong>
                                </div>
                                <div className="pd-result-card">
                                    <span>Số đỉnh</span>
                                    <strong>{polygonPoints.length}<em>đỉnh</em></strong>
                                </div>
                                {quantity > 1 && (
                                    <>
                                        <div className="pd-result-card">
                                            <span>Số lượng</span>
                                            <strong>{quantity}<em>chi tiết</em></strong>
                                        </div>
                                        <div className="pd-result-card accent">
                                            <span>Tổng diện tích</span>
                                            <strong>{(area * quantity / 10000).toFixed(4)}<em>m²</em></strong>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="pd-actions">
                                <button className="pd-btn ghost" onClick={reset}><RotateCcw size={15} /> Đo rập khác</button>
                                <button className="pd-btn ghost" onClick={() => { setStep('scan'); setPolygonPoints([]); setArea(null); }}>← Quét lại</button>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ── Modal lưu ── */}
            {showQtyModal && (
                <div className="pd-modal-bg">
                    <div className="pd-qty-modal">
                        <h3>Lưu chi tiết</h3>
                        <p className="pd-qty-sub">
                            Diện tích 1 chi tiết: <strong>{tempArea?.toFixed(2)} cm²</strong>
                        </p>

                        {/* Tên chi tiết */}
                        <div className="pd-field-group">
                            <label className="pd-field-label">
                                Tên chi tiết <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                className="pd-field-input"
                                type="text"
                                value={fileName}
                                onChange={e => setFileName(e.target.value)}
                                placeholder="VD: Thân trước, Tay áo, Cổ áo..."
                                maxLength={100}
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && !saving && fileName.trim() && saveWithQuantity()}
                            />
                        </div>

                        {/* Số lượng */}
                        <div className="pd-field-group">
                            <label className="pd-field-label">Số lượng</label>
                            <div className="pd-qty-control">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                                <input
                                    type="number" min="1" max="9999" value={quantity}
                                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                />
                                <button onClick={() => setQuantity(q => Math.min(9999, q + 1))}>+</button>
                            </div>
                        </div>

                        <div className="pd-qty-preview">
                            <div><span>Tổng</span><strong>{((tempArea || 0) * quantity).toFixed(2)} cm²</strong></div>
                            <div><span>Quy đổi</span><strong>{(((tempArea || 0) * quantity) / 10000).toFixed(4)} m²</strong></div>
                        </div>

                        <div className="pd-qty-actions">
                            <button className="pd-btn ghost" onClick={() => setShowQtyModal(false)} disabled={saving}>Hủy</button>
                            <button
                                className="pd-btn primary"
                                onClick={saveWithQuantity}
                                disabled={saving || !fileName.trim()}
                            >
                                {saving ? 'Đang lưu...' : '💾 Lưu vào folder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function ProjectDetail({ project, onBack }) {
    const [tab, setTab] = useState('list');
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [cvReady, setCvReady] = useState(false);

    useEffect(() => {
        const check = () => {
            if (window.cv && window.cv.Mat) setCvReady(true);
            else setTimeout(check, 100);
        };
        if (!document.getElementById('opencv-script')) {
            const script = document.createElement('script');
            script.id = 'opencv-script';
            script.src = 'https://docs.opencv.org/4.5.2/opencv.js';
            script.async = true;
            script.onload = check;
            document.body.appendChild(script);
        } else check();
    }, []);

    useEffect(() => { loadDetail(); }, [project.id]);

    const loadDetail = async () => {
        setLoading(true);
        try {
            const data = await api.getProject(project.id);
            setMeasurements(data.measurements || []);
        } catch (err) {
            console.error('Lỗi tải chi tiết folder:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Xóa chi tiết này?')) return;
        setDeletingId(id);
        try {
            await api.deleteMeasurement(id);
            setMeasurements(prev => prev.filter(m => m.id !== id));
            if (selected?.id === id) setSelected(null);
        } catch {
            alert('Xóa thất bại');
        } finally {
            setDeletingId(null);
        }
    };

    const fmt = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const parsePolygon = (raw) => {
        try { const p = typeof raw === 'string' ? JSON.parse(raw) : raw; return Array.isArray(p) ? p.length : 0; }
        catch { return 0; }
    };

    const totalArea = measurements.reduce((s, m) => s + (Number(m.area_cm2) * (m.quantity || 1)), 0);
    const totalQty = measurements.reduce((s, m) => s + (m.quantity || 1), 0);

    return (
        <div className="pd-wrap">

            {/* ── Header ── */}
            <header className="pd-header">
                <button className="pd-back-btn" onClick={onBack}>
                    <ArrowLeft size={18} />
                    <span>Quay lại</span>
                </button>
                <div className="pd-header-center">
                    <div className="pd-header-icon">
                        <Folder size={22} color="#fff" />
                    </div>
                    <div>
                        <h1 className="pd-header-title">{project.name}</h1>
                        <p className="pd-header-sub">
                            {measurements.length} chi tiết · {(totalArea / 10000).toFixed(4)} m²
                        </p>
                    </div>
                </div>
                <div style={{ width: 110, flexShrink: 0 }} />
            </header>

            {/* ── Tabs ── */}
            <div className="pd-tabs">
                <button className={`pd-tab${tab === 'list' ? ' active' : ''}`} onClick={() => setTab('list')}>
                    <Layers size={15} />
                    Danh sách ({measurements.length})
                </button>
                <button className={`pd-tab${tab === 'scan' ? ' active' : ''}`} onClick={() => setTab('scan')}>
                    <Plus size={15} />
                    Đo chi tiết mới
                </button>
            </div>

            {/* ── Tab: List ── */}
            {tab === 'list' && (
                <>
                    <div className="pd-stats-bar">
                        {[
                            { icon: <Layers size={16} />, label: 'Số chi tiết', value: measurements.length },
                            { icon: <Package size={16} />, label: 'Tổng số lượng', value: totalQty },
                            { icon: <TrendingUp size={16} />, label: 'Tổng diện tích', value: `${(totalArea / 10000).toFixed(4)} m²` },
                        ].map((stat, i) => (
                            <div key={i} className="pd-stat-item">
                                <div className="pd-stat-icon">{stat.icon}</div>
                                <div>
                                    <div className="pd-stat-value">{stat.value}</div>
                                    <div className="pd-stat-label">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <main className="pd-main">
                        {loading ? (
                            <div className="pd-loading">
                                <div className="pd-spinner" /> Đang tải...
                            </div>
                        ) : measurements.length === 0 ? (
                            <div className="pd-empty">
                                <div className="pd-empty-icon"><Layers size={40} /></div>
                                <h3 className="pd-empty-title">Folder trống</h3>
                                <p className="pd-empty-text">Chưa có chi tiết nào được lưu vào folder này</p>
                                <button className="pd-empty-action" onClick={() => setTab('scan')}>
                                    <Plus size={15} /> Đo chi tiết đầu tiên
                                </button>
                            </div>
                        ) : (
                            <div className="pd-grid">
                                {measurements.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`pd-card${deletingId === m.id ? ' is-deleting' : ''}`}
                                        onClick={() => setSelected(m)}
                                    >
                                        {m.thumbnail_url ? (
                                            <img className="pd-card-thumb" src={m.thumbnail_url} alt={m.name}
                                                onError={e => { e.target.style.display = 'none'; }} />
                                        ) : (
                                            <div className="pd-card-thumb-placeholder"><Layers size={40} /></div>
                                        )}
                                        <div className="pd-card-hint"><ZoomIn size={12} /> Xem chi tiết</div>
                                        <button className="pd-delete-btn" onClick={(e) => handleDelete(e, m.id)} title="Xóa">
                                            <Trash2 size={13} />
                                        </button>
                                        <div className="pd-card-body">
                                            <h3 className="pd-card-title">{m.name}</h3>
                                            <div className="pd-card-meta">
                                                <div className="pd-meta-row">
                                                    <span className="pd-meta-dot" />
                                                    <span className="pd-meta-text">{fmt(m.created_at)}</span>
                                                </div>
                                                <div className="pd-meta-row">
                                                    <span className="pd-meta-dot" />
                                                    <span className="pd-meta-text">SL: {m.quantity || 1} chi tiết</span>
                                                </div>
                                            </div>
                                            <div className="pd-card-area">
                                                <span className="pd-area-value">
                                                    {(Number(m.area_cm2) * (m.quantity || 1) / 10000).toFixed(4)}
                                                </span>
                                                <span className="pd-area-unit">m²</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </>
            )}

            {/* ── Tab: Scan ── */}
            {tab === 'scan' && (
                <ScanPanel
                    project={project}
                    cvReady={cvReady}
                    onSaved={() => { loadDetail(); setTab('list'); }}
                />
            )}

            {/* ── Detail Modal ── */}
            {selected && (
                <div className="pd-modal-bg" onClick={() => setSelected(null)}>
                    <div className="pd-modal" onClick={e => e.stopPropagation()}>
                        {selected.image_url ? (
                            <div style={{ position: 'relative' }}>
                                <img className="pd-modal-img" src={selected.image_url} alt={selected.name} />
                                <button className="pd-modal-close" onClick={() => setSelected(null)}>
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="pd-modal-img-placeholder" style={{ position: 'relative' }}>
                                <Layers size={56} />
                                <button className="pd-modal-close" onClick={() => setSelected(null)}>
                                    <X size={18} />
                                </button>
                            </div>
                        )}
                        <div className="pd-modal-body">
                            <h2 className="pd-modal-title">{selected.name}</h2>
                            <div className="pd-modal-grid">
                                <div className="pd-modal-card accent">
                                    <div className="pd-modal-card-label">Diện tích 1 chi tiết</div>
                                    <div className="pd-modal-card-value">
                                        {Number(selected.area_cm2).toFixed(2)}<em>cm²</em>
                                    </div>
                                </div>
                                <div className="pd-modal-card">
                                    <div className="pd-modal-card-label">Số lượng</div>
                                    <div className="pd-modal-card-row">
                                        <Hash size={16} color="#6366f1" />
                                        <div className="pd-modal-card-value">
                                            {selected.quantity || 1}<em>chi tiết</em>
                                        </div>
                                    </div>
                                </div>
                                <div className="pd-modal-card accent">
                                    <div className="pd-modal-card-label">Tổng diện tích</div>
                                    <div className="pd-modal-card-value">
                                        {(Number(selected.area_cm2) * (selected.quantity || 1) / 10000).toFixed(4)}<em>m²</em>
                                    </div>
                                </div>
                                <div className="pd-modal-card">
                                    <div className="pd-modal-card-label">Tỷ lệ px/cm</div>
                                    <div className="pd-modal-card-row">
                                        <Ruler size={15} color="#6366f1" />
                                        <div className="pd-modal-card-value" style={{ fontSize: 17 }}>
                                            {Number(selected.pixels_per_cm).toFixed(2)}<em>px/cm</em>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pd-modal-footer">
                                <Calendar size={13} />
                                Đo lúc: {fmt(selected.created_at)}
                                {parsePolygon(selected.polygon_points) > 0 &&
                                    <span>· {parsePolygon(selected.polygon_points)} đỉnh</span>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

ScanPanel.propTypes = {
    project: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    }).isRequired,
    cvReady: PropTypes.bool.isRequired,
    onSaved: PropTypes.func.isRequired,
};

ProjectDetail.propTypes = {
    project: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    }).isRequired,
    onBack: PropTypes.func.isRequired,
};