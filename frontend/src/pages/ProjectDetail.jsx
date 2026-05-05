import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import Modal from '../components/Modal';
import TaskBoard from '../components/TaskBoard';
import { useAuth } from '../context/AuthContext';

const emptyTask = {
  title: '',
  description: '',
  assignedTo: '',
  priority: 'medium',
  status: 'todo',
  dueDate: '',
};

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const [taskOpen, setTaskOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyTask);
  const [submitting, setSubmitting] = useState(false);

  const [memberOpen, setMemberOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isOwner = useMemo(
    () => project && user && String(project.owner?._id || project.owner) === String(user.id),
    [project, user]
  );
  const canManage = user?.role === 'admin' || isOwner;

  const load = async () => {
    try {
      const [{ data: p }, { data: t }] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
      ]);
      setProject(p);
      setTasks(t);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load project');
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!project) return;
    const ids = [project.owner?._id, ...(project.members || []).map((m) => m._id)].filter(Boolean);
    api
      .get('/users')
      .then(({ data }) => setUsers(data.filter((u) => ids.includes(u._id))))
      .catch(() => {});
  }, [project]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyTask);
    setTaskOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description || '',
      assignedTo: t.assignedTo?._id || '',
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '',
    });
    setTaskOpen(true);
  };

  const submitTask = async () => {
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        status: form.status,
        assignedTo: form.assignedTo || null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      };
      if (editing) {
        const allowed = canManage
          ? payload
          : { status: payload.status };
        await api.put(`/tasks/${editing._id}`, allowed);
      } else {
        await api.post('/tasks', { ...payload, project: id });
      }
      setTaskOpen(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTask = async () => {
    if (!editing) return;
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${editing._id}`);
      setTaskOpen(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete task');
    }
  };

  useEffect(() => {
    if (!memberOpen) return;
    setLoadingUsers(true);
    api
      .get('/users')
      .then(({ data }) => setAllUsers(data))
      .catch(() => setAllUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [memberOpen]);

  const addableUsers = useMemo(() => {
    if (!project) return [];
    const existing = new Set([
      String(project.owner?._id || project.owner),
      ...(project.members || []).map((m) => String(m._id || m)),
    ]);
    const q = memberQuery.trim().toLowerCase();
    return allUsers
      .filter((u) => !existing.has(String(u._id)))
      .filter(
        (u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
  }, [allUsers, memberQuery, project]);

  const addMember = async (userId) => {
    try {
      const ids = [...(project.members || []).map((m) => m._id), userId];
      const { data } = await api.put(`/projects/${id}`, { members: ids });
      setProject(data);
      setMemberQuery('');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add member');
    }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      const ids = (project.members || []).filter((m) => String(m._id) !== String(userId)).map((m) => m._id);
      const { data } = await api.put(`/projects/${id}`, { members: ids });
      setProject(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to remove member');
    }
  };

  if (error && !project) return <p className="text-red-600">{error}</p>;
  if (!project) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          {project.description && (
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{project.description}</p>
          )}
          <div className="mt-2 text-xs text-slate-500">
            Owner: {project.owner?.name} • {project.members?.length || 0} member(s)
          </div>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <button className="btn-ghost" onClick={() => setMemberOpen(true)}>
              Manage members
            </button>
          )}
          {canManage && (
            <button className="btn-primary" onClick={openCreate}>
              + New task
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <TaskBoard tasks={tasks} onTaskClick={openEdit} />

      <Modal
        open={taskOpen}
        title={editing ? 'Edit task' : 'New task'}
        onClose={() => setTaskOpen(false)}
        footer={
          <>
            {editing && canManage && (
              <button className="btn-danger mr-auto" onClick={deleteTask}>
                Delete
              </button>
            )}
            <button className="btn-ghost" onClick={() => setTaskOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={submitTask} disabled={submitting || !form.title}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              disabled={editing && !canManage}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={editing && !canManage}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                disabled={editing && !canManage}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Assignee</label>
              <select
                className="input"
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                disabled={editing && !canManage}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input
                type="date"
                className="input"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                disabled={editing && !canManage}
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={memberOpen}
        title="Manage members"
        onClose={() => setMemberOpen(false)}
        footer={
          <button className="btn-primary" onClick={() => setMemberOpen(false)}>
            Done
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Add members</label>
            <input
              className="input"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              placeholder="Filter by name or email (optional)"
            />
            <div className="mt-2 max-h-56 divide-y divide-slate-100 overflow-auto rounded-md border border-slate-200">
              {loadingUsers ? (
                <p className="px-3 py-2 text-sm text-slate-500">Loading users…</p>
              ) : addableUsers.length === 0 ? (
                <p className="px-3 py-2 text-sm text-slate-500">
                  {allUsers.length === 0
                    ? 'No users in the system yet.'
                    : 'No users left to add.'}
                </p>
              ) : (
                addableUsers.map((u) => (
                  <div key={u._id} className="flex items-center justify-between px-3 py-2">
                    <div className="text-sm">
                      <div className="font-medium">
                        {u.name}{' '}
                        <span className="text-xs font-normal text-slate-400">({u.role})</span>
                      </div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>
                    <button className="btn-ghost text-xs" onClick={() => addMember(u._id)}>
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">Current members</h4>
            {(!project.members || project.members.length === 0) ? (
              <p className="text-sm text-slate-500">No members yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                {project.members.map((m) => (
                  <li key={m._id} className="flex items-center justify-between px-3 py-2">
                    <div className="text-sm">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.email}</div>
                    </div>
                    <button className="btn-ghost text-xs" onClick={() => removeMember(m._id)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
