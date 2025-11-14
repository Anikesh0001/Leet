import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RealTimeDetection from './RealTimeDetection';
import localdb from '../lib/localdb';

export const ProctorPanel: React.FC<{ userId?: string | number; problemId?: string | number }> = ({ userId, problemId }) => {
  const [lastAlert, setLastAlert] = useState<any | null>(null);
  const [showPanelInfo, setShowPanelInfo] = useState(true);
  const [recentDetections, setRecentDetections] = useState<any[]>([]);
  const [transientEvent, setTransientEvent] = useState<any | null>(null);
  const recentContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // auto-scroll to top when new detections arrive so examiner sees latest
    try {
      const c = recentContainerRef.current;
      if (c) {
        c.scrollTop = 0;
        const first = c.firstElementChild as HTMLElement | null;
        if (first) {
          // briefly highlight if suspicious
          if (recentDetections[0]?.suspicious) {
            first.classList.add('ring', 'ring-red-300');
            setTimeout(() => first.classList.remove('ring', 'ring-red-300'), 1800);
          }
        }
      }
    } catch (e) {
      console.warn('Autoscroll failed', e);
    }
  }, [recentDetections]);

  const { user } = useAuth();

  const handleDetection = useCallback(async (prediction: any) => {
    // structured events (tab_switch, split_screen, multiple_persons) come in as {type: '...', ...}
    try {
      if (prediction && prediction.type) {
        // Normalize event record
        const rec = { user_id: userId, problem_id: problemId, event_type: prediction.type, payload: prediction, suspicious: !!prediction.suspicious, timestamp: Date.now() };
        await localdb.insertDetectionLog(rec);

        // send to server-side for persistent admin logs if suspicious or special event
        try {
          const token = localStorage.getItem('leet_token');
          await fetch('http://localhost:4000/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(rec) });
        } catch (e) {
          console.warn('Failed to POST log to server', e);
        }

        // show transient banner to examiner for special events
        setTransientEvent(prediction);
        setTimeout(() => setTransientEvent(null), 4000);
        // also add normalized record to recent list
        setRecentDetections((prev) => [rec, ...prev].slice(0, 12));
        return;
      }

      // store detection log (only store essential fields)
      const rec = { user_id: userId, problem_id: problemId, class: prediction.class, score: prediction.score, suspicious: !!prediction.suspicious, bbox: prediction.bbox, event_type: 'detection', timestamp: Date.now() };
      await localdb.insertDetectionLog(rec);

      if (rec.suspicious) {
        try {
          const token = localStorage.getItem('leet_token');
          await fetch('http://localhost:4000/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(rec) });
        } catch (e) {
          console.warn('Failed to POST suspicious log to server', e);
        }
      }

      // maintain an in-memory recent list for quick UI display
      const item = { ...rec, // rec already contains event_type 'detection' and timestamp
        // keep original prediction fields for UI
        class: prediction.class,
        score: prediction.score,
        suspicious: !!prediction.suspicious
      };
      setRecentDetections((prev) => [item, ...prev].slice(0, 12));

      // If suspicious, surface a prominent alert
      if (prediction && prediction.suspicious) {
        setLastAlert(prediction);
        // auto-hide after a short duration
        setTimeout(() => setLastAlert(null), 5000);
      }
    } catch (e) {
      console.error('Failed to handle detection event', e);
    }
  }, [userId, problemId]);

  // Fallback listener: also accept window-level proctor events (in case onDetection callback is throttled)
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        // @ts-ignore
        const d = e?.detail;
        if (d) handleDetection(d);
      } catch (err) {
        console.warn('proctor:event handler error', err);
      }
    };
    window.addEventListener('proctor:event', handler as any);
    return () => window.removeEventListener('proctor:event', handler as any);
  }, [handleDetection]);

  const downloadLogs = async () => {
    try {
      const logs = await localdb.getDetectionLogs();
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `detection_logs_${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download logs', e);
    }
  };

  return (
    <div className="relative p-0 bg-white">
      {/* Large overlay when suspicious detection occurs */}
      {lastAlert && (
        <div className="absolute inset-0 z-40 flex items-start justify-center pointer-events-none">
          <div className="mt-6 pointer-events-auto max-w-3xl w-full px-4">
            <div className="bg-red-600/95 text-white rounded-lg p-4 shadow-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8v4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div>
                  <div className="font-bold text-lg">🚨 Cheating Detected</div>
                  <div className="text-sm">{lastAlert.class} detected ({Math.round(lastAlert.score * 100)}%)</div>
                </div>
              </div>
              <div className="text-sm opacity-90">Logged to local detection history</div>
            </div>
          </div>
        </div>
      )}

      {transientEvent && (
        <div className="absolute top-6 right-6 z-50">
          <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${transientEvent.type === 'tab_switch' ? 'bg-yellow-500 text-black' : transientEvent.type === 'split_screen' ? 'bg-orange-500 text-white' : 'bg-red-600 text-white'}`}>
            {transientEvent.type === 'tab_switch' && '⚠️ Tab switched away'}
            {transientEvent.type === 'split_screen' && '⚠️ Split-screen detected'}
            {transientEvent.type === 'multiple_persons' && `🚨 ${transientEvent.count || 'multiple'} persons detected`}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        <div className="lg:col-span-2 bg-black rounded-lg overflow-hidden border border-gray-200">
          <RealTimeDetection
            settings={{ suspiciousClasses: ['cell phone', 'book', 'cup', 'laptop', 'keyboard'], alertSound: true }}
            onDetection={handleDetection}
            autoStart={true}
            minimalView={true}
          />
        </div>

        {user && user.is_admin ? (
          <div className="lg:col-span-1 bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-medium">Proctor Controls</h5>
            <div className="flex items-center space-x-2">
              <button onClick={() => setShowPanelInfo(!showPanelInfo)} className="text-xs text-gray-500">{showPanelInfo ? 'Hide' : 'Show'}</button>
              <button onClick={downloadLogs} className="text-xs text-blue-600 hover:underline">Download Logs</button>
            </div>
          </div>

          {showPanelInfo && (
            <div className="space-y-3 text-sm text-gray-700">
              <div className="text-xs text-gray-500">Status: Live</div>
              <div className="text-xs">Detection classes: <span className="font-medium">cell phone, book, cup, laptop, keyboard</span></div>
              <div className="text-xs">Camera live stream is shown to help you monitor during the session.</div>
              <div className="pt-2">
                <div className="text-xs font-medium">Recent Detection</div>
                {recentDetections.length > 0 ? (
                  <div ref={recentContainerRef} className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {recentDetections.map((d, idx) => (
                      <div key={idx} className={`text-sm p-2 rounded ${d.suspicious ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{(d.event_type === 'detection' ? d.class : (d.event_type || d.type))}</div>
                          <div className="text-xs text-gray-500">{new Date(d.timestamp).toLocaleTimeString()}</div>
                        </div>
                        {(d.event_type === 'detection' || d.type === 'detection') && <div className="text-xs">{Math.round((d.score || 0) * 100)}%</div>}
                        <div className="text-xs text-gray-500">{d.suspicious ? 'suspicious' : (d.event_type || d.type) || 'normal'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-gray-500">No recent detections</div>
                )}
              </div>
              <div className="pt-3">
                <div className="text-xs font-medium">Cheating Risk</div>
                <div className="w-full bg-gray-200 rounded h-3 mt-2 overflow-hidden">
                  <div className="h-3 bg-red-500" style={{ width: `${computeRiskPercent(recentDetections)}%`, transition: 'width 400ms' }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{computeRiskPercent(recentDetections)}% suspicious activity</div>
              </div>
            </div>
          )}
          </div>
        ) : (
          <div className="lg:col-span-1 bg-gray-50 rounded-lg p-3 border border-gray-200 flex flex-col items-center justify-center">
            <div className="text-sm text-gray-800 font-medium">Monitoring (user view)</div>
            <div className="mt-3 text-xs text-gray-700">Risk: {computeRiskPercent(recentDetections)}%</div>
            <div className="mt-2 text-xs text-gray-600">Latest: {recentDetections[0]?.event_type || recentDetections[0]?.type || '—'}</div>
            <div className="mt-2 text-xs text-gray-500">If suspicious activity occurs, a warning will appear.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProctorPanel;

// helper to compute risk percent from recentDetections
function computeRiskPercent(recentDetections: any[]) {
  if (!recentDetections || recentDetections.length === 0) return 0;
  // consider only entries within last 30s
  const now = Date.now();
  const window = recentDetections.filter(d => (now - (d.timestamp || now)) <= 30000);
  if (window.length === 0) return 0;
  const suspicious = window.filter(d => d.suspicious).length;
  const percent = Math.round((suspicious / window.length) * 100);
  return Math.min(100, percent);
}
