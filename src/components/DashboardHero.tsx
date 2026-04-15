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
    <div className="bg-black/20 border border-[#ff2a2f]/35 rounded-lg p-6 md:p-8">
      <div className="dashboard-hero-head">
        <div className="dashboard-hero-copy text-center md:text-left">
          <h1 className="main-heading tracking-wider">
            Welcome, <span className="text-white">{participantName}</span>
          </h1>
          <p className="muted mt-2 text-sm md:text-base">
            Your central command for the Developer's Day experience.
          </p>
        </div>

        <button
          onClick={onDownloadSnapshot}
          disabled={isExporting}
          className="snapshot-button"
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
          <span>{isExporting ? 'Exporting...' : 'Save Details'}</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardHero;
