import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import admin from 'firebase-admin';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'skillbridge_secret';

// ---- Firebase Admin Setup ----
let db = null;
try {
  // Check local path first, then Render's secret file path (/etc/secrets/)
  const localPath = './firebase-service-account.json';
  const renderPath = '/etc/secrets/firebase-service-account.json';
  const serviceAccountPath = fs.existsSync(localPath) ? localPath : fs.existsSync(renderPath) ? renderPath : null;

  if (serviceAccountPath) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('✅ Firebase Admin SDK initialized successfully with Firestore');
  } else {
    console.warn('⚠️ WARNING: firebase-service-account.json not found!');
    console.warn('⚠️ Please add it locally or as a Render Secret File at /etc/secrets/firebase-service-account.json');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error.message);
}

// Helper to check if DB is ready
const checkDb = (req, res, next) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not configured. Please add firebase-service-account.json' });
  }
  next();
};

// ---- Gemini AI Setup ----
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// ---- Auth Middleware ----
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ===================== HEALTH CHECK =====================
app.get('/health', async (req, res) => {
  if (!db) return res.status(500).json({ status: 'error', message: 'Firebase not initialized' });
  try {
    await db.collection('users').limit(1).get();
    res.json({ status: 'ok', firebase: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', firebase: err.message });
  }
});

// ===================== AUTH ROUTES =====================

// Register
app.post('/api/auth/register', checkDb, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if email exists
    const usersRef = db.collection('users');
    const q = await usersRef.where('email', '==', email).limit(1).get();
    if (!q.empty) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const userDoc = usersRef.doc();
    const user = { id: userDoc.id, name, email, password: hashed, createdAt: admin.firestore.FieldValue.serverTimestamp() };
    
    await userDoc.set(user);
    
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', checkDb, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const usersRef = db.collection('users');
    const q = await usersRef.where('email', '==', email).limit(1).get();
    
    if (q.empty) return res.status(400).json({ error: 'Invalid credentials' });
    
    const user = q.docs[0].data();
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================== ONBOARDING + GEMINI =====================

// Save onboarding profile and get Gemini gap analysis
app.post('/api/onboarding/analyze', [authMiddleware, checkDb], async (req, res) => {
  try {
    const {
      education,
      skills,
      certifications,
      technicalKnowledge,
      pastExperiences,
      interestedRole,
      knownSkillsForRole,
    } = req.body;

    // Build prompt for Gemini
    const prompt = `You are an expert career counselor and industry analyst. A user has provided their profile and wants to know the gap between their current skills and the requirements for their dream job role.

## User Profile:
- **Educational Background:** ${education}
- **Current Skills:** ${skills}
- **Certifications Completed:** ${certifications}
- **Technical Knowledge:** ${technicalKnowledge}
- **Past Experiences:** ${pastExperiences}
- **Interested Job Role:** ${interestedRole}
- **Skills Already Known Related to This Role:** ${knownSkillsForRole}

## Your Task:
Provide a comprehensive JSON response with the following structure (respond ONLY with valid JSON, no markdown):
{
  "gapAnalysisReport": {
    "overallReadiness": "<percentage 0-100>",
    "summary": "<2-3 sentence summary of where the user stands>",
    "strengths": ["<strength 1>", "<strength 2>", ...],
    "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
    "keyGaps": ["<gap 1>", "<gap 2>", ...]
  },
  "requiredSkills": [
    {
      "skill": "<skill name>",
      "category": "<Technical/Soft/Tool>",
      "importance": "<Critical/Important/Nice to Have>",
      "userHasIt": <true/false>,
      "description": "<why this skill matters>"
    }
  ],
  "requiredCertifications": [
    {
      "name": "<certification name>",
      "provider": "<issuing organization>",
      "importance": "<Critical/Recommended/Optional>",
      "userHasIt": <true/false>
    }
  ],
  "recommendedCourses": [
    {
      "title": "<course title>",
      "platform": "<Coursera/Udemy/edX/etc>",
      "skill": "<which skill it addresses>",
      "level": "<Beginner/Intermediate/Advanced>",
      "estimatedDuration": "<e.g., 4 weeks>"
    }
  ],
  "learningRoadmap": [
    {
      "phase": <number>,
      "title": "<phase title>",
      "duration": "<estimated duration>",
      "items": ["<learning item 1>", "<learning item 2>"]
    }
  ],
  "jobMarketInsights": {
    "demandLevel": "<High/Medium/Low>",
    "averageSalary": "<salary range>",
    "topCompanies": ["<company 1>", "<company 2>"],
    "growthOutlook": "<description>"
  }
}

Be realistic, specific, and base your analysis on current real-world industry requirements for the "${interestedRole}" role. Include at least 8-10 required skills, 3-5 certifications, and 5-8 courses.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(responseText);
      }
    } catch (parseErr) {
      analysis = { rawResponse: responseText, parseError: true };
    }

    // Store the profile in Firestore
    const profileData = {
      userId: req.userId,
      education, skills, certifications, technicalKnowledge,
      pastExperiences, interestedRole, knownSkillsForRole,
      analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
      analysis: analysis
    };
    
    await db.collection('profiles').doc(req.userId).set(profileData, { merge: true });

    res.json({ success: true, analysis });
  } catch (err) {
    console.error('Gemini/Firebase error:', err);
    res.status(500).json({ error: 'Failed to analyze profile or save to database.' });
  }
});

// Get user profile and analysis
app.get('/api/profile', [authMiddleware, checkDb], async (req, res) => {
  try {
    const doc = await db.collection('profiles').doc(req.userId).get();
    if (!doc.exists) {
      return res.json({ profile: null });
    }
    res.json({ profile: doc.data() });
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// Save skill self-assessment (after analysis)
app.post('/api/skills/assess', [authMiddleware, checkDb], async (req, res) => {
  try {
    const { skillAssessment } = req.body; // { skillName: true/false, ... }
    
    const docRef = db.collection('profiles').doc(req.userId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(400).json({ error: 'Complete onboarding first' });
    }
    
    await docRef.update({
      skillAssessment: skillAssessment,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Skill assessment error:', err);
    res.status(500).json({ error: 'Server error saving assessment' });
  }
});

// AI Chat endpoint
app.post('/api/chat', [authMiddleware, checkDb], async (req, res) => {
  try {
    const { message } = req.body;
    
    const doc = await db.collection('profiles').doc(req.userId).get();
    const profile = doc.exists ? doc.data() : null;
    
    const context = profile
      ? `The user is interested in becoming a ${profile.interestedRole}. Their background: ${profile.education}. Known skills: ${profile.skills}.`
      : 'The user has not completed their profile yet.';

    const prompt = `You are an AI career assistant for Skill Bridge platform. ${context}

User asks: "${message}"

Respond helpfully, concisely, and specifically about career guidance, skills, and learning paths. Keep response under 200 words.`;

    const result = await model.generateContent(prompt);
    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'AI chat failed' });
  }
});

// ===================== CAREER TRAINER =====================

// Generate AI roadmap based on target company/role and user profile
app.post('/api/career-trainer/generate', [authMiddleware, checkDb], async (req, res) => {
  try {
    const {
      targetCompany,
      targetRole,
      skillLevel,
      linkedInUrl,
      currentSkills,
      experience,
      education,
      certifications,
      projects,
    } = req.body;

    const prompt = `You are an expert career coach and technical hiring manager. A user wants to get a job as "${targetRole}" at "${targetCompany}".

## User Profile:
- **Current Skills:** ${currentSkills || 'Not specified'}
- **Experience:** ${experience || 'Not specified'}
- **Education:** ${education || 'Not specified'}
- **Certifications:** ${certifications || 'None'}
- **Projects:** ${projects || 'None'}
- **Skill Level:** ${skillLevel}
- **LinkedIn URL:** ${linkedInUrl || 'Not provided'}

## Your Task:
Generate a comprehensive career preparation plan. Respond ONLY with valid JSON (no markdown, no code blocks), structured exactly as:
{
  "skillGapAnalysis": {
    "overallReadiness": <number 0-100>,
    "summary": "<2-3 sentence assessment>",
    "skillsUserHas": ["<skill>", ...],
    "skillsToLearn": ["<skill>", ...],
    "missingCriticalSkills": ["<skill>", ...]
  },
  "roadmap": [
    {
      "phase": 1,
      "title": "Fundamentals",
      "duration": "<e.g. 2 weeks>",
      "description": "<brief description>",
      "courses": [{"name": "<name>", "platform": "<platform>", "url": "<optional url>", "duration": "<e.g. 10 hours>"}],
      "projects": [{"name": "<project name>", "description": "<what to build>"}],
      "practiceProblems": ["<problem/topic>"],
      "interviewQuestions": ["<question>"]
    },
    {
      "phase": 2,
      "title": "Core Technical Skills",
      "duration": "<duration>",
      "description": "<brief description>",
      "courses": [{"name": "<name>", "platform": "<platform>", "url": "", "duration": ""}],
      "projects": [{"name": "<name>", "description": "<desc>"}],
      "practiceProblems": ["<topic>"],
      "interviewQuestions": ["<question>"]
    },
    {
      "phase": 3,
      "title": "Advanced Topics",
      "duration": "<duration>",
      "description": "<brief description>",
      "courses": [{"name": "<name>", "platform": "<platform>", "url": "", "duration": ""}],
      "projects": [{"name": "<name>", "description": "<desc>"}],
      "practiceProblems": ["<topic>"],
      "interviewQuestions": ["<question>"]
    },
    {
      "phase": 4,
      "title": "${targetCompany}-Specific Interview Prep",
      "duration": "<duration>",
      "description": "<brief description>",
      "courses": [{"name": "<name>", "platform": "<platform>", "url": "", "duration": ""}],
      "projects": [{"name": "<name>", "description": "<desc>"}],
      "practiceProblems": ["<topic>"],
      "interviewQuestions": ["<real ${targetCompany} interview question>"]
    },
    {
      "phase": 5,
      "title": "Mock Interviews & Final Practice",
      "duration": "<duration>",
      "description": "<brief description>",
      "courses": [{"name": "<name>", "platform": "<platform>", "url": "", "duration": ""}],
      "projects": [{"name": "<name>", "description": "<desc>"}],
      "practiceProblems": ["<topic>"],
      "interviewQuestions": ["<behavioral/system design question>"]
    }
  ],
  "resumeTips": [
    "<specific resume improvement tip based on user's background and ${targetRole} at ${targetCompany}>"
  ],
  "totalTimeline": "<total estimated weeks/months to be job-ready>",
  "companyCulture": "<2-3 sentences on ${targetCompany}'s culture and what they look for>"
}

Be specific to ${targetCompany} and ${targetRole}. Include real course names from Coursera/Udemy/LeetCode/YouTube. Include at least 3-4 courses per phase, 2-3 projects per phase, 4-5 practice topics, 3-4 interview questions per phase. Make the advice actionable and realistic.`;

    // Retry up to 3 times for 429 rate-limit errors
    let responseText;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        break; // success
      } catch (aiErr) {
        const is429 = aiErr?.status === 429 || aiErr?.message?.includes('429') || aiErr?.message?.includes('Too Many Requests');
        if (is429 && attempt < 3) {
          const waitMs = attempt * 30000; // 30s, 60s
          console.log(`⏳ Gemini 429 rate limit hit. Retrying in ${waitMs / 1000}s (attempt ${attempt}/3)...`);
          await new Promise(r => setTimeout(r, waitMs));
        } else if (is429) {
          return res.status(429).json({ error: 'The AI service is temporarily busy due to high demand. Please wait 1-2 minutes and try again.' });
        } else {
          throw aiErr;
        }
      }
    }

    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    } catch {
      return res.status(500).json({ error: 'AI returned invalid JSON. Please try again.' });
    }

    // Auto-save to Firestore
    await db.collection('careerTrainer').doc(req.userId).set({
      userId: req.userId,
      targetCompany,
      targetRole,
      skillLevel,
      linkedInUrl: linkedInUrl || '',
      currentSkills,
      experience,
      education,
      certifications,
      projects,
      analysis,
      progress: {},
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, analysis });
  } catch (err) {
    console.error('Career trainer generate error:', err);
    res.status(500).json({ error: 'Failed to generate roadmap.' });
  }
});

// Get saved career trainer data
app.get('/api/career-trainer/progress', [authMiddleware, checkDb], async (req, res) => {
  try {
    const doc = await db.collection('careerTrainer').doc(req.userId).get();
    if (!doc.exists) return res.json({ data: null });
    res.json({ data: doc.data() });
  } catch (err) {
    console.error('Career trainer fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch career trainer data.' });
  }
});

// Update progress (checked items)
app.post('/api/career-trainer/progress', [authMiddleware, checkDb], async (req, res) => {
  try {
    const { progress } = req.body; // { 'phase1-course-0': true, 'phase2-project-1': true, ... }
    await db.collection('careerTrainer').doc(req.userId).update({
      progress,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Career trainer progress update error:', err);
    res.status(500).json({ error: 'Failed to update progress.' });
  }
});

// ===================== START SERVER =====================
app.listen(PORT, () => {
  console.log(`\n🚀 Skill Bridge Backend running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints ready\n`);
  if (!db) {
    console.log(`⚠️  NOTE: Database is NOT connected. APIs will return 500 until firebase-service-account.json is added.`);
  }
});
