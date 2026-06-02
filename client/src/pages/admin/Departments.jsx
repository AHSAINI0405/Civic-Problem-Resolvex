import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PlusCircle, Edit2, Building2 } from 'lucide-react';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', email: '', phone: '', head: '', categories: '' });
  const [saving, setSaving] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '' });
  const [userSaving, setUserSaving] = useState(false);

  const [deptUsers, setDeptUsers] = useState({});
  const [expandedDept, setExpandedDept] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try { const res = await api.get('/admin/departments'); setDepartments(res.data.departments); }
    catch { toast.error('Failed to load departments.'); }
    finally { setLoading(false); }
  };

  const toggleExpandDept = async (deptId) => {
    if (expandedDept === deptId) {
      setExpandedDept(null);
      return;
    }
    setExpandedDept(deptId);
    if (!deptUsers[deptId]) {
      try {
        const res = await api.get(`/admin/departments/${deptId}/users`);
        setDeptUsers(prev => ({ ...prev, [deptId]: res.data.users }));
      } catch (err) {
        toast.error('Failed to load department users.');
      }
    }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditDept(null); setForm({ name: '', description: '', email: '', phone: '', head: '', categories: '' }); setShowModal(true); };
  const openEdit = (d) => { setEditDept(d); setForm({ name: d.name, description: d.description, email: d.email, phone: d.phone, head: d.head, categories: d.categories?.join(', ') }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, categories: form.categories.split(',').map(c => c.trim()).filter(Boolean) };
      if (editDept) { await api.put(`/admin/departments/${editDept._id}`, payload); toast.success('Department updated!'); }
      else { await api.post('/admin/departments', payload); toast.success('Department created!'); }
      setShowModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserSaving(true);
    try {
      await api.post('/admin/users/department', { ...userForm, departmentId: selectedDeptId });
      toast.success('Department user created!');
      setShowUserModal(false);
      setUserForm({ name: '', email: '', password: '' });
      // Invalidate cache and reload users for the department
      try {
        const res = await api.get(`/admin/departments/${selectedDeptId}/users`);
        setDeptUsers(prev => ({ ...prev, [selectedDeptId]: res.data.users }));
      } catch {}
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setUserSaving(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="page-container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="page-header flex justify-between items-center flex-wrap gap-4">
          <div><h1 className="page-title">Departments</h1><p className="page-subtitle">{departments.length} departments</p></div>
          <button onClick={openCreate} className="btn btn-primary"><PlusCircle size={15} /> Add Department</button>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 64 }}><span className="spinner spinner-lg" /></div>
          : departments.length === 0 ? <div className="empty-state"><Building2 size={48} /><p>No departments created yet.</p></div>
          : (
            <div className="grid-3">
              {departments.map(d => (
                <div key={d._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="flex justify-between items-start">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏢</div>
                    <button onClick={() => openEdit(d)} className="btn btn-ghost btn-icon"><Edit2 size={14} /></button>
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 15 }}>{d.name}</h3>
                    <p className="text-muted text-sm" style={{ marginTop: 4 }}>{d.description || 'No description'}</p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {d.categories?.slice(0, 3).map(c => (
                      <span key={c} style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', fontSize: 11 }}>{c}</span>
                    ))}
                    {d.categories?.length > 3 && <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>+{d.categories.length - 3} more</span>}
                  </div>
                  <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-solid)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>📥 {d.totalAssigned} assigned</span>
                    <span>✅ {d.totalResolved} resolved</span>
                  </div>

                  <button type="button" onClick={() => toggleExpandDept(d._id)} className="btn btn-ghost btn-sm" style={{ justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg3)', border: '1px solid var(--border-solid)' }}>
                    <span>👥 Staff Members ({deptUsers[d._id] ? deptUsers[d._id].length : 'Show'})</span>
                    <span>{expandedDept === d._id ? '▲' : '▼'}</span>
                  </button>

                  {expandedDept === d._id && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-solid)', maxHeight: 150, overflowY: 'auto' }}>
                      {!deptUsers[d._id] ? (
                        <span className="spinner" style={{ alignSelf: 'center' }} />
                      ) : deptUsers[d._id].length === 0 ? (
                        <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: 0, textAlign: 'center' }}>No staff members registered.</p>
                      ) : (
                        deptUsers[d._id].map(u => (
                          <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <p style={{ margin: 0, fontWeight: 500, color: 'var(--text)' }}>{u.name}</p>
                              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-faint)' }}>{u.email}</p>
                            </div>
                            {u.isBlocked && (
                              <span style={{ fontSize: 9, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '1px 5px', borderRadius: 4 }}>Blocked</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <button onClick={() => { setSelectedDeptId(d._id); setShowUserModal(true); }} className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>
                    + Add Department User
                  </button>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Dept Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowModal(false)}>
          <div className="glass" style={{ width: '100%', maxWidth: 500, padding: 28 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editDept ? 'Edit' : 'Create'} Department</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['name', 'Department Name', true], ['description', 'Description'], ['email', 'Email'], ['phone', 'Phone'], ['head', 'Department Head'], ['categories', 'Categories (comma-separated)']].map(([field, label, req]) => (
                <div key={field} className="form-group">
                  <label className="form-label">{label}</label>
                  <input className="form-input" value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} required={!!req} />
                </div>
              ))}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">{saving ? <span className="spinner" /> : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowUserModal(false)}>
          <div className="glass" style={{ width: '100%', maxWidth: 420, padding: 28 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Create Department User</h3>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['name', 'Full Name'], ['email', 'Email'], ['password', 'Password']].map(([field, label]) => (
                <div key={field} className="form-group">
                  <label className="form-label">{label}</label>
                  <input className="form-input" type={field === 'password' ? 'password' : 'text'} value={userForm[field]} onChange={e => setUserForm(f => ({ ...f, [field]: e.target.value }))} required />
                </div>
              ))}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowUserModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={userSaving} className="btn btn-primary">{userSaving ? <span className="spinner" /> : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
