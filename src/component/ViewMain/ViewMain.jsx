/* ViewMain.jsx */
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Camera, Upload, RotateCcw, Ruler, Folder, LogOut, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import ProjectManager from '../ProjectManager/ProjectManager';
import './ViewMain.css';

function ViewMain({ user, onLogout }) {
    const [image, setImage] = useState(null);
    const [rawImageData, setRawImageData] = useState(null);
    const [step, setStep] = useState('upload');
    const [polygonPoints, setPolygonPoints] = useState([]);
    const [pixelsPerCm, setPixelsPerCm] = useState(null);
    const [area, setArea] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cvReady, setCvReady] = useState(false);

    const [rulerPos, setRulerPos] = useState({ x: 100, y: 100 });
    const [rulerLength, setRulerLength] = useState(300);
    const [rulerAngle, setRulerAngle] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const canvasRef = useRef(null);
    const uploadRef = useRef(null);
    const cameraRef = useRef(null);

    const [showQuantityModal, setShowQuantityModal] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [fileName, setFileName] = useState('');
    const [tempArea, setTempArea] = useState(null);
    const [tempPolygon, setTempPolygon] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showProjectManager, setShowProjectManager] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadOpenCV = () => {
            if (window.cv && window.cv.Mat) setCvReady(true);
            else setTimeout(loadOpenCV, 100);
        };
        if (!document.getElementById('opencv-script')) {
            const script = document.createElement('script');
            script.id = 'opencv-script';
            script.src = 'https://docs.opencv.org/4.5.2/opencv.js';
            script.async = true;
            script.onload = () => loadOpenCV();
            document.body.appendChild(script);
        } else {
            loadOpenCV();
        }
    }, []);

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
        if (step === 'calibrate') drawVirtualRuler(ctx);
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

    const drawVirtualRuler = (ctx) => {
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
                ctx.textAlign = 'center'; ctx.fillText(i.toString(), 0, y - 5);
            }
        }
        ctx.fillStyle = '#6366f1'; ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
    };

    useEffect(() => { if (image) drawCanvas(); }, [image, polygonPoints, step, rulerPos, rulerLength, rulerAngle]);

    const getCanvasCoords = (clientX, clientY) => {
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

    const handleMouseDown = (e) => { if (step !== 'calibrate') return; const c = getCanvasCoords(e.clientX, e.clientY); startDrag(c.x, c.y); };
    const handleMouseMove = (e) => { if (!isDragging || step !== 'calibrate') return; const c = getCanvasCoords(e.clientX, e.clientY); doDrag(c.x, c.y); };
    const handleMouseUp = () => setIsDragging(false);
    const handleTouchStart = (e) => { if (step !== 'calibrate') return; e.preventDefault(); const t = e.touches[0]; const c = getCanvasCoords(t.clientX, t.clientY); startDrag(c.x, c.y); };
    const handleTouchMove = (e) => { if (!isDragging || step !== 'calibrate') return; e.preventDefault(); const t = e.touches[0]; const c = getCanvasCoords(t.clientX, t.clientY); doDrag(c.x, c.y); };
    const handleTouchEnd = (e) => { e.preventDefault(); setIsDragging(false); };

    const rotateRuler = (delta) => setRulerAngle(prev => (prev + delta + 360) % 360);

    const confirmCalibration = () => {
        const ppc = rulerLength / 30;
        setPixelsPerCm(ppc); setStep('scan');
        alert(`✅ Đã hiệu chuẩn: ${ppc.toFixed(2)} px/cm`);
    };

    const scanAndCalc = async () => {
        if (!rawImageData || !cvReady || !pixelsPerCm) { alert('⚠️ Chưa hiệu chuẩn hoặc OpenCV chưa sẵn sàng'); return; }
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
            const kernelOpen = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
            const cleaned = new cv.Mat();
            cv.morphologyEx(mask, cleaned, cv.MORPH_OPEN, kernelOpen, new cv.Point(-1, -1), 1);
            const kernelClose = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
            const filled = new cv.Mat();
            cv.morphologyEx(cleaned, filled, cv.MORPH_CLOSE, kernelClose, new cv.Point(-1, -1), 1);
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
            setFileName(''); // ← luôn để trống, tự đặt tên
            setShowQuantityModal(true);
            src.delete(); hsv.delete(); lowerGray.delete(); upperGray.delete(); mask.delete();
            kernelOpen.delete(); cleaned.delete(); kernelClose.delete(); filled.delete();
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
                quantity, project_id: selectedProject?.id
            });
            setArea(tempArea); setPolygonPoints(tempPolygon); setStep('result'); setShowQuantityModal(false);
            const total = tempArea * quantity;
            alert(`✅ Đã lưu "${fileName.trim()}"!\n1 chi tiết: ${tempArea.toFixed(2)} cm²\nSố lượng: ${quantity}\nTổng: ${total.toFixed(2)} cm² (${(total / 10000).toFixed(4)} m²)`);
            setTempArea(null); setTempPolygon(null); setQuantity(1); setFileName('');
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

    if (showProjectManager) {
        return (
            <ProjectManager
                onSelectProject={(project) => { setSelectedProject(project); setShowProjectManager(false); }}
                onBack={() => setShowProjectManager(false)}
            />
        );
    }

    const stepIndex = { upload: 0, calibrate: 1, scan: 2, result: 3 }[step];

    return (
        <div className="vm-wrap">
            {/* ── Header ── */}
            <header className="vm-header">
                <div className="vm-header-left">
                    <div className="vm-logo">
                        <Ruler size={20} color="#fff" />
                    </div>
                    <div>
                        <h1 className="vm-title">Tính Diện Tích Rập</h1>
                        {!cvReady && <span className="vm-cv-badge">⏳ Đang tải OpenCV...</span>}
                        {cvReady && <span className="vm-cv-badge ready">✓ Sẵn sàng</span>}
                    </div>
                </div>

                <div className="vm-header-right">
                    {selectedProject && (
                        <div className="vm-project-chip">
                            <Folder size={13} />
                            <span>{selectedProject.name}</span>
                        </div>
                    )}
                    <button className="vm-folder-btn" onClick={() => setShowProjectManager(true)}>
                        <Folder size={15} />
                        <span>{selectedProject ? 'Đổi folder' : 'Folder'}</span>
                    </button>
                    <div className="vm-user-chip">
                        <div className="vm-avatar">{(user?.name || 'U')[0].toUpperCase()}</div>
                        <span>{user?.name || 'User'}</span>
                    </div>
                    <button className="vm-logout-btn" onClick={onLogout} title="Đăng xuất">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* ── Step indicator ── */}
            {step !== 'upload' && (
                <div className="vm-steps">
                    {['Tải ảnh', 'Hiệu chuẩn', 'Quét rập', 'Kết quả'].map((label, i) => (
                        <div key={i} className={`vm-step ${i < stepIndex ? 'done' : ''} ${i === stepIndex ? 'active' : ''}`}>
                            <div className="vm-step-dot">{i < stepIndex ? '✓' : i + 1}</div>
                            <span className="vm-step-label">{label}</span>
                            {i < 3 && <div className="vm-step-line" />}
                        </div>
                    ))}
                </div>
            )}

            <main className="vm-main">

                {/* ── Upload ── */}
                {step === 'upload' && (
                    <div className="vm-upload-screen">
                        <div className="vm-upload-hero">
                            <div className="vm-upload-icon">
                                <Ruler size={48} color="#6366f1" />
                            </div>
                            <h2>Đo diện tích bản rập</h2>
                            <p>Tải ảnh hoặc chụp ảnh bản rập để bắt đầu đo tự động</p>
                        </div>
                        <input ref={uploadRef} type="file" accept="image/*" onChange={handleImageUpload} className="vm-hidden" />
                        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="vm-hidden" />
                        <div className="vm-upload-btns">
                            <button className="vm-upload-btn primary" disabled={!cvReady} onClick={() => uploadRef.current?.click()}>
                                <Upload size={22} />
                                <span>Tải ảnh lên</span>
                                <small>JPG, PNG, WEBP</small>
                            </button>
                            <button className="vm-upload-btn" disabled={!cvReady} onClick={() => cameraRef.current?.click()}>
                                <Camera size={22} />
                                <span>Chụp ảnh</span>
                                <small>Dùng camera</small>
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Calibrate ── */}
                {step === 'calibrate' && image && (
                    <div className="vm-section">
                        <div className="vm-guide">
                            <span className="vm-guide-icon">📏</span>
                            <div>
                                <strong>Hiệu chuẩn thước đo</strong>
                                <span>Kéo thước vào cạnh thước thật · 30 vạch = 30 cm</span>
                            </div>
                        </div>
                        <div className="vm-canvas-wrap">
                            <canvas
                                ref={canvasRef}
                                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                            />
                        </div>
                        <div className="vm-controls">
                            <div className="vm-control-group">
                                <label>Chiều dài thước</label>
                                <div className="vm-slider-row">
                                    <input type="range" min="100" max={image?.height || 800}
                                        value={rulerLength} onChange={e => setRulerLength(Number(e.target.value))} />
                                    <div className="vm-badges">
                                        <span className="vm-badge">{Math.round(rulerLength)} px</span>
                                        <span className="vm-badge accent">{(rulerLength / 30).toFixed(1)} px/cm</span>
                                    </div>
                                </div>
                            </div>
                            <div className="vm-control-group">
                                <label>Góc xoay</label>
                                <div className="vm-angle-row">
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
                                            width: 64,
                                            textAlign: 'center',
                                            fontFamily: "'DM Mono', monospace",
                                            fontSize: 14,
                                            fontWeight: 600,
                                            border: '1.5px solid #6366f1',
                                            borderRadius: 7,
                                            padding: '5px 4px',
                                            color: '#6366f1',
                                            outline: 'none',
                                            background: '#eef2ff',
                                        }}
                                    />
                                    <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: -6 }}>°</span>
                                    <button onClick={() => rotateRuler(10)}>↻ +10°</button>
                                    <button onClick={() => setRulerAngle(90)}>90°</button>
                                    <button onClick={() => setRulerAngle(0)}>0°</button>
                                </div>
                            </div>
                        </div>
                        <div className="vm-actions">
                            <button className="vm-btn ghost" onClick={reset}><RotateCcw size={15} /> Làm lại</button>
                            <button className="vm-btn primary" onClick={confirmCalibration}>
                                <CheckCircle size={15} /> Xác nhận · {(rulerLength / 30).toFixed(1)} px/cm
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Scan / Result ── */}
                {(step === 'scan' || step === 'result') && image && (
                    <div className="vm-section">
                        <div className="vm-guide">
                            <span className="vm-guide-icon">{step === 'scan' ? '🔍' : '✅'}</span>
                            <div>
                                <strong>{step === 'scan' ? 'Quét & nhận diện rập' : 'Hoàn tất'}</strong>
                                <span>
                                    Tỷ lệ: <b>{pixelsPerCm?.toFixed(2)} px/cm</b>
                                    {selectedProject && <> · Folder: <b>{selectedProject.name}</b></>}
                                </span>
                            </div>
                        </div>
                        <div className="vm-canvas-wrap">
                            <canvas ref={canvasRef} />
                            {loading && (
                                <div className="vm-overlay">
                                    <div className="vm-spinner" />
                                    <span>Đang quét...</span>
                                </div>
                            )}
                        </div>

                        {step === 'scan' && (
                            <div className="vm-actions">
                                <button className="vm-btn ghost" onClick={reset}><RotateCcw size={15} /> Làm lại</button>
                                <button className="vm-btn ghost" onClick={() => setStep('calibrate')}>← Hiệu chuẩn lại</button>
                                <button className="vm-btn primary" disabled={loading} onClick={scanAndCalc}>
                                    <Ruler size={15} /> Quét & Tính
                                </button>
                            </div>
                        )}

                        {step === 'result' && area !== null && (
                            <>
                                <div className="vm-result-grid">
                                    <div className="vm-result-card accent">
                                        <span>Diện tích 1 chi tiết</span>
                                        <strong>{area.toFixed(2)}<em>cm²</em></strong>
                                    </div>
                                    <div className="vm-result-card">
                                        <span>Quy đổi</span>
                                        <strong>{(area / 10000).toFixed(4)}<em>m²</em></strong>
                                    </div>
                                    <div className="vm-result-card">
                                        <span>Tỷ lệ</span>
                                        <strong>{pixelsPerCm?.toFixed(2)}<em>px/cm</em></strong>
                                    </div>
                                    <div className="vm-result-card">
                                        <span>Số đỉnh</span>
                                        <strong>{polygonPoints.length}<em>đỉnh</em></strong>
                                    </div>
                                    {quantity > 1 && (
                                        <>
                                            <div className="vm-result-card">
                                                <span>Số lượng</span>
                                                <strong>{quantity}<em>chi tiết</em></strong>
                                            </div>
                                            <div className="vm-result-card accent">
                                                <span>Tổng diện tích</span>
                                                <strong>{(area * quantity / 10000).toFixed(4)}<em>m²</em></strong>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="vm-actions">
                                    <button className="vm-btn ghost" onClick={reset}><RotateCcw size={15} /> Đo rập khác</button>
                                    <button className="vm-btn ghost" onClick={() => { setStep('scan'); setPolygonPoints([]); setArea(null); }}>← Quét lại</button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </main>

            {/* ── Quantity Modal ── */}
            {showQuantityModal && (
                <div className="vm-modal-bg">
                    <div className="vm-modal">
                        <h3>Lưu chi tiết</h3>
                        <p className="vm-modal-sub">
                            Diện tích 1 chi tiết: <strong>{tempArea?.toFixed(2)} cm²</strong>
                        </p>

                        {/* ── Tên chi tiết ── */}
                        <div className="vm-field-group">
                            <label className="vm-field-label">Tên chi tiết <span className="vm-field-required">*</span></label>
                            <input
                                className="vm-field-input"
                                type="text"
                                value={fileName}
                                onChange={e => setFileName(e.target.value)}
                                placeholder="VD: Thân trước, Tay áo, Cổ áo..."
                                maxLength={100}
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && !saving && fileName.trim() && saveWithQuantity()}
                            />
                        </div>

                        {/* ── Số lượng ── */}
                        <div className="vm-field-group">
                            <label className="vm-field-label">Số lượng</label>
                            <div className="vm-qty-control">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                                <input
                                    type="number" min="1" max="9999" value={quantity}
                                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                />
                                <button onClick={() => setQuantity(q => Math.min(9999, q + 1))}>+</button>
                            </div>
                        </div>

                        <div className="vm-modal-preview">
                            <div><span>Tổng</span><strong>{((tempArea || 0) * quantity).toFixed(2)} cm²</strong></div>
                            <div><span>Quy đổi</span><strong>{(((tempArea || 0) * quantity) / 10000).toFixed(4)} m²</strong></div>
                        </div>

                        <div className="vm-modal-actions">
                            <button className="vm-btn ghost" onClick={() => setShowQuantityModal(false)} disabled={saving}>Hủy</button>
                            <button
                                className="vm-btn primary"
                                onClick={saveWithQuantity}
                                disabled={saving || !fileName.trim()}
                            >
                                {saving ? 'Đang lưu...' : '💾 Lưu kết quả'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

ViewMain.propTypes = {
    user: PropTypes.shape({ name: PropTypes.string }),
    onLogout: PropTypes.func.isRequired
};

export default ViewMain;