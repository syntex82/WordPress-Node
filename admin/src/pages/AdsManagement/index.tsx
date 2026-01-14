/**
 * Ads Management Dashboard - Main Entry Point
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdsOverview } from './AdsOverview';
import { AdvertisersList } from './AdvertisersList';
import { CampaignsList } from './CampaignsList';
import { AdsList } from './AdsList';
import { ZonesList } from './ZonesList';
import { HouseAdsList } from './HouseAdsList';
import { AdsAnalytics } from './AdsAnalytics';

export const AdsManagement: React.FC = () => {
  return (
    <Routes>
      <Route index element={<AdsOverview />} />
      <Route path="advertisers/*" element={<AdvertisersList />} />
      <Route path="campaigns/*" element={<CampaignsList />} />
      <Route path="ads/*" element={<AdsList />} />
      <Route path="zones/*" element={<ZonesList />} />
      <Route path="house/*" element={<HouseAdsList />} />
      <Route path="analytics" element={<AdsAnalytics />} />
      <Route path="*" element={<Navigate to="/ads" replace />} />
    </Routes>
  );
};

export default AdsManagement;

