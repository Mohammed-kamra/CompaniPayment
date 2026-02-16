import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './FindJob.css'

const FindJob = () => {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')

  // Sample job data
  const jobs = [
    { id: 1, title: 'Software Developer', company: 'Tech Corp', location: 'Remote', type: 'Full-time' },
    { id: 2, title: 'Marketing Manager', company: 'Market Solutions', location: 'Baghdad', type: 'Full-time' },
    { id: 3, title: 'Sales Representative', company: 'Business Hub', location: 'Erbil', type: 'Part-time' },
    { id: 4, title: 'Data Analyst', company: 'Data Insights', location: 'Remote', type: 'Full-time' },
    { id: 5, title: 'Project Manager', company: 'Project Pro', location: 'Sulaymaniyah', type: 'Full-time' },
    { id: 6, title: 'Graphic Designer', company: 'Creative Studio', location: 'Remote', type: 'Contract' }
  ]

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="find-job">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">{t('findJob.title')}</h1>
          <p className="page-subtitle">{t('findJob.subtitle')}</p>
        </div>

        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('findJob.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="search-button">{t('findJob.filter')}</button>
          </div>
        </div>

        <div className="jobs-grid">
          {filteredJobs.length > 0 ? (
            filteredJobs.map(job => (
              <div key={job.id} className="job-card">
                <h3 className="job-title">{job.title}</h3>
                <p className="job-company">{job.company}</p>
                <div className="job-details">
                  <span className="job-location">📍 {job.location}</span>
                  <span className="job-type">{job.type}</span>
                </div>
                <button className="btn btn-primary apply-button">Apply Now</button>
              </div>
            ))
          ) : (
            <div className="no-jobs">
              <p>{t('findJob.noJobs')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FindJob
