import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Folder, Plus, Trash2, ArrowLeft, FolderOpen, Package, Layers, TrendingUp, X, Check, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
// import ProjectDetail from '../ProjectDetail/ProjectDetail';
import './FolderManager.css';
import backgroundImg from '../../assets/images/background.png';

function ProjectManager({ onBack, onOpenFolder }) {
    const { t } = useTranslation();
    const [folders, setFolders] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    // const [openedProject, setOpenedProject] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => { loadFolders(); }, []);

    const loadFolders = async () => {
        try { const data = await api.getFolders(); setFolders(data); }
        catch (err) { console.error(err); }
    };

    const createFolder = async () => {
        if (!newFolderName.trim()) return;
        setLoading(true);
        try {
            await api.createFolder({ name: newFolderName, description: '' });
            setNewFolderName(''); setShowCreate(false); loadFolders();
        } catch { alert(t('create_folder_failed')); } finally { setLoading(false); }
    };

    const deleteFolder = async (id) => {
        if (!confirm(t('confirm_delete_folder'))) return;
        setDeletingId(id);
        try { await api.deleteFolder(id); loadFolders(); }
        catch { alert(t('delete_failed')); } finally { setDeletingId(null); }
    };

    // if (openedProject) {
    //     return <ProjectDetail folder={openedProject} onBack={() => { setOpenedProject(null); loadProjects(); }} />;
    // }

    const totalArea = folders.reduce((sum, p) => sum + (Number(p.total_area_cm2) || 0), 0);
    const totalFiles = folders.reduce((sum, p) => sum + (Number(p.file_count) || 0), 0);
    const totalQty = folders.reduce((sum, p) => sum + (Number(p.total_quantity) || 0), 0);

    const stats = [
        { icon: <Layers size={16} />, label: t('total_folders'), value: folders.length },
        { icon: <Package size={16} />, label: t('total_details'), value: totalQty },
        { icon: <TrendingUp size={16} />, label: t('total_area'), value: `${(totalArea / 10000).toFixed(3)} m²` },
    ];

    const startRename = (e, folder) => {
        e.stopPropagation();
        setEditingId(folder.id);
        setEditingName(folder.name);
    };

    const confirmRename = async (e, id) => {
        e.stopPropagation();
        if (!editingName.trim()) return;
        try {
            await api.updateFolder(id, { name: editingName.trim() });
            setEditingId(null);
            loadFolders();
        } catch (err) {
            console.error('Rename error:', err);
            alert(t('update_error', { msg: err.message }));
        }
    };

    const cancelRename = (e) => {
        e.stopPropagation();
        setEditingId(null);
    };

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
                        <h1 className="pm-header-title">{t('manage_folders')}</h1>
                        <p className="pm-header-sub">{folders.length} {t('folders')} · {totalFiles} {t('files')}</p>
                    </div>
                </div>
                <button className="pm-create-btn" onClick={() => setShowCreate(true)}>
                    <Plus size={18} /><span>{t('create_folder')}</span>
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
                            <h3 className="pm-create-form-title">{t('create_folder')}</h3>
                            <button className="pm-close-btn" onClick={() => setShowCreate(false)}><X size={18} /></button>
                        </div>
                        <div className="pm-input-row">
                            <div className="pm-input-wrap">
                                <Folder size={16} className="pm-input-icon" />
                                <input className="pm-input" type="text"
                                    placeholder={t('folder_name_placeholder')}
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && createFolder()}
                                    autoFocus />
                            </div>
                            <button className="pm-confirm-btn" onClick={createFolder} disabled={loading || !newFolderName.trim()}>
                                {loading ? '...' : <Check size={18} />}
                                <span>{loading ? t('creating_folder') : t('create_folder')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="pm-main">
                {folders.length === 0 ? (
                    <div className="pm-empty">
                        <div className="pm-empty-icon"><Folder size={56} color="white" /></div>
                        <h3 className="pm-empty-title">{t('empty_folders')}</h3>
                        <p className="pm-empty-text">{t('empty_folders_sub')}</p>
                        <button className="pm-empty-action" onClick={() => setShowCreate(true)}>
                            <Plus size={16} /> {t('create_first_folder')}
                        </button>
                    </div>
                ) : (
                    <div className="pm-grid">
                        {folders.map((folder, idx) => {
                            const hue = (idx * 47) % 360;
                            return (
                                <div key={folder.id}
                                    className={`pm-card${deletingId === folder.id ? ' is-deleting' : ''}`}
                                    onClick={() => { if (deletingId === folder.id) return; onOpenFolder(folder); }}
                                >
                                    <div className="pm-card-strip" style={{ background: `hsl(${hue}, 70%, 55%)` }} />
                                    <div className="pm-card-icon-wrap" style={{ background: `hsl(${hue}, 70%, 96%)`, color: `hsl(${hue}, 60%, 45%)` }}>
                                        <Folder size={32} />
                                    </div>
                                    {editingId === folder.id ? (
                                        <input
                                            className="pm-card-title-input"
                                            value={editingName}
                                            autoFocus
                                            onClick={e => e.stopPropagation()}
                                            onChange={e => setEditingName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') confirmRename(e, folder.id);
                                                if (e.key === 'Escape') cancelRename(e);
                                            }}
                                        />
                                    ) : (
                                        <h3 className="pm-card-title">{folder.name}</h3>
                                    )}
                                    <div className="pm-card-meta">
                                        <div className="pm-meta-row"><span className="pm-meta-dot" /><span className="pm-meta-text">{folder.file_count || 0} {t('files')}</span></div>
                                        <div className="pm-meta-row"><span className="pm-meta-dot" /><span className="pm-meta-text">{folder.total_quantity || 0} {t('total_items')}</span></div>
                                    </div>
                                    <div className="pm-card-area">
                                        <span className="pm-area-value">{((Number(folder.total_area_cm2) || 0) / 10000).toFixed(4)}</span>
                                        <span className="pm-area-unit">m²</span>
                                    </div>
                                    <div className="pm-card-actions">
                                        {editingId === folder.id ? (
                                            <>
                                                <button className="pm-action-btn pm-action-save" onClick={e => confirmRename(e, folder.id)} title={t('save')}>
                                                    <Check size={14} />
                                                </button>
                                                <button className="pm-action-btn pm-action-cancel" onClick={cancelRename} title={t('cancel')}>
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="pm-action-btn pm-action-edit"
                                                    onClick={e => startRename(e, folder)}
                                                    title={t('rename')}>
                                                    <Pencil size={14} />
                                                </button>
                                                <button className="pm-action-btn pm-action-delete"
                                                    onClick={e => { e.stopPropagation(); deleteFolder(folder.id); }}
                                                    title={t('delete_folder')}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
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
    onOpenFolder: PropTypes.func.isRequired,
};
export default ProjectManager;