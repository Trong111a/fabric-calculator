import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Folder, Plus, Trash2, ArrowLeft, FolderOpen, Package, Layers, TrendingUp, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import ProjectDetail from '../ProjectDetail/ProjectDetail';
import './ProjectManager.css';
import backgroundImg from '../../assets/images/background.png';

function ProjectManager({ onBack }) {
    const { t } = useTranslation();
    const [projects, setProjects] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [openedProject, setOpenedProject] = useState(null);

    useEffect(() => { loadProjects(); }, []);

    const loadProjects = async () => {
        try { const data = await api.getProjects(); setProjects(data); }
        catch (err) { console.error(err); }
    };

    const createProject = async () => {
        if (!newProjectName.trim()) return;
        setLoading(true);
        try {
            await api.createProject({ name: newProjectName, description: '' });
            setNewProjectName(''); setShowCreate(false); loadProjects();
        } catch { alert(t('create_project') + ' failed'); } finally { setLoading(false); }
    };

    const deleteProject = async (id) => {
        if (!confirm(t('confirm_delete_project'))) return;
        setDeletingId(id);
        try { await api.deleteProject(id); loadProjects(); }
        catch { alert(t('delete_failed')); } finally { setDeletingId(null); }
    };

    if (openedProject) {
        return <ProjectDetail project={openedProject} onBack={() => { setOpenedProject(null); loadProjects(); }} />;
    }

    const totalArea = projects.reduce((sum, p) => sum + (Number(p.total_area_cm2) || 0), 0);
    const totalFiles = projects.reduce((sum, p) => sum + (Number(p.file_count) || 0), 0);
    const totalQty = projects.reduce((sum, p) => sum + (Number(p.total_quantity) || 0), 0);

    const stats = [
        { icon: <Layers size={16} />, label: t('total_projects'), value: projects.length },
        { icon: <Package size={16} />, label: t('total_details'), value: totalQty },
        { icon: <TrendingUp size={16} />, label: t('total_area'), value: `${(totalArea / 10000).toFixed(3)} m²` },
    ];

    return (
        <div className="pm-wrap" style={{
            backgroundImage: `url(${backgroundImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}>
            <div className="pm-bg-mesh" />
            <header className="pm-header">
                <button className="pm-back-btn" onClick={onBack}><ArrowLeft size={18} /><span>{t('back')}</span></button>
                <div className="pm-header-center">
                    <div className="pm-header-icon"><FolderOpen size={22} color="#fff" /></div>
                    <div>
                        <h1 className="pm-header-title">{t('manage_projects')}</h1>
                        <p className="pm-header-sub">{projects.length} {t('projects')} · {totalFiles} {t('files')}</p>
                    </div>
                </div>
                <button className="pm-create-btn" onClick={() => setShowCreate(true)}>
                    <Plus size={18} /><span>{t('create_project')}</span>
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
                            <h3 className="pm-create-form-title">{t('create_project')}</h3>
                            <button className="pm-close-btn" onClick={() => setShowCreate(false)}><X size={18} /></button>
                        </div>
                        <div className="pm-input-row">
                            <div className="pm-input-wrap">
                                <Folder size={16} className="pm-input-icon" />
                                <input className="pm-input" type="text"
                                    placeholder={t('project_name_placeholder')}
                                    value={newProjectName}
                                    onChange={e => setNewProjectName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && createProject()}
                                    autoFocus />
                            </div>
                            <button className="pm-confirm-btn" onClick={createProject} disabled={loading || !newProjectName.trim()}>
                                {loading ? '...' : <Check size={18} />}
                                <span>{loading ? t('creating_project') : t('create_project')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="pm-main">
                {projects.length === 0 ? (
                    <div className="pm-empty">
                        <div className="pm-empty-icon"><Folder size={56} color="#c4b5fd" /></div>
                        <h3 className="pm-empty-title">{t('empty_projects')}</h3>
                        <p className="pm-empty-text">{t('empty_projects_sub')}</p>
                        <button className="pm-empty-action" onClick={() => setShowCreate(true)}>
                            <Plus size={16} /> {t('create_first_project')}
                        </button>
                    </div>
                ) : (
                    <div className="pm-grid">
                        {projects.map((project, idx) => {
                            const hue = (idx * 47) % 360;
                            return (
                                <div key={project.id}
                                    className={`pm-card${deletingId === project.id ? ' is-deleting' : ''}`}
                                    onClick={() => { if (deletingId === project.id) return; setOpenedProject(project); }}
                                >
                                    <div className="pm-card-strip" style={{ background: `hsl(${hue}, 70%, 55%)` }} />
                                    <div className="pm-card-icon-wrap" style={{ background: `hsl(${hue}, 70%, 96%)`, color: `hsl(${hue}, 60%, 45%)` }}>
                                        <Folder size={32} />
                                    </div>
                                    <h3 className="pm-card-title">{project.name}</h3>
                                    <div className="pm-card-meta">
                                        <div className="pm-meta-row"><span className="pm-meta-dot" /><span className="pm-meta-text">{project.file_count || 0} {t('files')}</span></div>
                                        <div className="pm-meta-row"><span className="pm-meta-dot" /><span className="pm-meta-text">{project.total_quantity || 0} {t('total_items')}</span></div>
                                    </div>
                                    <div className="pm-card-area">
                                        <span className="pm-area-value">{((Number(project.total_area_cm2) || 0) / 10000).toFixed(4)}</span>
                                        <span className="pm-area-unit">m²</span>
                                    </div>
                                    <button className="pm-delete-btn"
                                        onClick={e => { e.stopPropagation(); deleteProject(project.id); }}
                                        title={t('delete_project')}>
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

ProjectManager.propTypes = { onBack: PropTypes.func.isRequired };
export default ProjectManager;