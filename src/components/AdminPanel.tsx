import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

type UserItem = {
  id: number | string;
  username?: string;
  is_admin?: number | boolean;
  created_at?: string;
};

type LogItem = {
  id: number | string;
  user_id: number | string;
  problem_id?: string | null;
  event_type?: string;
  payload?: any;
  timestamp?: string;
  received_at?: string;
};

export default function AdminPanel() {
  const { user, loading, signOut } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [live, setLive] = useState(true);
  const pollRef = useRef<number | null>(null);
  const lastLogIdRef = useRef<number | null>(null);
  const [newLogIds, setNewLogIds] = useState<Array<number | string>>([]);

  const [adminCreds, setAdminCreds] = useState<{ admin_user?: string; admin_pass?: string } | null>(null);

  const fetchAdminCreds = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/admin/credentials', {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const json = await res.json();
      if (json.ok) setAdminCreds({ admin_user: json.admin_user, admin_pass: json.admin_pass });
      else setAdminCreds(null);
    } catch (e) {
      setAdminCreds(null);
    }
  };

  useEffect(() => {
    if (!loading && user && user.is_admin) {
      fetchUsers();
      fetchAdminCreds();
    }
  }, [loading, user]);

  const getAuthToken = () => {
    return localStorage.getItem("leet_token") || "";
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("http://localhost:4000/api/admin/users", {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const json = await res.json();
      if (json.ok && Array.isArray(json.users)) setUsers(json.users);
      else setUsers([]);
    } catch (e) {
      console.error("fetchUsers error", e);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLogsForUser = async (u: UserItem) => {
    setSelectedUser(u);
    setLoadingLogs(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/admin/users/${u.id}/logs`,
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      const json = await res.json();
      if (json.ok && Array.isArray(json.logs)) setLogs(json.logs);
      else setLogs([]);
    } catch (e) {
      console.error("fetchLogsForUser", e);
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  // update lastLogIdRef after a fresh fetch
  const updateLastLogId = (fetchedLogs: LogItem[]) => {
    if (!fetchedLogs || fetchedLogs.length === 0) {
      lastLogIdRef.current = null;
      return;
    }
    // logs come ordered DESC (newest first)
    const newestId = Number(fetchedLogs[0].id);
    lastLogIdRef.current = newestId;
  };

  // fetch and merge new logs, highlight newly arrived ones
  const fetchAndMergeLogs = async (u: UserItem) => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/admin/users/${u.id}/logs`,
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      const json = await res.json();
      if (!json.ok || !Array.isArray(json.logs)) return;

      const fetched: LogItem[] = json.logs;
      if (!lastLogIdRef.current) {
        // first time
        setLogs(fetched);
        updateLastLogId(fetched);
        return;
      }

      // determine new logs by comparing IDs (assumes incremental numeric ids)
      const prevIds = new Set(logs.map((l) => Number(l.id)));
      const newOnes = fetched.filter((l) => !prevIds.has(Number(l.id)));
      if (newOnes.length > 0) {
        // place newest first (replace with fetched, newest first)
        setLogs(fetched);
        const newIds = newOnes.map((n) => n.id);
        setNewLogIds(newIds);
        // clear highlights after 4s
        setTimeout(() => setNewLogIds((_) => []), 4000);
        updateLastLogId(fetched);
      }
    } catch (e) {
      console.error("poll fetch error", e);
    }
  };

  const startPolling = (u: UserItem) => {
    stopPolling();
    // immediate fetch
    fetchAndMergeLogs(u);
    // poll every 3s
    // use window.setInterval so we can clear by id
    const id = window.setInterval(() => fetchAndMergeLogs(u), 3000);
    pollRef.current = id as unknown as number;
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current as unknown as number);
      pollRef.current = null;
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify({ user: selectedUser, logs }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs_user_${selectedUser?.id || "unknown"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-4">Loading auth...</div>;

  if (!user || !user.is_admin) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold">Admin</h2>
        <p className="mt-4 text-gray-600">You are not authorized to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Admin Panel</h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={fetchUsers}
            className="px-3 py-1 bg-blue-600 text-white rounded-md"
          >
            Refresh Users
          </button>
          <button
            onClick={async () => {
              await signOut();
              window.location.href = '/';
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-md"
          >
            Logout
          </button>
          {selectedUser && (
            <>
              <button
                onClick={() => fetchLogsForUser(selectedUser)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md"
              >
                Refresh Logs
              </button>
              <label className="ml-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={live}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setLive(v);
                    if (v) startPolling(selectedUser);
                    else stopPolling();
                  }}
                />
                Live
              </label>
            </>
          )}
          {selectedUser && (
            <button
              onClick={exportLogs}
              className="px-3 py-1 bg-green-600 text-white rounded-md"
            >
              Export Logs
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium mb-2">Users</h3>
          {adminCreds && (
            <div className="mb-4 p-2 border rounded bg-gray-50 text-sm">
              <div className="font-medium">Predefined Admin Credentials (dev)</div>
              <div className="text-xs text-gray-600">Username: <span className="font-medium">{adminCreds.admin_user}</span></div>
              <div className="text-xs text-gray-600">Password: <span className="font-medium">{adminCreds.admin_pass}</span></div>
            </div>
          )}
          {loadingUsers ? (
            <div className="text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-gray-500">No users found.</div>
          ) : (
            <ul className="space-y-2 max-h-96 overflow-auto">
              {users.map((u) => (
                <li
                  key={String(u.id)}
                  className={`p-2 rounded-md hover:bg-gray-50 flex items-center justify-between cursor-pointer ${
                    selectedUser && selectedUser.id === u.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div>
                    <div className="font-medium">{u.username || `user-${u.id}`}</div>
                    <div className="text-xs text-gray-500">{u.created_at}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        u.is_admin ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.is_admin ? "admin" : "user"}
                    </span>
                    <button
                      onClick={() => fetchLogsForUser(u)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Logs
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="col-span-2 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Logs {selectedUser ? `for ${selectedUser.username}` : ""}</h3>
            <div className="text-sm text-gray-500">{loadingLogs ? "Loading..." : `${logs.length} logs`}</div>
          </div>

          {selectedUser ? (
            <div className="max-h-[60vh] overflow-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs for this user.</div>
              ) : (
                <ul className="space-y-3">
                  {logs.map((l) => (
                    <li
                      key={String(l.id)}
                      className={`p-3 border rounded-md transition ${
                        newLogIds.includes(l.id) ? "bg-yellow-50 ring-2 ring-yellow-200" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">{new Date(l.timestamp || l.received_at || Date.now()).toLocaleString()}</div>
                        <div className="text-xs font-medium text-red-600">{l.event_type}</div>
                      </div>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(l.payload, null, 2)}</pre>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="text-gray-500">Select a user to view logs.</div>
          )}
        </div>
      </div>
    </div>
  );
}
