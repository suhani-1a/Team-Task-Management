import { useEffect, useState } from 'react';
import api from '../api/client';

function Stat({ label, value, accent }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent || 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard')
      .then(({ data }) => setData(data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load dashboard'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-slate-500">Loading…</p>;

  const { totals, tasksPerUser } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Projects" value={totals.projects} />
        <Stat label="Total tasks" value={totals.tasks} />
        <Stat label="Completed" value={totals.done} accent="text-emerald-600" />
        <Stat label="Overdue" value={totals.overdue} accent="text-red-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Status breakdown</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>To do</span>
              <span className="font-medium">{totals.todo}</span>
            </li>
            <li className="flex justify-between">
              <span>In progress</span>
              <span className="font-medium">{totals.inProgress}</span>
            </li>
            <li className="flex justify-between">
              <span>Done</span>
              <span className="font-medium text-emerald-600">{totals.done}</span>
            </li>
            <li className="flex justify-between">
              <span>Assigned to me</span>
              <span className="font-medium">{totals.assignedToMe}</span>
            </li>
          </ul>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Tasks per user</h2>
          {tasksPerUser.length === 0 ? (
            <p className="text-sm text-slate-500">No tasks assigned yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {tasksPerUser.map((u) => (
                <li key={u.userId} className="flex justify-between">
                  <span>
                    {u.name}{' '}
                    <span className="text-xs text-slate-400">({u.email})</span>
                  </span>
                  <span className="font-medium">{u.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
