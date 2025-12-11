/**
 * Security Center - Main Router
 * Handles all security-related pages and tools
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import SecurityDashboard from './security/SecurityDashboard';
import LoginActivity from './security/LoginActivity';
import BlockedIPs from './security/BlockedIPs';
import FileIntegrity from './security/FileIntegrity';
import AuditLog from './security/AuditLog';
import TwoFactorAuth from './security/TwoFactorAuth';
import RateLimiting from './security/RateLimiting';
import SessionManagement from './security/SessionManagement';
import PasswordPolicy from './security/PasswordPolicy';

export default function Security() {
  return (
    <Routes>
      <Route index element={<SecurityDashboard />} />
      <Route path="activity" element={<LoginActivity />} />
      <Route path="blocked-ips" element={<BlockedIPs />} />
      <Route path="rate-limiting" element={<RateLimiting />} />
      <Route path="sessions" element={<SessionManagement />} />
      <Route path="password-policy" element={<PasswordPolicy />} />
      <Route path="integrity" element={<FileIntegrity />} />
      <Route path="audit-log" element={<AuditLog />} />
      <Route path="2fa" element={<TwoFactorAuth />} />
      <Route path="*" element={<Navigate to="/admin/security" replace />} />
    </Routes>
  );
}



