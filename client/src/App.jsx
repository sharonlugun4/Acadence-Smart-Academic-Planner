
import React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen, LayoutDashboard, ListTodo, CalendarDays, Timer, ChartNoAxesCombined,
  Settings, Search, Bell, Plus, Check, Clock3, Flame, Pencil, Trash2, X,
  Play, Pause, RotateCcw, Square, LogOut, GraduationCap, CircleAlert, Target, ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { api, getToken } from './api.js';

const emptyForm = {
  title: '', subject: '', category: 'Assignment', due_date: '',
  priority: 'Medium', status: 'Pending', notes: ''
};

function localDateTimeValue(date) {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

function formatDate(value) {
  if (!value) return 'No date';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatMinutes(minutes) {
  const n = Number(minutes || 0);
  const h = Math.floor(n / 60);
  const m = n % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function isOverdue(task) {
  return task.status !== 'Completed' && new Date(task.due_date).getTime() < Date.now();
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await api(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      localStorage.setItem('studysync_token', result.token);
      onAuth(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-art">
        <div className="brand large">
          <span className="brand-mark"><BookOpen /></span>
          <span>Study<span className="brand-accent">Sync</span></span>
        </div>
        <div className="auth-illustration">
          <BookOpen size={78} strokeWidth={1.2} /><span>✦</span>
        </div>
        <p className="eyebrow">SMALL STEPS. BIG ACHIEVEMENTS.</p>
        <h1>Your goals,<br />one focused day at a time.</h1>
        <p className="muted">Plan your academic life, protect your focus, and celebrate your progress.</p>
        <div className="auth-dots"><i/><i/><i/><i/><i/></div>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-form card" onSubmit={submit}>
          <p className="eyebrow">WELCOME TO STUDYSYNC</p>
          <h2>{mode === 'login' ? 'Welcome back!' : 'Create your account'}</h2>
          <p className="muted">
            {mode === 'login'
              ? 'Ready for a productive study session?'
              : 'Let’s make your study routine simpler.'}
          </p>

          {mode === 'register' && (
            <label>
              Full name
              <input required minLength="2" value={name}
                onChange={e => setName(e.target.value)} placeholder="Your name" />
            </label>
          )}

          <label>
            Email address
            <input type="email" required value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>

          <label>
            Password
            <input type="password" required minLength="8" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </label>

          {error && <div className="error-banner">{error}</div>}

          <button className="primary full" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            <ChevronRight size={17}/>
          </button>

          <p className="auth-switch">
            {mode === 'login' ? 'New to StudySync?' : 'Already have an account?'}
            {' '}
            <button type="button" className="text-button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}>
              {mode === 'login' ? 'Create account' : 'Log in'}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}

function TaskModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(() => initial ? {
    ...initial,
    due_date: localDateTimeValue(new Date(initial.due_date))
  } : {
    ...emptyForm,
    due_date: localDateTimeValue(new Date(Date.now() + 86400000))
  });

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(key, value) {
    setForm(old => ({ ...old, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSave(form, initial?.id);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop"
      onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <form className="modal card" onSubmit={submit}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{initial ? 'UPDATE DETAILS' : 'MAKE A PLAN'}</p>
            <h2>{initial ? 'Edit task' : 'Add a new task'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={19}/>
          </button>
        </div>

        <label>
          Task title
          <input required maxLength="200" value={form.title}
            onChange={e => update('title', e.target.value)} placeholder="e.g. DBMS lab record" />
        </label>

        <div className="form-grid">
          <label>
            Subject
            <input value={form.subject} onChange={e => update('subject', e.target.value)}
              placeholder="e.g. DBMS" />
          </label>

          <label>
            Category
            <select value={form.category} onChange={e => update('category', e.target.value)}>
              {['Assignment', 'Exam', 'Lab Record', 'Revision', 'Other'].map(x =>
                <option key={x}>{x}</option>
              )}
            </select>
          </label>

          <label>
            Deadline
            <input type="datetime-local" required value={form.due_date}
              onChange={e => update('due_date', e.target.value)} />
          </label>

          <label>
            Priority
            <select value={form.priority} onChange={e => update('priority', e.target.value)}>
              {['High', 'Medium', 'Low'].map(x => <option key={x}>{x}</option>)}
            </select>
          </label>

          <label>
            Status
            <select value={form.status} onChange={e => update('status', e.target.value)}>
              {['Pending', 'In Progress', 'Completed'].map(x => <option key={x}>{x}</option>)}
            </select>
          </label>
        </div>

        <label>
          Notes <span className="optional">(optional)</span>
          <textarea rows="2" value={form.notes || ''}
            onChange={e => update('notes', e.target.value)}
            placeholder="Anything you need to remember…" />
        </label>

        {error && <div className="error-banner">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button className="primary" disabled={busy}>
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </form>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState({
    total: 0, completed: 0, pending: 0, inProgress: 0,
    overdue: 0, dueSoon: 0, completionRate: 0,
    weeklyMinutes: 0, dailyStudy: []
  });
  const [sessions, setSessions] = useState([]);
  const [page, setPage] = useState('Dashboard');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [seconds, setSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('Focus');
  const [sessionSaved, setSessionSaved] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date());

  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  }, []);

  const loadAll = useCallback(async () => {
    const [taskData, progressData, sessionData] = await Promise.all([
      api('/tasks'), api('/progress'), api('/sessions')
    ]);
    setTasks(taskData);
    setProgress(progressData);
    setSessions(sessionData);
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setAuthChecked(true);
      return;
    }

    api('/auth/me')
      .then(({ user: current }) => {
        setUser(current);
        return loadAll();
      })
      .catch(() => {
        localStorage.removeItem('studysync_token');
        setUser(null);
      })
      .finally(() => setAuthChecked(true));
  }, [loadAll]);

  useEffect(() => {
    if (!user) return;
    loadAll().catch(err => notify(err.message));
  }, [user, loadAll, notify]);

  useEffect(() => {
    if (!timerRunning) return undefined;

    const id = window.setInterval(() => {
      setSeconds(old => {
        if (old <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return old - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (seconds === 0 && !sessionSaved) {
      setSessionSaved(true);
      notify('Focus session finished! Save it to your study progress.');
      setTimerMode('Complete');
    }
  }, [seconds, sessionSaved, notify]);

  async function saveTask(form, id) {
    const payload = {
      ...form,
      due_date: new Date(form.due_date).toISOString().slice(0, 19).replace('T', ' ')
    };

    if (id) {
      await api(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/tasks', { method: 'POST', body: JSON.stringify(payload) });
    }

    await loadAll();
    notify(id ? 'Task updated successfully.' : 'Task added successfully.');
  }

  async function changeStatus(task, status) {
    await api(`/tasks/${task.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });

    await loadAll();
    notify(status === 'Completed'
      ? 'Lovely work — task completed!'
      : 'Task status updated.');
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;

    await api(`/tasks/${task.id}`, { method: 'DELETE' });
    await loadAll();
    notify('Task deleted.');
  }

  async function finishSession() {
    const minutes = timerMode === 'Complete'
      ? 25
      : Math.max(1, Math.round((25 * 60 - seconds) / 60));

    await api('/sessions', {
      method: 'POST',
      body: JSON.stringify({ duration_minutes: minutes })
    });

    await loadAll();
    setSeconds(25 * 60);
    setTimerMode('Focus');
    setSessionSaved(false);
    notify('Study session saved to your progress.');
  }

  function resetTimer(mode = timerMode) {
    setTimerRunning(false);
    setTimerMode(mode);
    setSessionSaved(false);
    setSeconds(mode === 'Break' ? 5 * 60 : 25 * 60);
  }

  // NEW: Stop pauses the timer without resetting the remaining time.
  function stopTimer() {
    setTimerRunning(false);
  }

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (filter !== 'All') {
      result = result.filter(t =>
        t.status === filter || t.priority === filter || t.category === filter
      );
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(t =>
        `${t.title} ${t.subject} ${t.category}`.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => {
      if (a.status === 'Completed' && b.status !== 'Completed') return 1;
      if (b.status === 'Completed' && a.status !== 'Completed') return -1;

      const p = { High: 0, Medium: 1, Low: 2 };
      return p[a.priority] - p[b.priority] ||
        new Date(a.due_date) - new Date(b.due_date);
    });
  }, [tasks, filter, query]);

  const todayTasks = useMemo(() => tasks.filter(t => {
    const d = new Date(t.due_date);
    const now = new Date();
    return d.toDateString() === now.toDateString() && t.status !== 'Completed';
  }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)), [tasks]);

  const upcoming = useMemo(() => tasks.filter(t => t.status !== 'Completed')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 4), [tasks]);

  const smartTask = useMemo(
    () => filteredTasks.find(t => t.status !== 'Completed'),
    [filteredTasks]
  );

  const chartData = useMemo(() => {
    const today = new Date();

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const key = d.toLocaleDateString('en-CA');
      const found = progress.dailyStudy?.find(
        x => String(x.day).slice(0, 10) === key
      );

      return {
        day: d.toLocaleDateString(undefined, { weekday: 'short' }),
        hours: Number(((found?.minutes || 0) / 60).toFixed(1))
      };
    });
  }, [progress.dailyStudy]);

  const calendarDays = useMemo(() => {
    const first = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7));

    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selectedDay]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function logout() {
    localStorage.removeItem('studysync_token');
    setUser(null);
    setTasks([]);
    setPage('Dashboard');
  }

  if (!authChecked) {
    return (
      <div className="loading-screen">
        <div className="loader"/>
        <p>Getting your study space ready…</p>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={setUser}/>;

  const completed = progress.completed || 0;
  const total = progress.total || 0;
  const percent = progress.completionRate || 0;
  const firstName = user.name.split(' ')[0];
  const currentTime = new Date();
  const greeting = currentTime.getHours() < 12
    ? 'Good morning'
    : currentTime.getHours() < 17
      ? 'Good afternoon'
      : 'Good evening';
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><BookOpen size={25}/></span>
          <span>Study<span className="brand-accent">Sync</span></span>
        </div>

        <nav className="nav-list">
          {[
            ['Dashboard', LayoutDashboard],
            ['My Tasks', ListTodo],
            ['Calendar', CalendarDays],
            ['Study Sessions', Timer],
            ['Progress', ChartNoAxesCombined],
            ['Settings', Settings]
          ].map(([label, Icon]) => (
            <button key={label}
              className={`nav-item ${page === label ? 'active' : ''}`}
              onClick={() => setPage(label)}>
              <Icon size={19}/><span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="streak-card">
          <div className="streak-title"><Flame size={19}/> Study Streak</div>
          <div className="streak-number">
            {sessions.length ? Math.min(sessions.length, 99) : 0}
            <small> sessions</small>
          </div>
          <p>Every focused minute counts.</p>
          <div className="streak-dots">
            {[0, 1, 2, 3, 4, 5, 6].map(x =>
              <i key={x} className={x < Math.min(sessions.length, 7) ? 'filled' : ''}/>
            )}
          </div>
          <div className="week-labels">
            {weekDays.map(d => <span key={d}>{d[0]}</span>)}
          </div>
        </div>

        <div className="sidebar-bottom">
          <span className="avatar">{firstName[0]?.toUpperCase()}</span>
          <div className="user-mini">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button title="Log out" className="icon-button" onClick={logout}>
            <LogOut size={17}/>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{greeting}, {firstName} <span className="wave">✦</span></h1>
            <p>Stay consistent today, achieve more tomorrow.</p>
          </div>
          <div className="top-actions">
            <label className="search-box">
              <Search size={18}/>
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search tasks, subjects…"/>
            </label>
            <button className="icon-button notification" title="Notifications">
              <Bell size={19}/><i/>
            </button>
            <span className="avatar big">{firstName[0]?.toUpperCase()}</span>
          </div>
        </header>

        {page === 'Dashboard' && (
          <div className="dashboard-grid">
            <section className="welcome-card card">
              <div className="welcome-copy">
                <p className="eyebrow">YOUR WEEKLY OVERVIEW</p>
                <h2>You’re on track<br/>this week! <span>◎</span></h2>
                <p className="muted">Keep going, small steps<br/>lead to big results.</p>
                <div className="mini-progress">
                  <span className="mini-check"><Check size={17}/></span>
                  <div>
                    <strong>{completed} tasks completed</strong>
                    <small>out of {total || 0} total tasks</small>
                  </div>
                </div>
              </div>

              <div className="welcome-calendar">
                <div className="calendar-title">
                  <strong>{selectedDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong>
                  <div>
                    <button className="icon-button"
                      onClick={() => setSelectedDay(new Date(selectedDay.getFullYear(), selectedDay.getMonth() - 1, 1))}>‹</button>
                    <button className="icon-button"
                      onClick={() => setSelectedDay(new Date(selectedDay.getFullYear(), selectedDay.getMonth() + 1, 1))}>›</button>
                  </div>
                </div>
                <div className="mini-calendar">
                  {calendarDays.map((d, i) => (
                    <button key={i}
                      className={`${d.getMonth() !== selectedDay.getMonth() ? 'outside' : ''} ${d.toDateString() === new Date().toDateString() ? 'today' : ''}`}
                      onClick={() => setSelectedDay(d)}>
                      <small>{weekDays[(d.getDay() + 6) % 7]}</small>
                      <span>{d.getDate()}</span>
                      {tasks.some(t => new Date(t.due_date).toDateString() === d.toDateString() && t.status !== 'Completed') && <i/>}
                    </button>
                  ))}
                </div>
                <div className="calendar-legend"><i/> Deadline scheduled</div>
              </div>
            </section>

            <section className="card today-card">
              <div className="section-heading">
                <div><p className="eyebrow">LET'S GET THINGS DONE</p><h2>Today’s Tasks</h2></div>
                <button className="text-button" onClick={() => { setPage('My Tasks'); setFilter('All'); }}>
                  View all <ChevronRight size={15}/>
                </button>
              </div>
              {todayTasks.length
                ? todayTasks.slice(0, 3).map(task =>
                    <TaskRow key={task.id} task={task} onStatus={changeStatus}
                      onEdit={t => setModal(t)} compact/>
                  )
                : <div className="empty-small">
                    <span className="empty-icon"><Check size={19}/></span>
                    <div><strong>A little breathing room!</strong><small>No tasks due today. Add one whenever you're ready.</small></div>
                  </div>
              }
              <button className="add-inline" onClick={() => setModal({ new: true })}>
                <Plus size={17}/> Add a new task
              </button>
            </section>

            <section className="card chart-card">
              <div className="section-heading">
                <div><p className="eyebrow">YOUR CONSISTENCY</p><h2>Weekly Study Hours</h2></div>
                <span className="subtle-pill">Last 7 days</span>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 6, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1e9e6"/>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8d8b99', fontSize: 12 }}/>
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#aaa5b1', fontSize: 11 }}/>
                    <Tooltip formatter={v => [`${v} hours`, 'Study time']}/>
                    <Bar dataKey="hours" fill="#9b8af6" radius={[7, 7, 2, 2]} maxBarSize={28}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-footer">
                <span className="legend-dot purple"/><span>Total study time this week</span>
                <strong>{formatMinutes(progress.weeklyMinutes)}</strong>
              </div>
            </section>

            <section className="card completion-card">
              <div className="section-heading">
                <div><p className="eyebrow">A LITTLE PROGRESS DAILY</p><h2>Task Performance</h2></div>
              </div>
              <div className="donut-wrap">
                <div className="donut" style={{ '--progress': `${percent}%` }}>
                  <div><strong>{percent}%</strong><small>Completed</small></div>
                </div>
              </div>
              <div className="stat-legend"><span><i className="legend-dot green"/>Completed</span><strong>{completed}</strong></div>
              <div className="stat-legend"><span><i className="legend-dot purple"/>In progress</span><strong>{progress.inProgress || 0}</strong></div>
              <div className="stat-legend"><span><i className="legend-dot grey"/>Pending</span><strong>{progress.pending || 0}</strong></div>
            </section>

            <section className="card focus-card">
              <div className="section-heading">
                <div><p className="eyebrow">PROTECT YOUR ATTENTION</p><h2>Focus Session</h2></div>
                <span className="focus-symbol"><Target size={18}/></span>
              </div>

              <div className="timer-mode">
                <button className={timerMode === 'Focus' ? 'selected' : ''}
                  onClick={() => resetTimer('Focus')}>Pomodoro</button>
                <button className={timerMode === 'Break' ? 'selected' : ''}
                  onClick={() => resetTimer('Break')}>Short break</button>
              </div>

              <div className="timer-display">{mmss}</div>

              <div className="timer-controls">
                <button className="primary"
                  onClick={() => {
                    if (seconds === 0) {
                      resetTimer(timerMode === 'Break' ? 'Break' : 'Focus');
                    } else {
                      setTimerRunning(v => !v);
                    }
                  }}>
                  <span>{timerRunning ? <Pause size={16}/> : <Play size={16}/>}</span>
                  {timerRunning ? 'Pause session' : 'Start session'}
                </button>

                {/* NEW STOP BUTTON */}
                <button className="secondary" title="Stop timer" onClick={stopTimer}>
                  <Square size={16}/> Stop
                </button>

                <button className="icon-button" title="Reset timer"
                  onClick={() => resetTimer(timerMode)}>
                  <RotateCcw size={17}/>
                </button>
              </div>

              {seconds === 0 && (
                <button className="save-session" onClick={finishSession}>
                  Save completed session
                </button>
              )}
              <p className="focus-caption">Small focused sessions add up.</p>
            </section>

            <section className="card deadline-card">
              <div className="section-heading">
                <div><p className="eyebrow">PLAN AHEAD</p><h2>Upcoming Deadlines</h2></div>
                <button className="text-button" onClick={() => setPage('My Tasks')}>
                  View all <ChevronRight size={15}/>
                </button>
              </div>

              {upcoming.length
                ? upcoming.map(task => (
                    <div className="deadline-row" key={task.id}>
                      <div className="date-box">
                        <small>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</small>
                        <strong>{new Date(task.due_date).getDate()}</strong>
                      </div>
                      <div className="deadline-info">
                        <strong>{task.title}</strong>
                        <small><i/> {task.subject}</small>
                      </div>
                      <div className="deadline-right">
                        <span className={isOverdue(task) ? 'overdue-text' : 'due-text'}>
                          {isOverdue(task) ? 'Overdue' : formatDate(task.due_date)}
                        </span>
                        <PriorityBadge priority={task.priority}/>
                      </div>
                    </div>
                  ))
                : <div className="empty-small">
                    <span className="empty-icon"><CalendarDays size={18}/></span>
                    <div><strong>No deadlines yet</strong><small>Add a task to see it here.</small></div>
                  </div>
              }
            </section>

            <section className="summary-strip card">
              <Summary icon={<ListTodo/>} label="Tasks due soon" value={progress.dueSoon || 0} note="Next 7 days" tone="lavender"/>
              <Summary icon={<Check/>} label="Tasks completed" value={completed} note="You're making progress" tone="mint"/>
              <Summary icon={<Clock3/>} label="Study time this week" value={formatMinutes(progress.weeklyMinutes)} note="Every minute counts" tone="peach"/>
              <Summary icon={<Flame/>} label="Overdue tasks" value={progress.overdue || 0} note="Review your deadlines" tone="rose"/>
            </section>

            {smartTask && (
              <button className="smart-banner" onClick={() => { setPage('My Tasks'); setFilter('All'); }}>
                <span className="smart-icon"><Target size={22}/></span>
                <span>
                  <small>FOCUS ON THIS NEXT</small>
                  <strong>{smartTask.title}</strong>
                  <em>{smartTask.priority} priority · due {formatDate(smartTask.due_date)}</em>
                </span>
                <ChevronRight/>
              </button>
            )}
          </div>
        )}

        {page === 'My Tasks' && (
          <section className="page-card card">
            <div className="page-heading">
              <div>
                <p className="eyebrow">YOUR ACADEMIC WORKSPACE</p>
                <h2>My Tasks</h2>
                <p className="muted">One clear next step at a time.</p>
              </div>
              <button className="primary" onClick={() => setModal({ new: true })}>
                <Plus size={17}/> Add task
              </button>
            </div>

            <div className="filters">
              <div className="filter-search">
                <Search size={17}/>
                <input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search tasks or subjects"/>
              </div>
              <select value={filter} onChange={e => setFilter(e.target.value)}>
                {['All', 'Pending', 'In Progress', 'Completed', 'High', 'Medium', 'Low', 'Assignment', 'Exam', 'Lab Record', 'Revision', 'Other'].map(x =>
                  <option key={x}>{x}</option>
                )}
              </select>
            </div>

            <div className="task-list">
              {filteredTasks.map(task =>
                <TaskRow key={task.id} task={task} onStatus={changeStatus}
                  onEdit={t => setModal(t)} onDelete={deleteTask}/>
              )}
            </div>

            {!filteredTasks.length && (
              <div className="empty-state">
                <div className="empty-art"><BookOpen size={38}/></div>
                <h3>No tasks found</h3>
                <p>Try another filter, or add a task to get started.</p>
                <button className="primary" onClick={() => setModal({ new: true })}>
                  <Plus size={16}/> Add your first task
                </button>
              </div>
            )}
          </section>
        )}

        {page === 'Calendar' && (
          <section className="page-card card calendar-page">
            <div className="page-heading">
              <div>
                <p className="eyebrow">SEE THE BIG PICTURE</p>
                <h2>Academic Calendar</h2>
                <p className="muted">Your deadlines, laid out clearly.</p>
              </div>
              <button className="primary" onClick={() => setModal({ new: true })}>
                <Plus size={17}/> Add task
              </button>
            </div>

            <div className="calendar-title large-calendar-title">
              <button className="secondary"
                onClick={() => setSelectedDay(new Date(selectedDay.getFullYear(), selectedDay.getMonth() - 1, 1))}>‹ Previous</button>
              <h3>{selectedDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
              <button className="secondary"
                onClick={() => setSelectedDay(new Date(selectedDay.getFullYear(), selectedDay.getMonth() + 1, 1))}>Next ›</button>
            </div>

            <div className="full-calendar">
              {weekDays.map(d => <strong key={d}>{d}</strong>)}
              {calendarDays.map((d, i) => {
                const due = tasks.filter(t =>
                  new Date(t.due_date).toDateString() === d.toDateString() &&
                  t.status !== 'Completed'
                );

                return (
                  <button key={i}
                    onClick={() => {
                      setSelectedDay(d);
                      if (due.length) notify(`${due.length} task(s) due on ${formatDate(d)}`);
                    }}
                    className={`${d.getMonth() !== selectedDay.getMonth() ? 'outside' : ''} ${d.toDateString() === new Date().toDateString() ? 'today' : ''}`}>
                    <span>{d.getDate()}</span>
                    {due.slice(0, 2).map(t => <small key={t.id}>{t.title}</small>)}
                    {due.length > 2 && <small>+{due.length - 2} more</small>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {page === 'Study Sessions' && (
          <section className="page-card card sessions-page">
            <div className="page-heading">
              <div>
                <p className="eyebrow">MAKE SPACE FOR DEEP WORK</p>
                <h2>Study Sessions</h2>
                <p className="muted">Focus with intention. Rest without guilt.</p>
              </div>
            </div>

            <div className="session-hero">
              <div className="session-orbit"><Timer size={40}/></div>
              <p className="eyebrow">YOUR FOCUS TIMER</p>
              <div className="timer-display">{mmss}</div>

              <div className="timer-mode centered">
                <button className={timerMode === 'Focus' ? 'selected' : ''}
                  onClick={() => resetTimer('Focus')}>25 min focus</button>
                <button className={timerMode === 'Break' ? 'selected' : ''}
                  onClick={() => resetTimer('Break')}>5 min break</button>
              </div>

              <div className="timer-controls centered">
                <button className="primary"
                  onClick={() => {
                    if (seconds === 0) resetTimer(timerMode);
                    else setTimerRunning(v => !v);
                  }}>
                  {timerRunning ? <Pause size={16}/> : <Play size={16}/>}
                  {timerRunning ? 'Pause' : 'Start timer'}
                </button>

                {/* NEW STOP BUTTON */}
                <button className="secondary" onClick={stopTimer} title="Stop timer">
                  <Square size={16}/> Stop
                </button>

                <button className="secondary" onClick={() => resetTimer(timerMode)}>
                  <RotateCcw size={16}/> Reset
                </button>
              </div>

              {seconds === 0 && (
                <button className="primary" onClick={finishSession}>
                  Save completed session
                </button>
              )}
            </div>

            <h3 className="subheading">Recent sessions</h3>
            {sessions.length
              ? <div className="session-history">
                  {sessions.slice(0, 10).map(s => (
                    <div key={s.id} className="history-row">
                      <span className="history-icon"><Clock3 size={18}/></span>
                      <div>
                        <strong>{s.duration_minutes} minute focus session</strong>
                        <small>{new Date(s.completed_at).toLocaleString()}</small>
                      </div>
                      <span className="subtle-pill">Completed</span>
                    </div>
                  ))}
                </div>
              : <p className="muted">Your saved sessions will appear here.</p>
            }
          </section>
        )}

        {page === 'Progress' && (
          <section className="page-card card">
            <div className="page-heading">
              <div>
                <p className="eyebrow">YOUR EFFORT, MADE VISIBLE</p>
                <h2>Study Progress</h2>
                <p className="muted">Celebrate consistency, not perfection.</p>
              </div>
            </div>

            <div className="progress-cards">
              <Summary icon={<ListTodo/>} label="Total tasks" value={total} note="All your academic tasks" tone="lavender"/>
              <Summary icon={<Check/>} label="Completed" value={completed} note={`${percent}% completion rate`} tone="mint"/>
              <Summary icon={<Clock3/>} label="Study time this week" value={formatMinutes(progress.weeklyMinutes)} note="Since Monday" tone="peach"/>
              <Summary icon={<CircleAlert/>} label="Overdue" value={progress.overdue || 0} note="Tasks to review" tone="rose"/>
            </div>

            <div className="progress-detail-grid">
              <div className="card inner-card">
                <h3>Study time — last 7 days</h3>
                <div className="chart-wrap tall">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1e9e6"/>
                      <XAxis dataKey="day" axisLine={false} tickLine={false}/>
                      <YAxis axisLine={false} tickLine={false}/>
                      <Tooltip/>
                      <Bar dataKey="hours" fill="#9b8af6" radius={[7, 7, 0, 0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card inner-card">
                <h3>Task completion</h3>
                <div className="donut-wrap">
                  <div className="donut large-donut" style={{ '--progress': `${percent}%` }}>
                    <div><strong>{percent}%</strong><small>Completed</small></div>
                  </div>
                </div>
                <div className="stat-legend"><span><i className="legend-dot green"/>Completed</span><strong>{completed}</strong></div>
                <div className="stat-legend"><span><i className="legend-dot grey"/>Remaining</span><strong>{Math.max(total - completed, 0)}</strong></div>
              </div>
            </div>
          </section>
        )}

        {page === 'Settings' && (
          <section className="page-card card">
            <div className="page-heading">
              <div>
                <p className="eyebrow">YOUR SPACE, YOUR WAY</p>
                <h2>Settings</h2>
                <p className="muted">Manage your StudySync account.</p>
              </div>
            </div>

            <div className="settings-profile">
              <span className="avatar huge">{firstName[0]?.toUpperCase()}</span>
              <div>
                <h3>{user.name}</h3>
                <p className="muted">{user.email}</p>
                <span className="subtle-pill">Student account</span>
              </div>
            </div>

            <div className="settings-row">
              <div>
                <strong>Account</strong>
                <p className="muted">Your profile is connected to your StudySync workspace.</p>
              </div>
              <button className="secondary" onClick={logout}>
                <LogOut size={16}/> Log out
              </button>
            </div>

            <div className="settings-row">
              <div>
                <strong>Data and privacy</strong>
                <p className="muted">Your tasks and sessions are saved under your account.</p>
              </div>
              <span className="subtle-pill">MySQL storage</span>
            </div>
          </section>
        )}
      </main>

      {toast && <div className="toast"><Check size={17}/>{toast}</div>}

      {modal && (
        <TaskModal
          initial={modal.new ? null : modal}
          onClose={() => setModal(null)}
          onSave={saveTask}
        />
      )}
    </div>
  );
}

function PriorityBadge({ priority }) {
  return <span className={`priority priority-${String(priority).toLowerCase()}`}>{priority}</span>;
}

function TaskRow({ task, onStatus, onEdit, onDelete, compact = false }) {
  return (
    <div className={`task-row ${compact ? 'compact' : ''} ${task.status === 'Completed' ? 'task-completed' : ''}`}>
      <button className={`task-check ${task.status === 'Completed' ? 'checked' : ''}`}
        title="Mark completed"
        onClick={() => onStatus(task, task.status === 'Completed' ? 'Pending' : 'Completed')}>
        {task.status === 'Completed' && <Check size={15}/>}
      </button>

      <div className="task-main">
        <strong>{task.title}</strong>
        <small>
          <i className="subject-dot"/>{task.subject || 'General'}
          <span className="task-category">· {task.category}</span>
        </small>
        {!compact && task.notes && <p>{task.notes}</p>}
      </div>

      <div className="task-due">
        <Clock3 size={14}/>
        <span>{formatDate(task.due_date)}</span>
        {isOverdue(task) && <em>Overdue</em>}
      </div>

      <PriorityBadge priority={task.priority}/>

      {!compact && (
        <div className="task-actions">
          <button className="icon-button" title="Edit" onClick={() => onEdit(task)}>
            <Pencil size={16}/>
          </button>
          <button className="icon-button danger-hover" title="Delete" onClick={() => onDelete(task)}>
            <Trash2 size={16}/>
          </button>
        </div>
      )}
    </div>
  );
}

function Summary({ icon, label, value, note, tone }) {
  return (
    <div className="summary-item">
      <span className={`summary-icon ${tone}`}>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{note}</em>
      </div>
    </div>
  );
}

export default App;
