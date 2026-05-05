import TaskCard from './TaskCard';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export default function TaskBoard({ tasks, onTaskClick }) {
  const grouped = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => (
        <div key={col.key} className="rounded-lg bg-slate-100 p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
            <span className="text-xs text-slate-500">{grouped[col.key].length}</span>
          </div>
          <div className="space-y-2">
            {grouped[col.key].map((t) => (
              <TaskCard key={t._id} task={t} onClick={() => onTaskClick(t)} />
            ))}
            {grouped[col.key].length === 0 && (
              <p className="px-1 py-2 text-xs text-slate-400">No tasks</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
