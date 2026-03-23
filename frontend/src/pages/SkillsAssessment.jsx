import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';

const skillCategories = [
  {
    category: 'Programming Languages',
    skills: [
      { name: 'Python', description: 'Data analysis, automation, ML' },
      { name: 'SQL', description: 'Database querying and management' },
      { name: 'R', description: 'Statistical computing' },
      { name: 'JavaScript', description: 'Web development and scripting' },
    ],
  },
  {
    category: 'Data & Analytics',
    skills: [
      { name: 'Excel (Advanced)', description: 'Pivot tables, VLOOKUP, macros' },
      { name: 'Tableau', description: 'Data visualization dashboards' },
      { name: 'Power BI', description: 'Business intelligence reports' },
      { name: 'Statistics', description: 'Probability, hypothesis testing' },
    ],
  },
  {
    category: 'Tools & Frameworks',
    skills: [
      { name: 'Git & GitHub', description: 'Version control' },
      { name: 'Pandas & NumPy', description: 'Python data libraries' },
      { name: 'Scikit-learn', description: 'Machine learning in Python' },
      { name: 'Jupyter Notebooks', description: 'Interactive analysis environment' },
    ],
  },
  {
    category: 'Soft Skills',
    skills: [
      { name: 'Problem Solving', description: 'Analytical thinking' },
      { name: 'Communication', description: 'Presenting data insights' },
      { name: 'Critical Thinking', description: 'Evaluating information' },
      { name: 'Team Collaboration', description: 'Working in teams' },
    ],
  },
];

export default function SkillsAssessment() {
  const [assessed, setAssessed] = useState({});
  const navigate = useNavigate();

  const toggle = (name, val) => {
    setAssessed((prev) => ({ ...prev, [name]: val }));
  };

  const totalSkills = skillCategories.reduce((a, c) => a + c.skills.length, 0);
  const answeredCount = Object.keys(assessed).length;
  const knownCount = Object.values(assessed).filter(Boolean).length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2>Skills Self-Assessment</h2>
        <p>For each skill below, indicate whether you currently know it or not. Be honest — this helps us create the best roadmap for you.</p>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
              Assessed: <strong style={{ color: '#1a1d2e' }}>{answeredCount}/{totalSkills}</strong>
            </span>
            <span style={{ margin: '0 16px', color: '#e5e7eb' }}>|</span>
            <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
              Known: <strong style={{ color: '#06d6a0' }}>{knownCount}</strong>
            </span>
            <span style={{ margin: '0 16px', color: '#e5e7eb' }}>|</span>
            <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
              To Learn: <strong style={{ color: '#ef476f' }}>{answeredCount - knownCount}</strong>
            </span>
          </div>
          <div className="progress-bar-track" style={{ width: 200 }}>
            <div className="progress-bar-fill green" style={{ width: `${(knownCount / totalSkills) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {skillCategories.map((cat, ci) => (
        <div key={ci} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 12, color: '#1a1d2e' }}>{cat.category}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {cat.skills.map((skill) => {
              const val = assessed[skill.name];
              return (
                <div
                  key={skill.name}
                  className="card"
                  style={{
                    padding: '16px 20px',
                    borderColor: val === true ? '#06d6a0' : val === false ? '#ef476f' : undefined,
                    borderWidth: val !== undefined ? 2 : 1,
                    background: val === true ? 'rgba(6,214,160,0.04)' : val === false ? 'rgba(239,71,111,0.04)' : undefined,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: 2 }}>{skill.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 12 }}>{skill.description}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className={`btn btn-sm ${val === true ? 'btn-success' : 'btn-secondary'}`}
                      onClick={() => toggle(skill.name, true)}
                      style={{ flex: 1 }}
                    >
                      <HiOutlineCheckCircle /> I Know This
                    </button>
                    <button
                      className={`btn btn-sm ${val === false ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={() => toggle(skill.name, false)}
                      style={{ flex: 1 }}
                    >
                      <HiOutlineXCircle /> Not Yet
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {answeredCount === totalSkills && (
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/skill-test')}>
            Proceed to Skill Evaluation Test →
          </button>
        </div>
      )}
    </div>
  );
}
