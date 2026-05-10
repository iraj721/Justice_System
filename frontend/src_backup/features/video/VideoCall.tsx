// frontend/src/features/video/VideoCall.tsx
import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../shared/services/apiClient';

declare global {
  interface Window {
    AgoraRTC: any;
  }
}

export function VideoCall({ token }: { token: string }) {
  const { meetingId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'PUBLIC_USER';
  
  const [joined, setJoined] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const clientRef = useRef<any>(null);
  const localTracksRef = useRef<any[]>([]);

  useEffect(() => {
    loadAgoraSDK();
  }, []);

  const loadAgoraSDK = () => {
    const script = document.createElement('script');
    script.src = 'https://download.agora.io/sdk/release/AgoraRTC_N_PROD-4.14.0.js';
    script.onload = () => {
      console.log('Agora SDK loaded');
      joinMeeting();
    };
    script.onerror = () => {
      setError('Failed to load video SDK');
      setLoading(false);
    };
    document.body.appendChild(script);
  };

  const joinMeeting = async () => {
    try {
      // Get token from backend
      const data = await apiRequest<{ token: string; app_id: string }>(
        `/video/meeting/${meetingId}/token`,
        { token }
      );
      
      if (!data.token || !data.app_id) {
        setError('Failed to get meeting token');
        setLoading(false);
        return;
      }
      
      // Initialize Agora client
      const AgoraRTC = window.AgoraRTC;
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;
      
      // Handle user events
      client.on('user-published', async (user: any, mediaType: string) => {
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          const remoteContainer = document.createElement('div');
          remoteContainer.id = `user-${user.uid}`;
          remoteContainer.style.width = '300px';
          remoteContainer.style.height = '225px';
          remoteContainer.style.margin = '8px';
          remoteContainer.style.borderRadius = '8px';
          remoteContainer.style.overflow = 'hidden';
          
          const remoteContainerDiv = document.getElementById('remote-videos');
          if (remoteContainerDiv) {
            remoteContainerDiv.appendChild(remoteContainer);
          }
          
          user.videoTrack.play(remoteContainer.id);
          setUsers(prev => [...prev, user.uid]);
        }
        
        if (mediaType === 'audio') {
          user.audioTrack.play();
        }
      });
      
      client.on('user-unpublished', (user: any) => {
        const container = document.getElementById(`user-${user.uid}`);
        if (container) container.remove();
        setUsers(prev => prev.filter(u => u !== user.uid));
      });
      
      // Join channel
      const uid = await client.join(data.app_id, `justice_meeting_${meetingId}`, data.token, null);
      
      // Create local tracks
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracksRef.current = tracks;
      
      // Play local video
      tracks[1].play(localVideoRef.current?.id);
      
      // Publish tracks
      await client.publish(tracks);
      
      setJoined(true);
      setLoading(false);
      
    } catch (err) {
      console.error('Failed to join meeting:', err);
      setError('Failed to join video meeting');
      setLoading(false);
    }
  };

  const leaveMeeting = async () => {
    if (localTracksRef.current.length) {
      localTracksRef.current.forEach(track => {
        track.close();
      });
    }
    
    if (clientRef.current) {
      await clientRef.current.leave();
    }
    
    setJoined(false);
    window.close();
  };

  const toggleMic = () => {
    if (localTracksRef.current[0]) {
      const enabled = !localTracksRef.current[0].enabled;
      localTracksRef.current[0].setEnabled(enabled);
    }
  };

  const toggleCamera = () => {
    if (localTracksRef.current[1]) {
      const enabled = !localTracksRef.current[1].enabled;
      localTracksRef.current[1].setEnabled(enabled);
    }
  };

  if (loading) {
    return <div className="card">🎥 Loading video meeting...</div>;
  }

  if (error) {
    return (
      <div className="card" style={{ background: '#fee2e2' }}>
        <p style={{ color: '#991b1b' }}>❌ {error}</p>
        <button onClick={() => window.close()}>Close</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div className="card" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2>🎥 Virtual Court Hearing</h2>
        <p>Meeting ID: {meetingId}</p>
        <p>Your Role: <strong>{role}</strong></p>
        {joined && <p style={{ color: '#10b981' }}>✅ Connected</p>}
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
        {/* Local Video */}
        <div style={{ width: '300px', height: '225px', borderRadius: '8px', overflow: 'hidden', background: '#1e293b', position: 'relative' }}>
          <div id="local-video" ref={localVideoRef} style={{ width: '100%', height: '100%' }} />
          <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
            You ({role})
          </div>
        </div>
        
        {/* Remote Videos */}
        <div id="remote-videos" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }} />
      </div>
      
      {/* Controls */}
      <div className="card" style={{ marginTop: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button onClick={toggleMic} style={{ background: '#3b82f6', cursor: 'pointer' }}>
            🎤 Toggle Mic
          </button>
          <button onClick={toggleCamera} style={{ background: '#8b5cf6', cursor: 'pointer' }}>
            📷 Toggle Camera
          </button>
          <button onClick={leaveMeeting} style={{ background: '#ef4444', cursor: 'pointer' }}>
            🔴 Leave Meeting
          </button>
        </div>
      </div>
    </div>
  );
}