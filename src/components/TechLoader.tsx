type TechLoaderProps = {
  label?: string
}

export function TechLoader({ label = 'Syncing data...' }: TechLoaderProps) {
  return (
    <div className="tech-loader" role="status" aria-live="polite" aria-label={label}>
      <div className="tech-loader-track">
        <span className="tech-loader-dot" />
      </div>
      <p className="tech-loader-label">{label}</p>
    </div>
  )
}
