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
        console.log('Loaded competitions:', rows);
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
      await exportElementAsImage('dashboard-snapshot-template', 'simulation-dashboard');
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
    <div className="space-y-6 dashboard-editorial">
      <DashboardHero
        participantName={firstName}
        onDownloadSnapshot={() => void onExport()}
        isExporting={exporting}
      />

      {exportError ? <div className="error-banner">{exportError}</div> : null}

      <div className="dashboard-export-frame">
        <div className="participant-main-grid">
          <aside className="dashboard-panel profile-panel">
            <h3 className="section-heading">Your Profile</h3>
            <dl className="space-y-3">
              {profileDetails.map((detail) => (
                <div key={detail.label} className="profile-line flex items-center justify-between gap-4">
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

      <div
        id="dashboard-snapshot-template"
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: -1,
          opacity: 0,
          pointerEvents: 'none',
          width: '760px',
          padding: '26px',
          color: '#f8f8fb',
          background: 'linear-gradient(170deg, #0e0e13 0%, #09090d 55%, #12090a 100%)',
          fontFamily: 'Space Mono, monospace',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            paddingBottom: '16px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/devday-logo.png" alt="DevDay logo" style={{ width: '44px', height: '60px', objectFit: 'contain' }} />
            <div>
              <p style={{ margin: 0, fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#b9b9c4' }}>
                DevDay 2026
              </p>
              <h2 style={{ margin: '4px 0 0', fontSize: '24px', lineHeight: 1.1 }}>Participant Snapshot</h2>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#b9b9c4' }}>{new Date().toLocaleString()}</p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          <section style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '12px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: '#ffffff' }}>Profile</h3>
            <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {profileDetails.map((detail) => (
                <div
                  key={`snapshot-${detail.label}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ff7f82' }}>{detail.label}</span>
                  <span style={{ fontSize: '13px', textAlign: 'right' }}>{detail.value || '-'}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: '#ffffff' }}>Competitions</h3>
            {competitions.length ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                {competitions.map((item) => (
                  <article
                    key={`snapshot-${item.teamId}-${item.competitionId}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr)',
                      gap: '10px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      paddingBottom: '10px',
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{item.competitionName}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#b8b8c2' }}>{formatCompetitionSchedule(item)}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#d8d8e0' }}>{item.teamName}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#b8b8c2' }}>
                          {item.venues?.length ? item.venues.map((v) => v.name).join(', ') : item.venueName || 'TBA'}
                        </p>
                      </div>
                      <span
                        style={{
                          alignSelf: 'start',
                          fontSize: '10px',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '999px',
                          padding: '3px 8px',
                          color: item.paymentStatus === 'Paid' ? '#9df0cc' : '#ff9c9f',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.paymentStatus}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '12px', color: '#b8b8c2' }}>No competitions assigned yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
