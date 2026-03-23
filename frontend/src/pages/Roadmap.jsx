import { HiOutlineCheckCircle, HiOutlineLockClosed, HiOutlinePlayCircle } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';

const roadmapStages = [
  {
    stage: 1,
    title: 'Foundation',
    status: 'completed',
    skills: [
      { name: 'Python Basics', status: 'completed', duration: '2 weeks' },
      { name: 'SQL Fundamentals', status: 'completed', duration: '2 weeks' },
      { name: 'Excel Advanced', status: 'completed', duration: '1 week' },
    ],
  },
  {
    stage: 2,
    title: 'Data Analysis Core',
    status: 'in-progress',
    skills: [
      { name: 'Pandas & NumPy', status: 'completed', duration: '2 weeks' },
      { name: 'Data Visualization', status: 'in-progress', duration: '2 weeks' },
      { name: 'Statistics & Probability', status: 'locked', duration: '3 weeks' },
    ],
  },
  {
    stage: 3,
    title: 'Advanced Analytics',
    status: 'locked',
    skills: [
      { name: 'Tableau / Power BI', status: 'locked', duration: '2 weeks' },
      { name: 'Machine Learning Basics', status: 'locked', duration: '3 weeks' },
      { name: 'Data Storytelling', status: 'locked', duration: '1 week' },
    ],
  },
  {
    stage: 4,
    title: 'Industry Ready',
    status: 'locked',
    skills: [
      { name: 'Portfolio Project', status: 'locked', duration: '2 weeks' },
      { name: 'Resume & Interview Prep', status: 'locked', duration: '1 week' },
      { name: 'Job Applications', status: 'locked', duration: 'Ongoing' },
    ],
  },
];

const statusIcon = {
  completed: <HiOutlineCheckCircle style={{ color: '#06d6a0', fontSize: '1.2rem' }} />,
  'in-progress': <HiOutlinePlayCircle style={{ color: '#4361ee', fontSize: '1.2rem' }} />,
  locked: <HiOutlineLockClosed style={{ color: '#9ca3af', fontSize: '1.2rem' }} />,
};

const statusColor = {
  completed: '#06d6a0',
  'in-progress': '#4361ee',
  locked: '#e5e7eb',
};

export default function Roadmap() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2>Your Learning Roadmap</h2>
        <p>A personalized step-by-step path based on your assessment results. Complete each stage to unlock the next.</p>
      </div>

      {/* Progress overview */}
      <div className="card" style={{ marginBottom: 28, padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            Overall Progress: <strong style={{ color: '#1a1d2e' }}>Stage 2 of 4</strong>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge-tag green">3 Completed</span>
            <span className="badge-tag blue">1 In Progress</span>
            <span className="badge-tag gray">5 Locked</span>
          </div>
        </div>
        <div className="progress-bar-track" style={{ marginTop: 12 }}>
          <div className="progress-bar-fill green" style={{ width: '38%' }}></div>
        </div>
      </div>

      {/* Roadmap Timeline */}
      <div style={{ position: 'relative', paddingLeft: 36 }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: 15, top: 0, bottom: 0, width: 3,
          background: 'linear-gradient(180deg, #06d6a0 30%, #4361ee 50%, #e5e7eb 55%)',
          borderRadius: 4,
        }}></div>

        {roadmapStages.map((stage, si) => (
          <div key={si} className="animate-fade-in-up" style={{ marginBottom: 32, position: 'relative', animationDelay: `${si * 0.15}s`, animationFillMode: 'both' }}>
            {/* Timeline dot */}
            <div style={{
              position: 'absolute', left: -28, top: 4,
              width: 24, height: 24, borderRadius: '50%',
              background: statusColor[stage.status], border: '3px solid #fff',
              boxShadow: '0 0 0 3px ' + statusColor[stage.status],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', color: '#fff', fontWeight: 700,
              zIndex: 2,
            }}>
              {stage.stage}
            </div>

            {/* Stage Card */}
            <div className="card" style={{
              opacity: stage.status === 'locked' ? 0.6 : 1,
              borderColor: stage.status === 'in-progress' ? '#4361ee' : undefined,
              borderWidth: stage.status === 'in-progress' ? 2 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: '1.08rem', fontWeight: 600 }}>Stage {stage.stage}: {stage.title}</h3>
                </div>
                <span className={`badge-tag ${stage.status === 'completed' ? 'green' : stage.status === 'in-progress' ? 'blue' : 'gray'}`}>
                  {stage.status === 'completed' ? 'Completed' : stage.status === 'in-progress' ? 'In Progress' : 'Locked'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stage.skills.map((skill, ki) => (
                  <div key={ki} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 8, background: '#f8f9fc',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {statusIcon[skill.status]}
                      <span style={{
                        fontWeight: 500, fontSize: '0.88rem',
                        color: skill.status === 'locked' ? '#9ca3af' : '#1a1d2e',
                        textDecoration: skill.status === 'completed' ? 'line-through' : 'none',
                      }}>
                        {skill.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{skill.duration}</span>
                  </div>
                ))}
              </div>

              {stage.status === 'in-progress' && (
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/courses')}
                  >
                    Continue Learning
                  </button>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate('/skill-test')}
                  >
                    Take Validation Test
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
