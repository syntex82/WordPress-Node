/**
 * Setup Wizard Page
 * First-time installation wizard for configuring admin account and system settings
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupWizardApi, SmtpConfig } from '../services/api';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiCheck, FiArrowRight, FiArrowLeft, FiLock, FiEye, FiEyeOff, FiServer, FiGlobe, FiRefreshCw } from 'react-icons/fi';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const SETUP_STEPS: SetupStep[] = [
  { id: 'welcome', title: 'Welcome', description: 'Get started with your CMS', icon: FiGlobe },
  { id: 'admin', title: 'Admin Account', description: 'Create your administrator account', icon: FiUser },
  { id: 'smtp', title: 'Email Settings', description: 'Configure email delivery (optional)', icon: FiMail },
  { id: 'complete', title: 'Complete', description: 'Setup complete!', icon: FiCheck },
];

export default function SetupWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Admin form state
  const [adminForm, setAdminForm] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });

  // SMTP form state
  const [smtpForm, setSmtpForm] = useState<SmtpConfig>({
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromEmail: '',
    fromName: '',
  });
  const [skipSmtp, setSkipSmtp] = useState(false);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await setupWizardApi.getStatus();
      if (!response.data.setupRequired) {
        // Setup already complete, redirect to login
        navigate('/login');
        return;
      }
      // Check if admin already created
      if (response.data.status.adminCreated) {
        setCurrentStep(2); // Skip to SMTP step
      }
    } catch (error) {
      // If error, assume setup is needed
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async () => {
    if (!adminForm.email || !adminForm.name || !adminForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (adminForm.password !== adminForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (adminForm.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    try {
      await setupWizardApi.createAdmin({
        email: adminForm.email,
        name: adminForm.name,
        password: adminForm.password,
      });
      toast.success('Admin account created successfully');
      setCurrentStep(2);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create admin account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSmtpSubmit = async () => {
    if (skipSmtp) {
      setCurrentStep(3);
      return;
    }

    if (!smtpForm.host || !smtpForm.user || !smtpForm.password) {
      toast.error('Please fill in SMTP host, username, and password');
      return;
    }

    setSubmitting(true);
    try {
      await setupWizardApi.configureSmtp(smtpForm);
      toast.success('Email settings configured successfully');
      setCurrentStep(3);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to configure email settings');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await setupWizardApi.complete();
      toast.success('Setup complete! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete setup');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <FiRefreshCw className="animate-spin text-blue-400" size={48} />
      </div>
    );
  }

  const step = SETUP_STEPS[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {SETUP_STEPS.map((s, index) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                index < currentStep ? 'bg-emerald-500 border-emerald-500 text-white' :
                index === currentStep ? 'bg-blue-500 border-blue-500 text-white' :
                'border-slate-600 text-slate-500'
              }`}>
                {index < currentStep ? <FiCheck size={20} /> : <s.icon size={20} />}
              </div>
              {index < SETUP_STEPS.length - 1 && (
                <div className={`w-16 md:w-24 h-0.5 mx-2 ${index < currentStep ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-8">
          <div className="text-center mb-8">
            <step.icon className="mx-auto text-blue-400 mb-4" size={48} />
            <h1 className="text-2xl font-bold text-white mb-2">{step.title}</h1>
            <p className="text-slate-400">{step.description}</p>
          </div>

          {/* Welcome Step */}
          {currentStep === 0 && (
            <div className="text-center">
              <p className="text-slate-300 mb-6">
                Welcome to NodePress CMS! This wizard will help you set up your site in just a few steps.
              </p>
              <ul className="text-left text-slate-400 space-y-2 mb-8 max-w-md mx-auto">
                <li className="flex items-center gap-2"><FiCheck className="text-emerald-400" /> Create your admin account</li>
                <li className="flex items-center gap-2"><FiCheck className="text-emerald-400" /> Configure email settings (optional)</li>
                <li className="flex items-center gap-2"><FiCheck className="text-emerald-400" /> Start managing your content</li>
              </ul>
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center justify-center mx-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 transition-all"
              >
                Get Started <FiArrowRight className="ml-2" />
              </button>
            </div>
          )}

          {/* Admin Account Step */}
          {currentStep === 1 && (
            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                <input
                  type="text"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 pr-10"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={adminForm.confirmPassword}
                  onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50"
                  placeholder="••••••••"
                />
              </div>
              <button
                onClick={handleAdminSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 mt-6"
              >
                {submitting ? <FiRefreshCw className="animate-spin mr-2" /> : <FiLock className="mr-2" />}
                {submitting ? 'Creating Account...' : 'Create Admin Account'}
              </button>
            </div>
          )}

          {/* SMTP Step */}
          {currentStep === 2 && (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="skipSmtp"
                  checked={skipSmtp}
                  onChange={(e) => setSkipSmtp(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-500"
                />
                <label htmlFor="skipSmtp" className="text-slate-400">Skip email configuration (you can set this up later)</label>
              </div>
              {!skipSmtp && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">SMTP Host</label>
                      <input type="text" value={smtpForm.host} onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50" placeholder="smtp.gmail.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Port</label>
                      <input type="number" value={smtpForm.port} onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50" placeholder="587" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                    <input type="text" value={smtpForm.user} onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50" placeholder="your-email@gmail.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                    <input type="password" value={smtpForm.password} onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50" placeholder="••••••••" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">From Email</label>
                      <input type="email" value={smtpForm.fromEmail} onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50" placeholder="noreply@site.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">From Name</label>
                      <input type="text" value={smtpForm.fromName} onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50" placeholder="My Site" />
                    </div>
                  </div>
                </>
              )}
              <div className="flex gap-4 mt-6">
                <button onClick={() => setCurrentStep(1)} className="flex-1 flex items-center justify-center px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-all">
                  <FiArrowLeft className="mr-2" /> Back
                </button>
                <button onClick={handleSmtpSubmit} disabled={submitting}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
                  {submitting ? <FiRefreshCw className="animate-spin mr-2" /> : null}
                  {skipSmtp ? 'Skip' : submitting ? 'Saving...' : 'Save & Continue'} <FiArrowRight className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 3 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCheck className="text-emerald-400" size={40} />
              </div>
              <h2 className="text-xl font-bold text-white mb-4">Setup Complete!</h2>
              <p className="text-slate-400 mb-8">Your CMS is ready to use. Click below to log in and start managing your content.</p>
              <button onClick={handleComplete} disabled={submitting}
                className="flex items-center justify-center mx-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
                {submitting ? <FiRefreshCw className="animate-spin mr-2" /> : <FiServer className="mr-2" />}
                {submitting ? 'Finishing...' : 'Go to Login'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

