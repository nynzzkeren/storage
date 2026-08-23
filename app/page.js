'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ZURA_THEMES, NYNZZ_GRADIENTS } from '../lib/themes';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminAbuse, setShowAdminAbuse] = useState(false);
  
  // Settings State
  const [themeInput, setThemeInput] = useState('');
  const [musicInput, setMusicInput] = useState('');
  
  // Admin Abuse State
  const [targetEmail, setTargetEmail] = useState('zuraya@pro.xyz');
  const [targetProfile, setTargetProfile] = useState(null);
  const [adminThemeInput, setAdminThemeInput] = useState('');
  const [adminNameInput, setAdminNameInput] = useState('');
  const [adminMusicInput, setAdminMusicInput] = useState('');
  const [adminProfilePicInput, setAdminProfilePicInput] = useState('');
  
  const [spyMode, setSpyMode] = useState(false);
  
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const pRes = await fetch('/api/profile');
      if (pRes.status === 401) return router.push('/login');
      
      const pData = await pRes.json();
      if (!pData.profile.isSetupComplete) return router.push('/setup');
      
      setProfile(pData.profile);
      setEmail(pData.email);
      setThemeInput(pData.profile.theme || '#0a0a0a');
      setMusicInput(pData.profile.musicLink || '');
      
      // Apply theme
      document.body.style.background = pData.profile.theme || '#0a0a0a';

      const fRes = await fetch('/api/files');
      const fData = await fRes.json();
      setFiles(fData.files || []);
      
      // Attempt auto-play if music exists
      if (pData.profile.musicLink && audioRef.current) {
        audioRef.current.play().catch(e => console.log('Autoplay blocked by browser. User must click first.'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 10000); // Poll every 10 seconds for theme updates
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }
    try {
      const res = await fetch('/api/files', { method: 'POST', body: formData });
      if (res.ok) {
        await fetchData();
        setActiveTab('active');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateFileStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/files/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeInput, musicLink: musicInput })
      });
      setShowSettings(false);
      fetchData();
    } catch(err) {}
  };

  const fetchAdminTarget = async () => {
    try {
      const res = await fetch(`/api/profile/${targetEmail}`);
      if (res.ok) {
        const data = await res.json();
        setTargetProfile(data.profile);
        setAdminThemeInput(data.profile.theme || '');
        setAdminNameInput(data.profile.storageName || '');
        setAdminMusicInput(data.profile.musicLink || '');
        setAdminProfilePicInput(data.profile.profilePic || '');
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (showAdminAbuse) fetchAdminTarget();
  }, [showAdminAbuse]);

  const saveAdminAbuse = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetEmail, 
          theme: adminThemeInput, 
          storageName: adminNameInput, 
          musicLink: adminMusicInput,
          profilePic: adminProfilePicInput
        })
      });
      setShowAdminAbuse(false);
    } catch(err) {}
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>Loading...</div>;
  const isAdmin = email === 'nynzz@pro.xyz';
  
  // Admin spy mode filters files
  const displayFiles = spyMode 
    ? files.filter(f => f.uploader === targetEmail)
    : files.filter(f => f.uploader === email);
    
  const filteredFiles = displayFiles.filter(f => f.status === activeTab).sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
  };

  // Stats
  const myFiles = files.filter(f => f.uploader === email && f.status !== 'permanent_deleted');
  const photos = myFiles.filter(f => f.type?.startsWith('image/')).length;
  const videos = myFiles.filter(f => f.type?.startsWith('video/')).length;
  const totalFiles = myFiles.length;

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {profile?.musicLink && <audio ref={audioRef} src={profile.musicLink} autoPlay loop style={{ display: 'none' }} />}
      
      <header className="header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {profile?.profilePic && (
          <img src={profile.profilePic} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
        )}
        <h1 style={{ flex: 1 }}>{profile?.storageName || 'Minimal Storage'}</h1>
        
        <button onClick={() => setShowSettings(true)} className="btn btn-outline">Settings</button>
        {isAdmin && (
          <>
            <button onClick={() => { setSpyMode(!spyMode); if(!spyMode) fetchAdminTarget(); }} className={spyMode ? "btn btn-danger" : "btn btn-outline"}>
              {spyMode ? 'Exit Spy Mode' : 'Spy Mode'}
            </button>
            <button onClick={() => setShowAdminAbuse(true)} className="btn btn-danger">Admin Abuse</button>
          </>
        )}
        <button onClick={handleLogout} className="btn btn-outline">Logout</button>
      </header>

      {showSettings && (
        <div className="modal" style={modalStyles}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '500px' }}>
            <h2>Storage Settings</h2>
            
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
              <div><strong>Photos:</strong> {photos}</div>
              <div><strong>Videos:</strong> {videos}</div>
              <div><strong>Total Files:</strong> {totalFiles}</div>
            </div>

            <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyles}>Theme</label>
                <select className="input-field" value={themeInput} onChange={e => setThemeInput(e.target.value)}>
                  {ZURA_THEMES.map(t => <option key={t.id} value={t.value}>{t.name}</option>)}
                  {isAdmin && NYNZZ_GRADIENTS.map(t => <option key={t.id} value={t.value}>{t.name}</option>)}
                </select>
              </div>
              
              <div>
                <label style={labelStyles}>Music Link (Auto-plays)</label>
                <input type="url" className="input-field" value={musicInput} onChange={e => setMusicInput(e.target.value)} placeholder="https://example.com/song.mp3" />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">Save Settings</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowSettings(false)}>Close</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdminAbuse && (
        <div className="modal" style={modalStyles}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '500px', border: '1px solid var(--danger)' }}>
            <h2 style={{ color: 'var(--danger)' }}>Admin Abuse Control</h2>
            <p style={{ marginBottom: '1rem' }}>Target: {targetEmail}</p>
            
            <form onSubmit={saveAdminAbuse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyles}>Override Storage Name</label>
                <input type="text" className="input-field" value={adminNameInput} onChange={e => setAdminNameInput(e.target.value)} />
              </div>
              
              <div>
                <label style={labelStyles}>Override Theme</label>
                <select className="input-field" value={adminThemeInput} onChange={e => setAdminThemeInput(e.target.value)}>
                  <option value="">-- No Override --</option>
                  {ZURA_THEMES.map(t => <option key={t.id} value={t.value}>{t.name}</option>)}
                  {NYNZZ_GRADIENTS.map(t => <option key={t.id} value={t.value}>{t.name}</option>)}
                </select>
              </div>
              
              <div>
                <label style={labelStyles}>Override Profile Picture (URL)</label>
                <input type="url" className="input-field" value={adminProfilePicInput} onChange={e => setAdminProfilePicInput(e.target.value)} placeholder="https://example.com/avatar.png" />
              </div>
              
              <div>
                <label style={labelStyles}>Override Music</label>
                <input type="url" className="input-field" value={adminMusicInput} onChange={e => setAdminMusicInput(e.target.value)} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-danger">Apply Abuse</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowAdminAbuse(false)}>Close</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`dropzone ${uploading ? 'active' : ''}`} onClick={() => !uploading && fileInputRef.current?.click()}>
        <div className="dropzone-icon">{uploading ? '⏳' : '⇪'}</div>
        <h2>{uploading ? 'Uploading...' : 'Upload Files'}</h2>
        <input type="file" accept="image/*,video/*" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
      </div>

      <div className="tabs" style={{ marginTop: '2rem' }}>
        <button className={`tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Files</button>
        <button className={`tab ${activeTab === 'trash' ? 'active' : ''}`} onClick={() => setActiveTab('trash')}>Trash</button>
        <button className={`tab ${activeTab === 'permanent_deleted' ? 'active' : ''}`} onClick={() => setActiveTab('permanent_deleted')}>Recovery (Ghost)</button>
      </div>

      {spyMode && <div style={{ color: 'var(--danger)', marginBottom: '1rem', marginTop: '1rem' }}><strong>Spy Mode Active:</strong> Viewing {targetEmail}'s files.</div>}

      <div className="file-grid">
        {filteredFiles.map(file => (
          <div key={file.id} className="card file-card" style={activeTab === 'permanent_deleted' ? { opacity: 0.5, borderStyle: 'dashed' } : {}}>
            <div>
              {file.type?.startsWith('image/') ? (
                <img src={`/api/files/${file.id}`} alt={file.originalName} className="file-preview" />
              ) : file.type?.startsWith('video/') ? (
                <video src={`/api/files/${file.id}`} className="file-preview" autoPlay loop muted playsInline />
              ) : (
                <div className="file-icon">📄</div>
              )}
              <div className="file-name" title={file.originalName}>{file.originalName}</div>
              <div className="file-meta">
                <span>{formatSize(file.size)}</span>
                <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="file-actions">
              <a href={`/api/files/${file.id}`} download className="btn btn-primary" style={{ textAlign: 'center' }}>Download</a>
              {activeTab === 'active' && <button className="btn btn-danger" onClick={() => updateFileStatus(file.id, 'trash')}>Delete</button>}
              {activeTab === 'trash' && (
                <>
                  <button className="btn btn-outline" onClick={() => updateFileStatus(file.id, 'active')}>Restore</button>
                  <button className="btn btn-danger" onClick={() => updateFileStatus(file.id, 'permanent_deleted')}>Perm Delete</button>
                </>
              )}
              {activeTab === 'permanent_deleted' && <button className="btn btn-outline" onClick={() => updateFileStatus(file.id, 'active')}>Resurrect</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const modalStyles = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const labelStyles = {
  display: 'block', 
  marginBottom: '0.5rem', 
  fontSize: '0.9rem', 
  color: 'var(--light-gray)'
};
