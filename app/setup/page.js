'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Setup() {
  const [storageName, setStorageName] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/profile').then(res => {
      if (res.ok) {
        res.json().then(data => {
          if (data.profile.isSetupComplete) {
            router.push('/');
          } else {
            setChecking(false);
          }
        });
      } else {
        router.push('/login');
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let finalProfilePicUrl = '';

      if (profilePicFile) {
        const formData = new FormData();
        formData.append('file', profilePicFile);
        
        const uploadRes = await fetch('/api/profile/upload-pp', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalProfilePicUrl = uploadData.url;
        }
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          storageName: storageName || 'My Storage', 
          ...(finalProfilePicUrl && { profilePic: finalProfilePicUrl }),
          isSetupComplete: true 
        })
      });
      
      if (res.ok) {
        router.push('/');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Create Your Storage</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--light-gray)' }}>Storage Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={storageName} 
              onChange={(e) => setStorageName(e.target.value)} 
              required 
              placeholder="e.g. Zura's Secret Vault"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--light-gray)' }}>Profile Picture</label>
            <input 
              type="file" 
              className="input-field" 
              accept="image/*"
              onChange={(e) => setProfilePicFile(e.target.files[0])} 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Saving...' : 'Enter Storage'}
          </button>
          <button type="button" className="btn btn-outline" style={{ marginTop: '0.5rem' }} onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
          }}>
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
