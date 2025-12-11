/**
 * Two-Factor Authentication Page
 * Enable and manage 2FA for enhanced account security
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { securityApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiKey, FiShield, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

export default function TwoFactorAuth() {
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
        <Link to=".." relative="path" className="flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <FiArrowLeft className="mr-2" size={18} />
          Back to Security Center
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Two-Factor Authentication</h1>
        <p className="text-gray-600 mt-1">Add an extra layer of security to your account</p>
      </div>

      {/* Status Card */}
      <div className={`rounded-lg shadow p-6 mb-6 ${user?.twoFactorEnabled ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-start">
          {user?.twoFactorEnabled ? (
            <>
              <FiCheckCircle className="text-green-600 mr-4 mt-1" size={24} />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900">2FA is Enabled</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app when logging in.
                </p>
                <button
                  onClick={handleDisable2FA}
                  disabled={loading}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Disable 2FA
                </button>
              </div>
            </>
          ) : (
            <>
              <FiAlertTriangle className="text-yellow-600 mr-4 mt-1" size={24} />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900">2FA is Not Enabled</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Enable two-factor authentication to add an extra layer of security to your account.
                </p>
                <button
                  onClick={handleGenerateSecret}
                  disabled={loading || showSetup}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Setup Two-Factor Authentication</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Step 1: Install an Authenticator App</h3>
              <p className="text-sm text-gray-600 mb-2">
                Download and install an authenticator app on your mobile device:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Google Authenticator (iOS, Android)</li>
                <li>Microsoft Authenticator (iOS, Android)</li>
                <li>Authy (iOS, Android, Desktop)</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Step 2: Scan QR Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Open your authenticator app and scan this QR code:
              </p>
              {qrCode && (
                <div className="bg-white p-4 inline-block border border-gray-200 rounded-lg">
                  <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Or manually enter this secret key: <code className="bg-gray-100 px-2 py-1 rounded">{secret}</code>
              </p>
            </div>

            {/* Step 3 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Step 3: Verify Code</h3>
              <form onSubmit={handleEnable2FA} className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter the 6-digit code from your authenticator app:
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                  required
                />
                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={loading || token.length !== 6}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Enable 2FA'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSetup(false);
                      setToken('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-start mb-4">
            <FiKey className="text-orange-600 mr-3 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-orange-900">Save Your Recovery Codes</h3>
              <p className="text-sm text-orange-700 mt-1">
                Store these recovery codes in a safe place. You can use them to access your account if you lose your authenticator device.
                Each code can only be used once.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 font-mono text-sm">
            <div className="grid grid-cols-2 gap-2">
              {recoveryCodes.map((code, index) => (
                <div key={index} className="bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {code}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={copyRecoveryCodes}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            Copy All Codes
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <FiShield className="text-blue-600 mr-3 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-blue-900">About Two-Factor Authentication</h3>
            <p className="text-sm text-blue-700 mt-1">
              Two-factor authentication (2FA) adds an extra layer of security by requiring a verification code from your mobile device
              in addition to your password. This makes it much harder for attackers to gain access to your account, even if they know your password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

