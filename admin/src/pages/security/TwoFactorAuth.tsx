/**
 * Two-Factor Authentication Page
 * Enable and manage 2FA for enhanced account security
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { securityApi } from '../../services/api';
import { useThemeClasses } from '../../contexts/SiteThemeContext';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiKey, FiShield, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

export default function TwoFactorAuth() {
  const theme = useThemeClasses();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showSetup, setShowSetup] = useState(false);

  const handleGenerateSecret = async () => {
    setLoading(true);
    try {
      const response = await securityApi.generate2FASecret();
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setShowSetup(true);
    } catch (error) {
      toast.error('Failed to generate 2FA secret');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await securityApi.enable2FA({ secret, token });
      setRecoveryCodes(response.data.recoveryCodes);
      toast.success('Two-factor authentication enabled successfully');
      setShowSetup(false);
      setToken('');
      // Refresh user data
      window.location.reload();
    } catch (error) {
      toast.error('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt('Enter your password to disable 2FA:');
    if (!password) return;

    setLoading(true);
    try {
      await securityApi.disable2FA({ password });
      toast.success('Two-factor authentication disabled');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to disable 2FA. Check your password.');
    } finally {
      setLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    toast.success('Recovery codes copied to clipboard');
  };

  return (
    <div>
      <div className="mb-6">
        <Link to=".." relative="path" className="flex items-center text-blue-400 hover:text-blue-300 mb-4">
          <FiArrowLeft className="mr-2" size={18} />
          Back to Security Center
        </Link>
        <h1 className={`text-3xl font-bold ${theme.titleGradient}`}>Two-Factor Authentication</h1>
        <p className={`mt-1 ${theme.textMuted}`}>Add an extra layer of security to your account</p>
      </div>

      {/* Status Card */}
      <div className={`rounded-xl p-6 mb-6 ${user?.twoFactorEnabled ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
        <div className="flex items-start">
          {user?.twoFactorEnabled ? (
            <>
              <FiCheckCircle className="text-emerald-400 mr-4 mt-1" size={24} />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-emerald-400">2FA is Enabled</h3>
                <p className={`text-sm mt-1 ${theme.textMuted}`}>
                  Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app when logging in.
                </p>
                <button
                  onClick={handleDisable2FA}
                  disabled={loading}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-500 disabled:opacity-50 transition-all"
                >
                  Disable 2FA
                </button>
              </div>
            </>
          ) : (
            <>
              <FiAlertTriangle className="text-amber-400 mr-4 mt-1" size={24} />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-400">2FA is Not Enabled</h3>
                <p className={`text-sm mt-1 ${theme.textMuted}`}>
                  Enable two-factor authentication to add an extra layer of security to your account.
                </p>
                <button
                  onClick={handleGenerateSecret}
                  disabled={loading || showSetup}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Generating...' : 'Enable 2FA'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Setup Instructions */}
      {showSetup && (
        <div className={`backdrop-blur rounded-xl border p-6 mb-6 ${theme.card}`}>
          <h2 className={`text-xl font-bold mb-4 ${theme.textPrimary}`}>Setup Two-Factor Authentication</h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div>
              <h3 className={`font-semibold mb-2 ${theme.textPrimary}`}>Step 1: Install an Authenticator App</h3>
              <p className={`text-sm mb-2 ${theme.textMuted}`}>
                Download and install an authenticator app on your mobile device:
              </p>
              <ul className={`list-disc list-inside text-sm space-y-1 ${theme.textMuted}`}>
                <li>Google Authenticator (iOS, Android)</li>
                <li>Microsoft Authenticator (iOS, Android)</li>
                <li>Authy (iOS, Android, Desktop)</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div>
              <h3 className={`font-semibold mb-2 ${theme.textPrimary}`}>Step 2: Scan QR Code</h3>
              <p className={`text-sm mb-4 ${theme.textMuted}`}>
                Open your authenticator app and scan this QR code:
              </p>
              {qrCode && (
                <div className="bg-white p-4 inline-block rounded-xl">
                  <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
                </div>
              )}
              <p className={`text-xs mt-2 ${theme.isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                Or manually enter this secret key: <code className={`px-2 py-1 rounded ${theme.isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-gray-100 text-gray-700'}`}>{secret}</code>
              </p>
            </div>

            {/* Step 3 */}
            <div>
              <h3 className={`font-semibold mb-2 ${theme.textPrimary}`}>Step 3: Verify Code</h3>
              <form onSubmit={handleEnable2FA} className="max-w-md">
                <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                  Enter the 6-digit code from your authenticator app:
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className={`w-full px-4 py-2 rounded-xl text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${theme.input}`}
                  maxLength={6}
                  required
                />
                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={loading || token.length !== 6}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Verifying...' : 'Enable 2FA'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSetup(false);
                      setToken('');
                    }}
                    className={`px-4 py-2 rounded-xl transition-all ${theme.isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Codes */}
      {recoveryCodes.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-start mb-4">
            <FiKey className="text-orange-400 mr-3 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-orange-400">Save Your Recovery Codes</h3>
              <p className={`text-sm mt-1 ${theme.textMuted}`}>
                Store these recovery codes in a safe place. You can use them to access your account if you lose your authenticator device.
                Each code can only be used once.
              </p>
            </div>
          </div>
          <div className={`rounded-xl p-4 font-mono text-sm ${theme.isDark ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
            <div className="grid grid-cols-2 gap-2">
              {recoveryCodes.map((code, index) => (
                <div key={index} className={`px-3 py-2 rounded-lg border ${theme.isDark ? 'bg-slate-700/50 border-slate-600/50 text-slate-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                  {code}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={copyRecoveryCodes}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-500 transition-all"
          >
            Copy All Codes
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-6">
        <div className="flex items-start">
          <FiShield className="text-blue-400 mr-3 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-blue-400">About Two-Factor Authentication</h3>
            <p className={`text-sm mt-1 ${theme.textMuted}`}>
              Two-factor authentication (2FA) adds an extra layer of security by requiring a verification code from your mobile device
              in addition to your password. This makes it much harder for attackers to gain access to your account, even if they know your password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

