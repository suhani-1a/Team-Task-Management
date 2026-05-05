const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-800',
};

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString();
}

export default function TaskCard({ task, onClick }) {
  const overdue = task.overdue || (task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date());

  return (
    <button
      onClick={onClick}
      className="card w-full text-left px-3 py-2 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-slate-900">{task.title}</h4>
        <span className={`badge ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-600">{task.description}</p>
      )}
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
        </span>
        {task.dueDate && (
          <span className={overdue ? 'text-red-600 font-medium' : 'text-slate-500'}>
            {overdue ? 'Overdue • ' : ''}
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </button>
  );
}
