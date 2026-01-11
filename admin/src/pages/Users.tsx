/**
 * Users Page
 * Manage users with create, edit, and delete functionality
 * With comprehensive tooltips for user guidance
 */

import { useEffect, useState } from 'react';
import { usersApi } from '../services/api';
import { useThemeClasses } from '../contexts/SiteThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiHelpCircle } from 'react-icons/fi';
import Tooltip from '../components/Tooltip';

// All available roles
const USER_ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'Full system access including security and all data' },
  { value: 'ADMIN', label: 'Admin', description: 'Site administrator with full access within scope' },
  { value: 'EDITOR', label: 'Editor', description: 'Can edit all content and media' },
  { value: 'AUTHOR', label: 'Author', description: 'Can create and manage own content' },
  { value: 'INSTRUCTOR', label: 'Instructor', description: 'Can manage own courses and students' },
  { value: 'STUDENT', label: 'Student', description: 'Course student with read access' },
  { value: 'USER', label: 'User', description: 'Basic user with profile access' },
  { value: 'VIEWER', label: 'Viewer', description: 'Read-only access (legacy)' },
] as const;

type UserRole = typeof USER_ROLES[number]['value'];

// Tooltip content for users page
const USERS_TOOLTIPS = {
  addNew: { title: 'Add New User', content: 'Create a new user account. Assign a role to control what they can access.' },
  edit: { title: 'Edit User', content: 'Modify user details like name, email, or role.' },
  delete: { title: 'Delete User', content: 'Permanently remove this user account. This action cannot be undone.' },
  roleAdmin: { title: 'Admin Role', content: 'Full access to all features including user management and settings.' },
  roleEditor: { title: 'Editor Role', content: 'Can edit and publish any content, but cannot manage users or settings.' },
  roleAuthor: { title: 'Author Role', content: 'Can create and publish their own content only.' },
  roleViewer: { title: 'Viewer Role', content: 'Read-only access. Cannot create or edit content.' },
};

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export default function Users() {
  const theme = useThemeClasses();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'AUTHOR',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; userId: string | null }>({
    isOpen: false,
    userId: null,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getAll({ page, limit });
      // Backend returns { users, meta }
      setUsers(response.data.users || []);
      if (response.data.meta) {
        setTotalPages(response.data.meta.totalPages || 1);
        setTotal(response.data.meta.total || 0);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load users');
      console.error('Users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'AUTHOR',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'AUTHOR',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    try {
      if (editingUser) {
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await usersApi.update(editingUser.id, updateData);
        toast.success('User updated successfully');
      } else {
        await usersApi.create(formData);
        toast.success('User created successfully');
      }
      handleCloseModal();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await usersApi.delete(id);
      toast.success('User deleted successfully');
      fetchUsers();
      setDeleteConfirm({ isOpen: false, userId: null });
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <h1 className={`text-3xl font-bold ${theme.titleGradient}`}>Users</h1>
          <Tooltip title="About Users" content="Manage user accounts and permissions. Assign roles to control what each user can access and modify." position="right" variant="help">
            <button className={`p-1 ${theme.icon} hover:text-blue-400`}>
              <FiHelpCircle size={18} />
            </button>
          </Tooltip>
        </div>
        <Tooltip title={USERS_TOOLTIPS.addNew.title} content={USERS_TOOLTIPS.addNew.content} position="left">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-xl hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-500/20 transition-all"
          >
            <FiPlus className="mr-2" size={18} />
            Add New User
          </button>
        </Tooltip>
      </div>

      <div className={`backdrop-blur rounded-xl border overflow-hidden ${theme.card}`}>
        <table className={`min-w-full divide-y ${theme.border}`}>
          <thead className={theme.tableHeader}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Name</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Email</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Role</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Joined</th>
              <th className={`px-6 py-3 text-right text-xs font-medium uppercase ${theme.textMuted}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme.border}`}>
            {users.map((user) => (
              <tr key={user.id} className={theme.tableRow}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${theme.textPrimary}`}>{user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm ${theme.textMuted}`}>{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'ADMIN' ? (theme.isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700') :
                    user.role === 'EDITOR' ? theme.badgeInfo :
                    user.role === 'AUTHOR' ? theme.badgeSuccess :
                    theme.badgeDefault
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textMuted}`}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Tooltip title={USERS_TOOLTIPS.edit.title} content={USERS_TOOLTIPS.edit.content} position="top">
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="text-blue-400 hover:text-blue-300 mr-3 transition-colors"
                    >
                      <FiEdit2 size={18} />
                    </button>
                  </Tooltip>
                  <Tooltip title={USERS_TOOLTIPS.delete.title} content={USERS_TOOLTIPS.delete.content} position="top" variant="warning">
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, userId: user.id })}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <p className={`text-sm ${theme.textMuted}`}>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-1.5 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${theme.buttonSecondary}`}
            >
              Previous
            </button>
            <span className={`px-3 py-1.5 text-sm ${theme.textMuted}`}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`px-3 py-1.5 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${theme.buttonSecondary}`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className={`fixed inset-0 backdrop-blur-sm ${theme.isDark ? 'bg-black/70' : 'bg-black/50'}`} onClick={handleCloseModal}></div>

            <div className={`relative rounded-2xl max-w-md w-full p-6 shadow-2xl ${theme.modal}`}>
              <button
                onClick={handleCloseModal}
                className={`absolute top-4 right-4 transition-colors ${theme.icon} ${theme.iconHover}`}
              >
                <FiX size={24} />
              </button>

              <h2 className={`text-2xl font-bold mb-6 ${theme.textPrimary}`}>
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>
                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
                    required={!editingUser}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.select}`}
                  >
                    {USER_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <p className={`text-xs mt-1 ${theme.textMuted}`}>
                    {USER_ROLES.find(r => r.value === formData.role)?.description}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className={`flex-1 px-4 py-2.5 rounded-lg transition-all ${theme.buttonSecondary}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all"
                  >
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => deleteConfirm.userId && handleDelete(deleteConfirm.userId)}
        onCancel={() => setDeleteConfirm({ isOpen: false, userId: null })}
      />
    </div>
  );
}


