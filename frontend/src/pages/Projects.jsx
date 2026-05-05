import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    api
      .get('/projects')
      .then(({ data }) => setProjects(data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load projects'));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setSubmitting(true);
    try {
      await api.post('/projects', form);
      setForm({ name: '', description: '' });
      setOpen(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        {user?.role === 'admin' && (
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + New project
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {projects.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          No projects yet.{' '}
          {user?.role === 'admin' ? 'Create one to get started.' : 'Ask an admin to add you.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p._id}
              to={`/projects/${p._id}`}
              className="card p-4 transition hover:shadow-md"
            >
              <h3 className="text-base font-semibold text-slate-900">{p.name}</h3>
              {p.description && (
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.description}</p>
              )}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Owner: {p.owner?.name}</span>
                <span>{p.members?.length || 0} member(s)</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title="New project"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={create} disabled={submitting || !form.name}>
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
