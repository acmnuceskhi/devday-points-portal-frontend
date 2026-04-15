import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { exportElementAsImage } from '../lib/exportAsImage';
import { api } from '../lib/api';
import { formatCompetitionSchedule } from '../lib/formatCompetitionSchedule';
import type { ParticipantCompetition, TeamDetail } from '../types/api';
import DashboardHero from '../components/DashboardHero';
import { TeamDetailModal } from '../components/TeamDetailModal';
import { TechLoader } from '../components/TechLoader';

export function DashboardPage() {
  const { participant, accessToken } = useAuth();
  const [competitions, setCompetitions] = useState<ParticipantCompetition[]>([]);
  const [loadingCompetitions, setLoadingCompetitions] = useState(true);
  const [competitionsError, setCompetitionsError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamDetail | null>(null);
  const [selectedTeamLoading, setSelectedTeamLoading] = useState(false);
  const [selectedTeamError, setSelectedTeamError] = useState('');

  useEffect(() => {
    async function loadCompetitions() {
      if (!accessToken) {
        setLoadingCompetitions(false);
        return;
      }

      try {
        setCompetitionsError('');
        const rows = await api.getMyCompetitions(accessToken);
        setCompetitions(rows);
      } catch (error) {
        setCompetitionsError(error instanceof Error ? error.message : 'Could not load your competitions');
      } finally {
        setLoadingCompetitions(false);
      }
    }

    void loadCompetitions();
  }, [accessToken]);

  const onExport = async () => {
    try {
      setExportError('');
      setExporting(true);
      await exportElementAsImage('dashboard-sim-export', 'simulation-dashboard');
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Could not export dashboard image.');
    } finally {
      setExporting(false);
    }
  };

  const onOpenTeam = async (teamId: string) => {
    if (!accessToken) return;

    setSelectedTeam(null);
    setSelectedTeamError('');
    setSelectedTeamLoading(true);

    try {
      const data = await api.getTeamDetail(teamId, accessToken);
      setSelectedTeam(data);
    } catch (error) {
      setSelectedTeamError(error instanceof Error ? error.message : 'Could not load team details');
    } finally {
      setSelectedTeamLoading(false);
    }
  };

  const closeTeamModal = () => {
    setSelectedTeam(null);
    setSelectedTeamError('');
    setSelectedTeamLoading(false);
  };

  const firstName = participant?.fullName?.trim().split(/\s+/)[0] || 'Participant';
  const profileDetails = [
    { label: 'Full Name', value: participant?.fullName },
    { label: 'Email', value: participant?.email },
    { label: 'Phone', value: participant?.phone },
    { label: 'Institution', value: participant?.institution },
    { label: 'CNIC', value: participant?.cnic },
    { label: 'Roll Number', value: participant?.rollNumber },
    { label: 'Minigame Code', value: participant?.minigameCode },
  ];

  return (
    <div className="space-y-6">
      <DashboardHero
        participantName={firstName}
        onDownloadSnapshot={() => void onExport()}
        isExporting={exporting}
      />

      {exportError ? <div className="error-banner">{exportError}</div> : null}

      <div id="dashboard-sim-export" className="dashboard-export-frame">
        <div className="participant-main-grid">
          <aside className="dashboard-panel profile-panel">
            <h3 className="section-heading">Your Profile</h3>
            <dl className="space-y-3">
              {profileDetails.map((detail) => (
                <div key={detail.label} className="flex items-center justify-between gap-4">
                  <dt className="text-sm font-semibold text-[#ff2a2f]">{detail.label}</dt>
                  <dd className="text-white text-right">{detail.value || '-'}</dd>
                </div>
              ))}
            </dl>
          </aside>

          <section className="dashboard-panel mission-stream">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="section-heading">Your Competitions</h3>
                <p className="muted tiny">Upcoming and registered competitions.</p>
              </div>
            </div>

            {loadingCompetitions &&
              <TechLoader label="Loading competitions..." />}
            {competitionsError && <div className="text-[#ff2a2f] bg-[#ff2a2f]/15 p-3 rounded-lg">{competitionsError}</div>}

            {!loadingCompetitions && !competitionsError && (
              <div className="mission-stream-list">
                {competitions.map((item) => (
                  <article key={`${item.teamId}-${item.competitionId}`} className="mission-stream-row">
                    <div>
                      <p className="mission-title">{item.competitionName}</p>
                      <p className="stream-subline">
                        {formatCompetitionSchedule(item)}
                      </p>
                    </div>
                    <p className="mission-team">
                      {item.teamName} {item.isLeader && <span className="text-yellow-400">(Leader)</span>}
                    </p>
                    <p className="mission-venue">
                      {item.venues?.length ? item.venues.map((v) => v.name).join(', ') : item.venueName || 'TBA'}
                    </p>
                    <span className={`competition-status-pill ${item.paymentStatus === 'Paid' ? 'is-verified' : ''}`}>
                      {item.paymentStatus}
                    </span>
                    <button type="button" className="outline-button" onClick={() => void onOpenTeam(item.teamId)}>
                      Details
                    </button>
                  </article>
                ))}
                {!competitions.length && <p className="text-gray-500 text-center py-36">Looks like you haven't registered for any competitions yet.</p>}
              </div>
            )}
          </section>
        </div>
      </div>

      {(selectedTeamLoading || selectedTeam || selectedTeamError) ? (
        <TeamDetailModal
          item={selectedTeam}
          loading={selectedTeamLoading}
          errorMessage={selectedTeamError}
          onClose={closeTeamModal}
        />
      ) : null}
    </div>
  );
}
