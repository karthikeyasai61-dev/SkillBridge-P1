import { useState } from 'react';
import { HiOutlineClock, HiOutlineCheckCircle } from 'react-icons/hi2';

const questions = {
  Easy: [
    { q: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Logic', 'Standard Query Library', 'Sorted Query List'], answer: 0 },
    { q: 'Which Python library is used for data manipulation?', options: ['Flask', 'Pandas', 'Django', 'Pygame'], answer: 1 },
    { q: 'What is a DataFrame?', options: ['A graph type', 'A 2D data structure', 'A database', 'A file format'], answer: 1 },
    { q: 'Which chart is best for showing trends over time?', options: ['Pie Chart', 'Bar Chart', 'Line Chart', 'Scatter Plot'], answer: 2 },
    { q: 'What does CSV stand for?', options: ['Comma Separated Values', 'Common Syntax Values', 'Character Separated Variables', 'Coded Standard Values'], answer: 0 },
  ],
  Medium: [
    { q: 'What is the purpose of GROUP BY in SQL?', options: ['Sort data', 'Filter rows', 'Aggregate data by groups', 'Join tables'], answer: 2 },
    { q: 'What does the pandas .merge() function do?', options: ['Sorts data', 'Combines DataFrames', 'Filters data', 'Creates new columns'], answer: 1 },
    { q: 'What is a p-value in statistics?', options: ['Price value', 'Probability value', 'Performance value', 'Percentage value'], answer: 1 },
    { q: 'Which JOIN returns only matching rows from both tables?', options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'], answer: 2 },
    { q: 'What is feature engineering?', options: ['Building hardware', 'Creating input variables for ML', 'Database design', 'API development'], answer: 1 },
  ],
  Hard: [
    { q: 'What is the difference between L1 and L2 regularization?', options: ['L1 uses absolute values, L2 uses squared values', 'They are identical', 'L1 is for classification only', 'L2 is faster'], answer: 0 },
    { q: 'What is the curse of dimensionality?', options: ['Too few features', 'Performance degrades with high dimensions', 'Data overflow', 'Memory limit'], answer: 1 },
    { q: 'What is a window function in SQL?', options: ['A GUI function', 'Performs calculations across a set of rows', 'Creates views', 'Triggers events'], answer: 1 },
    { q: 'What is cross-validation?', options: ['Checking data types', 'Splitting data for robust evaluation', 'Joining datasets', 'Encrypting data'], answer: 1 },
    { q: 'What is the bias-variance tradeoff?', options: ['Speed vs accuracy', 'Balancing underfitting and overfitting', 'Precision vs recall', 'Training vs testing'], answer: 1 },
  ],
};

const difficultyColors = { Easy: '#06d6a0', Medium: '#ffd166', Hard: '#ef476f' };

export default function SkillTest() {
  const [difficulty, setDifficulty] = useState('Easy');
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);

  const qList = questions[difficulty];
  const question = qList[current];

  const handleNext = () => {
    const newAnswers = [...answers, { selected, correct: question.answer }];
    if (current + 1 < qList.length) {
      setAnswers(newAnswers);
      setCurrent(current + 1);
      setSelected(null);
    } else {
      setAnswers(newAnswers);
      setFinished(true);
    }
  };

  const score = answers.filter((a) => a.selected === a.correct).length;

  const reset = (diff) => {
    setDifficulty(diff);
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setFinished(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2>Skill Evaluation Test</h2>
        <p>Test your proficiency with multi-level assessment questions.</p>
      </div>

      {/* Difficulty Tabs */}
      <div className="tab-nav">
        {Object.keys(questions).map((d) => (
          <button key={d} className={`tab-btn ${difficulty === d && !finished ? 'active' : ''}`} onClick={() => reset(d)}>
            {d}
          </button>
        ))}
      </div>

      {!finished ? (
        <div className="card" style={{ maxWidth: 700 }}>
          {/* Progress */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge-tag" style={{ background: `${difficultyColors[difficulty]}18`, color: difficultyColors[difficulty] }}>
                {difficulty}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                Question {current + 1} of {qList.length}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#6b7280' }}>
              <HiOutlineClock /> No time limit
            </div>
          </div>

          <div className="progress-bar-track" style={{ marginBottom: 24 }}>
            <div className="progress-bar-fill" style={{ width: `${((current + 1) / qList.length) * 100}%` }}></div>
          </div>

          {/* Question */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 20, lineHeight: 1.5 }}>
            {question.q}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                style={{
                  padding: '14px 20px',
                  borderRadius: 10,
                  border: `2px solid ${selected === i ? '#4361ee' : '#e5e7eb'}`,
                  background: selected === i ? 'rgba(67,97,238,0.06)' : '#fff',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: selected === i ? 600 : 400,
                  color: selected === i ? '#4361ee' : '#1a1d2e',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: '50%', marginRight: 12, fontSize: '0.78rem', fontWeight: 600,
                  background: selected === i ? '#4361ee' : '#f1f3f9',
                  color: selected === i ? '#fff' : '#6b7280',
                }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button className="btn btn-primary" onClick={handleNext} disabled={selected === null}
              style={{ opacity: selected === null ? 0.5 : 1 }}>
              {current + 1 < qList.length ? 'Next Question →' : 'Finish Test'}
            </button>
          </div>
        </div>
      ) : (
        /* Results */
        <div className="card" style={{ maxWidth: 700, textAlign: 'center', padding: 40 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
            background: score >= qList.length * 0.7 ? 'rgba(6,214,160,0.12)' : 'rgba(255,209,102,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
          }}>
            {score >= qList.length * 0.7 ? '🎉' : '📚'}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
            {score >= qList.length * 0.7 ? 'Great Job!' : 'Keep Learning!'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 20 }}>
            You scored <strong style={{ color: '#4361ee', fontSize: '1.2rem' }}>{score}/{qList.length}</strong> on the {difficulty} level test.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
            {answers.map((a, i) => (
              <div key={i} style={{
                width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: a.selected === a.correct ? 'rgba(6,214,160,0.15)' : 'rgba(239,71,111,0.1)',
                color: a.selected === a.correct ? '#06d6a0' : '#ef476f', fontWeight: 600, fontSize: '0.85rem',
              }}>
                {a.selected === a.correct ? <HiOutlineCheckCircle /> : '✗'}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => reset(difficulty)}>Retry {difficulty}</button>
            <button className="btn btn-primary" onClick={() => reset(difficulty === 'Easy' ? 'Medium' : difficulty === 'Medium' ? 'Hard' : 'Easy')}>
              Try {difficulty === 'Easy' ? 'Medium' : difficulty === 'Medium' ? 'Hard' : 'Easy'} Level
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
