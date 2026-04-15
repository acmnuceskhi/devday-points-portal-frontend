import React from 'react';

interface DashboardHeroProps {
  participantName: string;
  onDownloadSnapshot: () => void;
  isExporting: boolean;
}

const DashboardHero: React.FC<DashboardHeroProps> = ({
  participantName,
  onDownloadSnapshot,
  isExporting,
}) => {
  return (
    <div className="dashboard-hero mx-5">
      <div className="dashboard-hero-head">
        <div className="dashboard-hero-copy">
          <p className="dashboard-hero-eyebrow">Participant Dashboard</p>
          <h1 className="main-heading dashboard-hero-title">
            Welcome back, <span className="dashboard-hero-name">{participantName}</span>
          </h1>
          <p className="muted dashboard-hero-subtitle">
            Track your competitions, standings, and progress from one place.
          </p>
        </div>

        <button
          onClick={onDownloadSnapshot}
          disabled={isExporting}
          className="snapshot-button dashboard-hero-download"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
            <path
              d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>{isExporting ? 'Exporting...' : 'Download Snapshot'}</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardHero;
