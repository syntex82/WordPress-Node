/**
 * Hiring Request Detail Page
 * Shows details of a hiring request with actions for client/developer
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiUser, FiCode, FiDollarSign, FiClock, FiCalendar,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiMessageSquare, FiFolder,
  FiStar, FiMail
} from 'react-icons/fi';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import Tooltip from '../../components/Tooltip';
import { MARKETPLACE_TOOLTIPS } from '../../config/tooltips';
import toast from 'react-hot-toast';

interface HiringRequest {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  budgetType: string;
  budgetAmount: number;
  estimatedHours?: number;
  deadline?: string;
  status: string;
  responseMessage?: string;
  respondedAt?: string;
  createdAt: string;
  projectId?: string;
  client: { id: string; name: string; email: string; avatar?: string };
  developer: {
    id: string;
    displayName: string;
    headline?: string;
    hourlyRate?: number;
    rating?: number;
    reviewCount?: number;
    isVerified?: boolean;
    user: { id: string; name: string; email: string; avatar?: string };
  };
  project?: { id: string; title: string; status: string };
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ACCEPTED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
  CANCELLED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  DISPUTED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
};

export default function HiringRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [request, setRequest] = useState<HiringRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [showResponseInput, setShowResponseInput] = useState(false);

  useEffect(() => {
    if (id) fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/marketplace/hiring-requests/${id}`);
      setRequest(data);
    } catch (error: any) {
      console.error('Error fetching request:', error);
      toast.error(error.response?.data?.message || 'Failed to load request');
      navigate('/dev-marketplace/requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'accept' | 'reject' | 'cancel' | 'create-project') => {
    if (!request) return;
    setActionLoading(true);
    try {
      if (action === 'create-project') {
        const { data } = await api.post(`/marketplace/hiring-requests/${id}/create-project`);
        toast.success('Project created successfully!');
        navigate(`/dev-marketplace/projects/${data.id}`);
        return;
      }
      await api.post(`/marketplace/hiring-requests/${id}/${action}`, {
        message: responseMessage || undefined,
      });
      toast.success(`Request ${action}ed successfully!`);
      fetchRequest();
      setShowResponseInput(false);
      setResponseMessage('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isClient = user?.id === request?.client?.id;
  const isDeveloper = user?.id === request?.developer?.user?.id;
  const isAdmin = user?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FiAlertCircle className="mx-auto text-red-400 mb-4" size={48} />
          <p className="text-red-400 mb-4">Request not found</p>
          <Link
            to="/dev-marketplace/requests"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dev-marketplace/requests')}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <FiArrowLeft size={20} className="text-slate-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{request.title}</h1>
          <p className="text-slate-400 text-sm">Request ID: {request.id}</p>
        </div>
        <span className={`px-4 py-2 rounded-xl text-sm font-medium border ${statusColors[request.status]}`}>
          {statusLabels[request.status] || request.status}
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Request Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Details Card */}
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FiFolder className="text-blue-400" />
              Project Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Description</label>
                <p className="text-white mt-1 whitespace-pre-wrap">{request.description}</p>
              </div>
              {request.requirements && (
                <div>
                  <label className="text-sm text-slate-400">Requirements</label>
                  <p className="text-white mt-1 whitespace-pre-wrap">{request.requirements}</p>
                </div>
              )}
            </div>
          </div>

          {/* Budget & Timeline Card */}
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FiDollarSign className="text-emerald-400" />
              Budget & Timeline
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <FiDollarSign size={14} />
                  Budget
                </div>
                <p className="text-xl font-bold text-white">${Number(request.budgetAmount).toLocaleString()}</p>
                <p className="text-xs text-slate-500 capitalize">{request.budgetType}</p>
              </div>
              {request.estimatedHours && (
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <FiClock size={14} />
                    Est. Hours
                  </div>
                  <p className="text-xl font-bold text-white">{request.estimatedHours}</p>
                </div>
              )}
              {request.deadline && (
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <FiCalendar size={14} />
                    Deadline
                  </div>
                  <p className="text-sm font-medium text-white">{formatDate(request.deadline)}</p>
                </div>
              )}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <FiCalendar size={14} />
                  Created
                </div>
                <p className="text-sm font-medium text-white">{formatDate(request.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Response Message */}
          {request.responseMessage && (
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FiMessageSquare className="text-purple-400" />
                Developer Response
              </h2>
              <p className="text-white whitespace-pre-wrap">{request.responseMessage}</p>
              {request.respondedAt && (
                <p className="text-sm text-slate-500 mt-2">Responded on {formatDate(request.respondedAt)}</p>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Participants & Actions */}
        <div className="space-y-6">
          {/* Client Card */}
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
              <FiUser size={14} />
              Client
            </h3>
            <div className="flex items-center gap-3">
              <img
                src={request.client.avatar || '/images/default-avatar.png'}
                alt={request.client.name}
                className="w-12 h-12 rounded-full border-2 border-slate-600 object-cover"
              />
              <div>
                <p className="font-medium text-white">{request.client.name}</p>
                <p className="text-sm text-slate-400">{request.client.email}</p>
              </div>
            </div>
          </div>

          {/* Developer Card */}
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
              <FiCode size={14} />
              Developer
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <img
                  src={request.developer.user.avatar || '/images/default-avatar.png'}
                  alt={request.developer.displayName}
                  className="w-12 h-12 rounded-full border-2 border-slate-600 object-cover"
                />
                {request.developer.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-0.5 rounded-full">
                    <FiCheckCircle size={10} />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-white">{request.developer.displayName}</p>
                {request.developer.headline && (
                  <p className="text-sm text-slate-400 line-clamp-1">{request.developer.headline}</p>
                )}
              </div>
            </div>
            {(request.developer.rating || request.developer.hourlyRate) && (
              <div className="flex items-center gap-4 text-sm">
                {request.developer.rating && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <FiStar size={12} />
                    {Number(request.developer.rating).toFixed(1)}
                  </span>
                )}
                {request.developer.hourlyRate && (
                  <span className="text-emerald-400">${request.developer.hourlyRate}/hr</span>
                )}
              </div>
            )}
          </div>

          {/* Actions Card */}
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Actions</h3>
            <div className="space-y-3">
              {/* Developer Actions */}
              {isDeveloper && request.status === 'PENDING' && (
                <>
                  {showResponseInput ? (
                    <div className="space-y-3">
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        placeholder="Add a message (optional)..."
                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction('accept')}
                          disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          <FiCheckCircle size={16} />
                          Accept
                        </button>
                        <button
                          onClick={() => handleAction('reject')}
                          disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          <FiXCircle size={16} />
                          Reject
                        </button>
                      </div>
                      <button
                        onClick={() => setShowResponseInput(false)}
                        className="w-full text-slate-400 hover:text-white text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowResponseInput(true)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <FiMessageSquare size={16} />
                      Respond to Request
                    </button>
                  )}
                </>
              )}

              {/* Client Actions */}
              {isClient && request.status === 'PENDING' && (
                <button
                  onClick={() => handleAction('cancel')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-red-600/20 text-red-400 border border-red-500/30 py-2.5 rounded-xl hover:bg-red-600/30 disabled:opacity-50 transition-colors"
                >
                  <FiXCircle size={16} />
                  Cancel Request
                </button>
              )}

              {/* Create Project (Client, after acceptance) */}
              {isClient && request.status === 'ACCEPTED' && !request.projectId && (
                <Tooltip title="Create Project" content="Convert this accepted request into an active project" position="top">
                  <button
                    onClick={() => handleAction('create-project')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <FiFolder size={16} />
                    Create Project
                  </button>
                </Tooltip>
              )}

              {/* View Project Link */}
              {request.projectId && (
                <Link
                  to={`/dev-marketplace/projects/${request.projectId}`}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <FiFolder size={16} />
                  View Project
                </Link>
              )}

              {/* Contact Links */}
              {isDeveloper && (
                <a
                  href={`mailto:${request.client.email}`}
                  className="w-full flex items-center justify-center gap-2 bg-slate-700/50 text-slate-300 py-2.5 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <FiMail size={16} />
                  Contact Client
                </a>
              )}
              {isClient && (
                <a
                  href={`mailto:${request.developer.user.email}`}
                  className="w-full flex items-center justify-center gap-2 bg-slate-700/50 text-slate-300 py-2.5 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <FiMail size={16} />
                  Contact Developer
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
