import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Folder, Plus, Trash2, ArrowLeft, FolderOpen, Package, Layers, TrendingUp, X, Check } from 'lucide-react';
import { api } from '../../services/api';
import ProjectDetail from '../ProjectDetail/ProjectDetail';
import './ProjectManager.css';

function ProjectManager({ onBack }) {
    const [projects, setProjects] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [openedProject, setOpenedProject] = useState(null); 

    useEffect(() => { loadProjects(); }, []);

    const loadProjects = async () => {
        try {
            const data = await api.getProjects();
            setProjects(data);
        } catch (err) {
            console.error('Lỗi tải projects:', err);
        }
    };

    const createProject = async () => {
        if (!newProjectName.trim()) return;
        setLoading(true);
        try {
            await api.createProject({ name: newProjectName, description: '' });
            setNewProjectName('');
            setShowCreate(false);
            loadProjects();
        } catch {
            alert('Tạo project thất bại');
        } finally {
            setLoading(false);
        }
    };

    const deleteProject = async (id) => {
        if (!confirm('Xóa project này?')) return;
        setDeletingId(id);
        try {
            await api.deleteProject(id);
            loadProjects();
        } catch {
            alert('Xóa thất bại');
        } finally {
            setDeletingId(null);
        }
    };

    if (openedProject) {
        return (
            <ProjectDetail
                project={openedProject}
                onBack={() => { setOpenedProject(null); loadProjects(); }}
            />
        );
    }

    const totalArea = projects.reduce((sum, p) => sum + (p.total_area_cm2 || 0), 0);
    const totalFiles = projects.reduce((sum, p) => sum + (p.file_count || 0), 0);
    const totalQty = projects.reduce((sum, p) => sum + (p.total_quantity || 0), 0);

    const stats = [
        { icon: <Layers size={16} />, label: 'Tổng project', value: projects.length },
        { icon: <Package size={16} />, label: 'Tổng chi tiết', value: totalQty },
        { icon: <TrendingUp size={16} />, label: 'Tổng diện tích', value: `${(totalArea / 10000).toFixed(3)} m²` },
    ];

    return (
        <div className="pm-wrap">
            <div className="pm-bg-mesh" />

            <header className="pm-header">
                <button className="pm-back-btn" onClick={onBack}>
                    <ArrowLeft size={18} />
                    <span>Quay lại</span>
                </button>

                <div className="pm-header-center">
                    <div className="pm-header-icon">
                        <FolderOpen size={22} color="#fff" />
                    </div>
                    <div>
                        <h1 className="pm-header-title">Quản lý Project</h1>
                        <p className="pm-header-sub">{projects.length} project · {totalFiles} files</p>
                    </div>
                </div>

                <button className="pm-create-btn" onClick={() => setShowCreate(true)}>
                    <Plus size={18} />
                    <span>Tạo project</span>
                </button>
            </header>

            <div className="pm-stats-bar">
                {stats.map((stat, i) => (
                    <div key={i} className="pm-stat-item">
                        <div className="pm-stat-icon">{stat.icon}</div>
                        <div>
                            <div className="pm-stat-value">{stat.value}</div>
                            <div className="pm-stat-label">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {showCreate && (
                <div className="pm-create-form-wrap">
                    <div className="pm-create-form">
                        <div className="pm-create-form-header">
                            <h3 className="pm-create-form-title">Tạo project mới</h3>
                            <button className="pm-close-btn" onClick={() => setShowCreate(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="pm-input-row">
                            <div className="pm-input-wrap">
                                <Folder size={16} className="pm-input-icon" />
                                <input
                                    className="pm-input"
                                    type="text"
                                    placeholder="Nhập tên project..."
                                    value={newProjectName}
                                    onChange={e => setNewProjectName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && createProject()}
                                    autoFocus
                                />
                            </div>
                            <button
                                className="pm-confirm-btn"
                                onClick={createProject}
                                disabled={loading || !newProjectName.trim()}
                            >
                                {loading ? '...' : <Check size={18} />}
                                <span>{loading ? 'Đang tạo' : 'Tạo'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="pm-main">
                {projects.length === 0 ? (
                    <div className="pm-empty">
                        <div className="pm-empty-icon">
                            <Folder size={56} color="#c4b5fd" />
                        </div>
                        <h3 className="pm-empty-title">Chưa có project nào</h3>
                        <p className="pm-empty-text">Tạo project để tổ chức các bản rập của bạn</p>
                        <button className="pm-empty-action" onClick={() => setShowCreate(true)}>
                            <Plus size={16} />
                            Tạo project đầu tiên
                        </button>
                    </div>
                ) : (
                    <div className="pm-grid">
                        {projects.map((project, idx) => {
                            const hue = (idx * 47) % 360;
                            return (
                                <div
                                    key={project.id}
                                    className={`pm-card${deletingId === project.id ? ' is-deleting' : ''}`}
                                    onClick={() => {
                                        if (deletingId === project.id) return;
                                        setOpenedProject(project); 
                                    }}
                                >
                                    <div
                                        className="pm-card-strip"
                                        style={{ background: `hsl(${hue}, 70%, 55%)` }}
                                    />
                                    <div
                                        className="pm-card-icon-wrap"
                                        style={{
                                            background: `hsl(${hue}, 70%, 96%)`,
                                            color: `hsl(${hue}, 60%, 45%)`,
                                        }}
                                    >
                                        <Folder size={32} />
                                    </div>

                                    <h3 className="pm-card-title">{project.name}</h3>

                                    <div className="pm-card-meta">
                                        <div className="pm-meta-row">
                                            <span className="pm-meta-dot" />
                                            <span className="pm-meta-text">{project.file_count || 0} files</span>
                                        </div>
                                        <div className="pm-meta-row">
                                            <span className="pm-meta-dot" />
                                            <span className="pm-meta-text">{project.total_quantity || 0} chi tiết</span>
                                        </div>
                                    </div>

                                    <div className="pm-card-area">
                                        <span className="pm-area-value">
                                            {((project.total_area_cm2 || 0) / 10000).toFixed(4)}
                                        </span>
                                        <span className="pm-area-unit">m²</span>
                                    </div>

                                    <button
                                        className="pm-delete-btn"
                                        onClick={e => { e.stopPropagation(); deleteProject(project.id); }}
                                        title="Xóa project"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

ProjectManager.propTypes = {
    onBack: PropTypes.func.isRequired,
};

export default ProjectManager;