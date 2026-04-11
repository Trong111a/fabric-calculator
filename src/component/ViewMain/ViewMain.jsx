import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Camera, Upload, RotateCcw, Ruler, CheckCircle,
    Folder, LogOut, X, Save, Pipette
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import ProjectManager from '../ProjectManager/ProjectManager';
import './ViewMain.css';
import backgroundImg from '../../assets/images/background.png';

function calcArea(pts, ppc) {
    if (!pts.length || !ppc) return 0;
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

export default function ViewMain({ user, onLogout }) {
    const { t, i18n } = useTranslation();
    const [image, setImage] = useState(null);
    const [rawImageData, setRawImageData] = useState(null);
    const [step, setStep] = useState('upload');
    const [loading, setLoading] = useState(false);
    const [cvReady, setCvReady] = useState(false);

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

    const [selectedProject, setSelectedProject] = useState(null);
    const [showProjectManager, setShowProjectManager] = useState(false);

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
    const bg = useRef(new Image());

    useEffect(() => {
        const load = () => {
            if (window.cv && window.cv.Mat) setCvReady(true);
            else setTimeout(load, 100);
        };
        if (!document.getElementById('opencv-script')) {
            const s = document.createElement('script');
            s.id = 'opencv-script';
            s.src = 'https://docs.opencv.org/4.5.2/opencv.js';
            s.async = true; s.onload = load;
            document.body.appendChild(s);
        } else load();
    }, []);

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
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        const W = image.width;
        const displayScale = canvas.width / (canvas.getBoundingClientRect().width || canvas.width);

        if (step === 'pick') {
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(0, 0, W, image.height);
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
            }
            const hr = Math.max(8, Math.min(16, 12 * displayScale));
            ctx.fillStyle = '#6366f1';
            ctx.shadowColor = 'rgba(99,102,241,0.55)'; ctx.shadowBlur = 16;
            ctx.beginPath(); ctx.arc(0, 0, hr, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2.5, W / 380); ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = `bold ${hr * 0.85}px Arial`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('≡', 0, 0); ctx.textBaseline = 'alphabetic';
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

            const R = Math.max(8, Math.min(18, 14 * displayScale));
            const RH = R * 1.6;
            polygonPoints.forEach((p, i) => {
                const isHover = i === hoverPointIdx; const isDrag = i === dragPointIdx;
                if (isHover || isDrag) {
                    const g = ctx.createRadialGradient(p.x, p.y, R * 0.5, p.x, p.y, RH);
                    g.addColorStop(0, isDrag ? 'rgba(245,158,11,0.38)' : 'rgba(99,102,241,0.30)');
                    g.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.beginPath(); ctx.arc(p.x, p.y, RH, 0, Math.PI * 2);
                    ctx.fillStyle = g; ctx.fill();
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
                ctx.font = `bold ${fs}px Arial`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                const txt = `${(area / 10000).toFixed(4)} m²`;
                const tw = ctx.measureText(txt).width; const pad = fs * 0.55;
                ctx.fillStyle = 'rgba(79,70,229,0.88)';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(cx - tw / 2 - pad, cy - fs / 2 - pad * 0.6, tw + pad * 2, fs + pad * 1.2, 10);
                else ctx.rect(cx - tw / 2 - pad, cy - fs / 2 - pad * 0.6, tw + pad * 2, fs + pad * 1.2);
                ctx.fill();
                ctx.fillStyle = '#fff'; ctx.fillText(txt, cx, cy);
                ctx.textBaseline = 'alphabetic';
            }
        }
    }, [image, step, rulerPos, rulerLength, rulerAngle, polygonPoints, hoverPointIdx, dragPointIdx, area, t]);

    useEffect(() => { drawCanvas(); }, [drawCanvas]);

    const toCanvas = (clientX, clientY) => {
        const c = canvasRef.current; const r = c.getBoundingClientRect();
        return {
            x: (clientX - r.left) * (c.width / r.width),
            y: (clientY - r.top) * (c.height / r.height),
        };
    };

    const hitTestPoint = useCallback((cx, cy) => {
        const canvas = canvasRef.current;
        const displayScale = canvas ? canvas.width / (canvas.getBoundingClientRect().width || canvas.width) : 1;
        const R = Math.max(8, Math.min(18, 14 * displayScale)) + 10;
        for (let i = polygonPoints.length - 1; i >= 0; i--) {
            const p = polygonPoints[i];
            const dx = cx - p.x, dy = cy - p.y;
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
        const r = rawImageData.data[idx];
        const g = rawImageData.data[idx + 1];
        const b = rawImageData.data[idx + 2];
        setPickedColor(rgbToHsv(r, g, b));
        setPickedRgb({ r, g, b });
        setStep('scan');
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
                setIsDraggingRuler(true);
                setRulerDragOffset({ x: dx, y: dy });
            }
        } else if (step === 'adjust') {
            const idx = hitTestPoint(x, y);
            if (idx >= 0) setDragPointIdx(idx);
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
                setPolygonPoints(newPts);
                setArea(calcArea(newPts, pixelsPerCm));
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
                setDragPointIdx(-1); setHoverPointIdx(-1);
                setPickedColor(null); setPickedRgb(null);
                setRulerPos({ x: img.width * 0.74, y: img.height * 0.12 });
                setRulerLength(img.height * 0.65);
                setRulerAngle(0);
                setZoom(1); setPanOffset({ x: 0, y: 0 });
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file); e.target.value = '';
    };

    const scanAndCalc = async () => {
        if (!rawImageData || !cvReady || !pixelsPerCm) {
            alert(t('calibrate_warning')); return;
        }
        setLoading(true);
        try {
            const cv = window.cv;
            const src = cv.matFromImageData(rawImageData);
            const hsv = new cv.Mat();
            cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
            cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

            let loArr, hiArr;
            if (pickedColor) {
                const { h, s, v } = pickedColor;
                const hR = 18, sR = 70, vR = 70;
                loArr = [Math.max(0, h - hR), Math.max(0, s - sR), Math.max(0, v - vR), 0];
                hiArr = [Math.min(180, h + hR), Math.min(255, s + sR), Math.min(255, v + vR), 255];
            } else {
                loArr = [0, 0, 60, 0];
                hiArr = [180, 60, 255, 255];
            }
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
                const gray = new cv.Mat();
                cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
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
                quantity, project_id: selectedProject?.id,
            });
            setShowSaveModal(false); setStep('result');
        } catch (e) { alert(t('save_error', { msg: e.message })); } finally { setSaving(false); }
    };

    const reset = () => {
        setImage(null); setRawImageData(null); setStep('upload');
        setPolygonPoints([]); setArea(null); setPixelsPerCm(null);
        setDragPointIdx(-1); setHoverPointIdx(-1);
        setPickedColor(null); setPickedRgb(null);
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

    if (showProjectManager) {
        return (
            <ProjectManager
                onSelectProject={p => { setSelectedProject(p); setShowProjectManager(false); }}
                onBack={() => setShowProjectManager(false)}
            />
        );
    }

    const toggleLanguage = () => {
        const newLang = i18n.language === 'vi' ? 'en' : 'vi';
        i18n.changeLanguage(newLang);
    };

    return (
        <div className="vm-wrap">
            <header className="vm-header">
                <div className="vm-header-left">
                    <div className="vm-logo"><Ruler size={20} color="#fff" /></div>
                    <div>
                        <h1 className="vm-title">{t('app_title')}</h1>
                        <span className={`vm-cv-badge ${cvReady ? 'ready' : ''}`}>
                            {cvReady ? t('cv_ready') : t('cv_loading')}
                        </span>
                    </div>
                </div>
                <div className="vm-header-right">
                    {selectedProject && (
                        <div className="vm-project-chip"><Folder size={13} /><span>{selectedProject.name}</span></div>
                    )}
                    <button className="vm-folder-btn" onClick={() => setShowProjectManager(true)}>
                        <Folder size={15} /><span>{selectedProject ? t('change_folder') : t('folder')}</span>
                    </button>
                    <div className="vm-user-chip">
                        <div className="vm-avatar">{(user?.name || 'U')[0].toUpperCase()}</div>
                        <span>{user?.name || 'User'}</span>
                    </div>
                    <button className="lang-btn" onClick={toggleLanguage}>
                        {i18n.language === 'vi' ? 'EN' : 'VI'}
                    </button>

                    <button className="vm-logout-btn" onClick={onLogout} title={t('logout')}>
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {step !== 'upload' && (
                <div className="vm-steps">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s.key}>
                            <div className={`vm-step ${i < stepIdx ? 'done' : ''} ${i === stepIdx ? 'active' : ''}`}>
                                <div className="vm-step-dot">{i < stepIdx ? '✓' : i + 1}</div>
                                <span className="vm-step-label">{s.label}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`vm-step-line ${i < stepIdx ? 'done' : ''}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}

            <main
                className={`vm-main${step === 'upload' ? ' has-bg' : ''}`}
                style={step === 'upload' ? {
                    backgroundImage: `url(${backgroundImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                } : {}}
            >
                {step === 'upload' && (
                    <div className="vm-upload-screen">
                        <div className="vm-upload-hero" style={{ position: 'relative', zIndex: 1 }}>
                            <div className="vm-upload-icon"><Ruler size={48} color="#6366f1" /></div>
                            <h2>{t('measure_title')}</h2>
                            <p>{t('measure_sub')}</p>
                        </div>
                        <input ref={uploadRef} type="file" accept="image/*" onChange={handleImageUpload} className="vm-hidden" />
                        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="vm-hidden" />
                        <div className="vm-upload-btns" style={{ position: 'relative', zIndex: 1 }}>
                            <button className="vm-upload-btn primary" disabled={!cvReady} onClick={() => uploadRef.current?.click()}>
                                <Upload size={22} /><span>{t('upload_image')}</span><small>{t('upload_formats')}</small>
                            </button>
                            <button className="vm-upload-btn" disabled={!cvReady} onClick={() => cameraRef.current?.click()}>
                                <Camera size={22} /><span>{t('take_photo')}</span><small>{t('use_camera')}</small>
                            </button>
                        </div>
                    </div>
                )}

                {image && step !== 'upload' && (
                    <div className="vm-section">
                        <div className="vm-guide">
                            <span className="vm-guide-icon">
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
                                        <>
                                            <span translate="no">{t('ratio')}: {pixelsPerCm?.toFixed(2)} px/cm</span>
                                            {pickedRgb && (
                                                <span style={{ marginLeft: 10, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                    · {t('pattern_color')}
                                                    <span style={{
                                                        display: 'inline-block', width: 14, height: 14, borderRadius: 3,
                                                        background: `rgb(${pickedRgb.r},${pickedRgb.g},${pickedRgb.b})`,
                                                        border: '1px solid #ccc', verticalAlign: 'middle'
                                                    }} />
                                                </span>
                                            )}
                                        </>
                                    )}
                                    {step === 'adjust' && t('guide_adjust_sub')}
                                    {step === 'result' && <span translate="no">{area?.toFixed(2)} cm² · {(area / 10000)?.toFixed(4)} m²</span>}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{t('zoom_label')}</span>
                            <button className="vm-btn ghost" style={{ padding: '5px 12px', fontSize: 13 }}
                                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>−</button>
                            <span style={{
                                minWidth: 50, textAlign: 'center', fontSize: 13, fontWeight: 600,
                                background: '#ede9fe', color: '#4f46e5', borderRadius: 6, padding: '3px 8px'
                            }} translate="no">{Math.round(zoom * 100)}%</span>
                            <button className="vm-btn ghost" style={{ padding: '5px 12px', fontSize: 13 }}
                                onClick={() => setZoom(z => Math.min(5, z + 0.25))}>+</button>
                            <button className="vm-btn ghost" style={{ padding: '5px 12px', fontSize: 13 }}
                                onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}>{t('zoom_reset')}</button>
                            <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>{t('zoom_hint')}</span>
                        </div>

                        <div ref={containerRef} className="vm-canvas-wrap" style={{ overflow: 'hidden', cursor: getCursor() }}>
                            <div style={{
                                transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                                transformOrigin: 'center center',
                                transition: isDraggingRuler || dragPointIdx >= 0 ? 'none' : 'transform 0.1s ease',
                                width: '100%',
                            }}>
                                <canvas
                                    ref={canvasRef}
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
                                <div className="vm-overlay"><div className="vm-spinner" /><span>{t('loading')}</span></div>
                            )}
                            {step === 'adjust' && area !== null && (
                                <div className="vm-area-badge" translate="no">{(area / 10000).toFixed(4)} m²</div>
                            )}
                        </div>

                        {step === 'calibrate' && (
                            <div className="vm-controls">
                                <div className="vm-control-group">
                                    <label>{t('ruler_length')}</label>
                                    <div className="vm-slider-row">
                                        <input type="range" min="100" max={image.height}
                                            value={rulerLength} onChange={e => setRulerLength(Number(e.target.value))} />
                                        <div className="vm-badges">
                                            <span className="vm-badge" translate="no">{Math.round(rulerLength)} px = 30cm</span>
                                            <span className="vm-badge accent" translate="no">{(rulerLength / 30).toFixed(2)} px/cm</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="vm-control-group">
                                    <label>{t('direct_px_cm')}</label>
                                    <input
                                        type="number" min="1" step="0.1"
                                        value={(rulerLength / 30).toFixed(2)}
                                        onChange={e => setRulerLength(parseFloat(e.target.value) * 30 || rulerLength)}
                                        className="vm-angle-input" style={{ maxWidth: 160 }}
                                    />
                                </div>
                                <div className="vm-control-group">
                                    <label>{t('rotation_angle')}</label>
                                    <div className="vm-angle-row">
                                        <button onClick={() => setRulerAngle(a => (a - 10 + 360) % 360)}>↺ −10°</button>
                                        <button onClick={() => setRulerAngle(a => (a - 1 + 360) % 360)}>−1°</button>
                                        <input type="number" min="0" max="359" value={rulerAngle}
                                            onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setRulerAngle(((v % 360) + 360) % 360); }}
                                            className="vm-angle-input" />
                                        <span className="vm-angle-deg">°</span>
                                        <button onClick={() => setRulerAngle(a => (a + 1) % 360)}>+1°</button>
                                        <button onClick={() => setRulerAngle(a => (a + 10) % 360)}>↻ +10°</button>
                                        <button onClick={() => setRulerAngle(90)}>90°</button>
                                        <button onClick={() => setRulerAngle(0)}>0°</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'adjust' && (
                            <div className="vm-result-grid">
                                <div className="vm-result-card accent">
                                    <span>{t('area_label')}</span>
                                    <strong translate="no">{(area / 10000)?.toFixed(4)}<em>m²</em></strong>
                                </div>
                                <div className="vm-result-card">
                                    <span>{t('ratio')}</span>
                                    <strong translate="no">{pixelsPerCm?.toFixed(2)}<em>px/cm</em></strong>
                                </div>
                            </div>
                        )}

                        {step === 'result' && area !== null && (
                            <div className="vm-result-grid">
                                <div className="vm-result-card accent">
                                    <span>{t('area_one_detail')}</span>
                                    <strong translate="no">{area.toFixed(2)}<em>cm²</em></strong>
                                </div>
                                <div className="vm-result-card">
                                    <span>{t('convert_m2')}</span>
                                    <strong translate="no">{(area / 10000).toFixed(4)}<em>m²</em></strong>
                                </div>
                                <div className="vm-result-card">
                                    <span>{t('ratio')}</span>
                                    <strong translate="no">{pixelsPerCm?.toFixed(2)}<em>px/cm</em></strong>
                                </div>
                                <div className="vm-result-card">
                                    <span>{t('vertices_label')}</span>
                                    <strong translate="no">{polygonPoints.length}</strong>
                                </div>
                                {quantity > 1 && (
                                    <div className="vm-result-card accent">
                                        <span>{t('total_qty_detail', { qty: quantity })}</span>
                                        <strong translate="no">{(area * quantity / 10000).toFixed(4)}<em>m²</em></strong>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="vm-actions">
                            <button className="vm-btn ghost" onClick={reset}><RotateCcw size={15} /> {t('redo')}</button>
                            {step === 'calibrate' && (
                                <button className="vm-btn primary" onClick={() => { setPixelsPerCm(rulerLength / 30); setStep('pick'); }} translate="no">
                                    <CheckCircle size={15} /> {t('confirm_calibrate', { value: (rulerLength / 30).toFixed(2) })}
                                </button>
                            )}
                            {step === 'pick' && (
                                <button className="vm-btn ghost" onClick={() => setStep('calibrate')}>
                                    {t('recalibrate')}
                                </button>
                            )}
                            {step === 'scan' && (
                                <>
                                    <button className="vm-btn ghost" onClick={() => setStep('pick')}>
                                        <Pipette size={14} /> {t('repick_color')}
                                    </button>
                                    <button className="vm-btn primary" disabled={loading} onClick={scanAndCalc}>
                                        <Ruler size={15} /> {t('scan_calculate')}
                                    </button>
                                </>
                            )}
                            {step === 'adjust' && (
                                <>
                                    <button className="vm-btn ghost" onClick={() => { setStep('scan'); setPolygonPoints([]); setArea(null); }}>
                                        {t('rescan')}
                                    </button>
                                    <button className="vm-btn success" onClick={openSaveModal} translate="no">
                                        <CheckCircle size={15} /> {t('confirm_area', { value: (area / 10000)?.toFixed(4) })}
                                    </button>
                                </>
                            )}
                            {step === 'result' && (
                                <button className="vm-btn primary" onClick={reset}>
                                    <Upload size={15} /> {t('measure_another_vm')}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {showSaveModal && (
                <div className="vm-modal-bg" onClick={e => e.target === e.currentTarget && setShowSaveModal(false)}>
                    <div className="vm-modal">
                        <button className="vm-modal-close" onClick={() => setShowSaveModal(false)}><X size={18} /></button>
                        <h3>{t('save_detail_title')}</h3>
                        <p className="vm-modal-sub"
                            dangerouslySetInnerHTML={{
                                __html: t('save_area_info', {
                                    area: (area / 10000)?.toFixed(4),
                                    folder: selectedProject ? selectedProject.name : '—'
                                })
                            }}
                        />
                        <div className="vm-field-group">
                            <label className="vm-field-label">{t('detail_name_label')} <span className="vm-field-required">*</span></label>
                            <input
                                className="vm-field-input" type="text" value={fileName}
                                onChange={e => setFileName(e.target.value)}
                                placeholder={t('detail_name_eg')}
                                maxLength={100} autoFocus
                                onKeyDown={e => e.key === 'Enter' && !saving && fileName.trim() && saveResult()}
                            />
                        </div>
                        <div className="vm-field-group">
                            <label className="vm-field-label">{t('quantity')}</label>
                            <div className="vm-qty-control">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                                <input type="number" min="1" max="9999" value={quantity}
                                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
                                <button onClick={() => setQuantity(q => Math.min(9999, q + 1))}>+</button>
                            </div>
                        </div>
                        <div className="vm-modal-preview">
                            <div><span>{t('area_one_preview')}</span><strong translate="no">{(area / 10000)?.toFixed(4)} m²</strong></div>
                            <div><span>{t('total_preview', { qty: quantity })}</span><strong translate="no">{(((area || 0) * quantity) / 10000).toFixed(4)} m²</strong></div>
                        </div>
                        <div className="vm-modal-actions">
                            <button className="vm-btn ghost" onClick={() => setShowSaveModal(false)} disabled={saving}>{t('cancel')}</button>
                            <button className="vm-btn primary" onClick={saveResult} disabled={saving || !fileName.trim()}>
                                <Save size={15} />{saving ? t('saving') : t('save_result')}
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
    onLogout: PropTypes.func.isRequired,
};