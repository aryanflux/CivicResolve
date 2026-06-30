/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { CommunityReport, Comment, StatusUpdate, Category, Severity, IssueStatus } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry headers as per the gemini-api skill
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Persistent Storage Setup
const DATA_FILE = path.join(process.cwd(), "reports_db.json");

// Initial Seed Data with major Indian municipal hubs
const initialReports: CommunityReport[] = [
  {
    id: "rep-1",
    title: "Major Pothole on Inner Circle",
    category: "Roads",
    severity: "Critical",
    status: "Pending",
    description: "A deep, dangerous pothole has formed on the Connaught Place Inner Circle road right near Block C. It causes vehicle tire damage and severe traffic slowdowns. Needs urgent blacktopping.",
    coordinates: [28.6304, 77.2177], // Connaught Place, Delhi
    locationName: "Connaught Place, Delhi",
    upvotes: 34,
    upvotedBy: ["usr-admin", "usr-2", "usr-3"],
    author: "Aarav Sharma",
    authorId: "usr-2",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    comments: [
      {
        id: "c-1",
        author: "Priya Patel",
        authorId: "usr-3",
        content: "I hit this yesterday, luckily my scooter didn't slip. It is extremely dangerous at night because streetlights are also dim here!",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    statusHistory: [
      {
        id: "sh-1",
        fromStatus: "Pending",
        toStatus: "Pending",
        updatedBy: "System",
        comment: "Issue logged by citizen Aarav Sharma.",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "rep-2",
    title: "Overflowing Garbage Dumpster on Promenade",
    category: "Waste",
    severity: "High",
    status: "In Progress",
    description: "The municipal community dumpster near Marine Drive is overflowing. Garbage is scattered on the walkway attracting stray animals and creating an unhygienic environment for morning walkers.",
    coordinates: [18.9415, 72.8235], // Marine Drive, Mumbai
    locationName: "Marine Drive Promenade, Mumbai",
    upvotes: 21,
    upvotedBy: ["usr-admin", "usr-4"],
    author: "Rohan Mehta",
    authorId: "usr-4",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    comments: [
      {
        id: "c-2",
        author: "Meera Nair",
        authorId: "usr-5",
        content: "Trash collection truck bypassed this bin today. Please dispatch secondary sanitation vehicle immediately.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    statusHistory: [
      {
        id: "sh-2",
        fromStatus: "Pending",
        toStatus: "In Progress",
        updatedBy: "Ward Inspector",
        comment: "Assigned to Ward A sanitation team for clearing and replacement.",
        createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "rep-3",
    title: "Broken Streetlights on 100 Feet Road",
    category: "Lighting",
    severity: "Medium",
    status: "Under Investigation",
    description: "Three consecutive high-mast street lamps are non-functional on 100 Feet Road near Indiranagar. Makes the service lane pitch dark after 7 PM, presenting safety risks for pedestrians.",
    coordinates: [12.9719, 77.6412], // Indiranagar, Bengaluru
    locationName: "Indiranagar 100 Feet Road, Bengaluru",
    upvotes: 15,
    upvotedBy: ["usr-6"],
    author: "Karthik Gowda",
    authorId: "usr-6",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    comments: [],
    statusHistory: [
      {
        id: "sh-3",
        fromStatus: "Pending",
        toStatus: "Under Investigation",
        updatedBy: "BESCOM Engineer",
        comment: "Testing transformer load and checking for cable cuts in the Indiranagar grid.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "rep-4",
    title: "Severe Water Logging near Metro Station",
    category: "Water",
    severity: "Critical",
    status: "Resolved",
    description: "Water logging reaching up to 1.5 feet outside the Salt Lake Sector V metro station entrance due to pre-monsoon showers and blocked storm drains. High crowd distress.",
    coordinates: [22.5735, 88.4331], // Sector V, Kolkata
    locationName: "Sector V Metro Gate 2, Kolkata",
    upvotes: 45,
    upvotedBy: ["usr-admin", "usr-2", "usr-3", "usr-4", "usr-5", "usr-6", "usr-7"],
    author: "Ananya Roy",
    authorId: "usr-7",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    comments: [
      {
        id: "c-3",
        author: "Dev Sengupta",
        authorId: "usr-8",
        content: "Municipality brought a pump to drain the water. Works much better now!",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    statusHistory: [
      {
        id: "sh-4",
        fromStatus: "Pending",
        toStatus: "In Progress",
        updatedBy: "NDITA Engineer",
        comment: "Dispatched high-capacity suction pumps and deployed 4 field workmen.",
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "sh-5",
        fromStatus: "In Progress",
        toStatus: "Resolved",
        updatedBy: "NDITA Admin",
        comment: "Drains cleared and permanent pipe sizing upgraded. De-watered completely.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "rep-5",
    title: "Water Pipeline Leakage near Mylapore Tank",
    category: "Water",
    severity: "Medium",
    status: "Pending",
    description: "Water has been bubbling up from under the sidewalk near the temple tank road. Hundreds of liters of clean drinking water are being wasted daily. Needs immediate plumbing attention.",
    coordinates: [13.0330, 80.2690], // Mylapore, Chennai
    locationName: "Mylapore Tank Road, Chennai",
    upvotes: 12,
    upvotedBy: [],
    author: "Sridhar Rajan",
    authorId: "usr-9",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    comments: [],
    statusHistory: [
      {
        id: "sh-6",
        fromStatus: "Pending",
        toStatus: "Pending",
        updatedBy: "System",
        comment: "Issue logged by citizen Sridhar Rajan.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

// Read from JSON file DB or seed if empty
function loadReports(): CommunityReport[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Failed to load reports, fallback to initial reports", error);
  }
  
  // Seed initial data
  saveReports(initialReports);
  return initialReports;
}

function saveReports(reports: CommunityReport[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save reports", error);
  }
}

// REST API Endpoints

// Get all reports
app.get("/api/reports", (req, res) => {
  const reports = loadReports();
  res.json(reports);
});

// Create new report
app.post("/api/reports", (req, res) => {
  const { title, category, severity, description, coordinates, locationName, author, authorId } = req.body;
  
  if (!title || !category || !severity || !description || !coordinates || !locationName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const reports = loadReports();
  
  const newReport: CommunityReport = {
    id: `rep-${Date.now()}`,
    title,
    category: category as Category,
    severity: severity as Severity,
    status: "Pending",
    description,
    coordinates: coordinates as [number, number],
    locationName,
    upvotes: 0,
    upvotedBy: [],
    author: author || "Anonymous Citizen",
    authorId: authorId || `usr-${Date.now()}`,
    createdAt: new Date().toISOString(),
    comments: [],
    statusHistory: [
      {
        id: `sh-${Date.now()}`,
        fromStatus: "Pending",
        toStatus: "Pending",
        updatedBy: "System",
        comment: "Issue successfully registered in Civic registry.",
        createdAt: new Date().toISOString()
      }
    ]
  };

  reports.unshift(newReport);
  saveReports(reports);
  res.status(201).json(newReport);
});

// Toggle upvote on a report
app.post("/api/reports/:id/upvote", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const reports = loadReports();
  const reportIndex = reports.findIndex((r) => r.id === id);

  if (reportIndex === -1) {
    return res.status(404).json({ error: "Report not found" });
  }

  const report = reports[reportIndex];
  const upvotedIndex = report.upvotedBy.indexOf(userId);

  if (upvotedIndex > -1) {
    // Already upvoted, remove upvote (toggle)
    report.upvotedBy.splice(upvotedIndex, 1);
    report.upvotes = Math.max(0, report.upvotes - 1);
  } else {
    // Add upvote
    report.upvotedBy.push(userId);
    report.upvotes += 1;
  }

  reports[reportIndex] = report;
  saveReports(reports);
  res.json({ upvotes: report.upvotes, upvotedBy: report.upvotedBy });
});

// Post comment to a report
app.post("/api/reports/:id/comments", (req, res) => {
  const { id } = req.params;
  const { author, authorId, content, coordinates } = req.body;

  if (!content || !author || !authorId) {
    return res.status(400).json({ error: "Missing required fields for comment" });
  }

  const reports = loadReports();
  const reportIndex = reports.findIndex((r) => r.id === id);

  if (reportIndex === -1) {
    return res.status(404).json({ error: "Report not found" });
  }

  const report = reports[reportIndex];
  const newComment: Comment = {
    id: `c-${Date.now()}`,
    author,
    authorId,
    content,
    createdAt: new Date().toISOString(),
    coordinates: coordinates // optional verification pin coordinates
  };

  report.comments.push(newComment);
  reports[reportIndex] = report;
  saveReports(reports);
  res.status(201).json(newComment);
});

// Update status of a report (Administrative or Neighbor-verified Resolution)
app.patch("/api/reports/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, comment, updatedBy } = req.body;

  if (!status || !updatedBy) {
    return res.status(400).json({ error: "Missing required status or updatedBy field" });
  }

  const reports = loadReports();
  const reportIndex = reports.findIndex((r) => r.id === id);

  if (reportIndex === -1) {
    return res.status(404).json({ error: "Report not found" });
  }

  const report = reports[reportIndex];
  const oldStatus = report.status;
  report.status = status as IssueStatus;
  
  if (status === "Resolved") {
    report.resolvedAt = new Date().toISOString();
  } else {
    delete report.resolvedAt;
  }

  const historyEntry: StatusUpdate = {
    id: `sh-${Date.now()}`,
    fromStatus: oldStatus,
    toStatus: status as IssueStatus,
    updatedBy,
    comment: comment || `Status updated from ${oldStatus} to ${status}.`,
    createdAt: new Date().toISOString()
  };

  report.statusHistory.push(historyEntry);
  reports[reportIndex] = report;
  saveReports(reports);
  res.json(report);
});

// Server-side Gemini chat endpoint using modern @google/genai SDK
app.post("/api/gemini/chat", async (req, res) => {
  const { prompt, chatHistory } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  if (!ai) {
    return res.status(503).json({
      error: "Gemini AI is currently not configured. Please add a valid GEMINI_API_KEY in Settings > Secrets."
    });
  }

  try {
    const systemInstruction = `You are CivicAssist, an expert community liaison, urban planner, and municipal intelligence AI. 
Help citizens:
1. Draft petitions, official complaint letters, or formal public welfare proposals to city departments (like Municipal Corporation of Delhi, BMC, BBMP, etc.).
2. Understand municipal bylaws, civic ordinances, right to information (RTI) processes, and public grievance mechanisms.
3. Learn best practices for neighborhood garbage management, solar installation, composting, rainwater harvesting, and pothole prevention.
4. Give actionable advice on how to rally community backing to solve local issues.

Maintain a polite, extremely helpful, professional, and citizen-empowering tone. Format responses beautifully in detailed markdown (using headers, bold terms, bullet points, and code blocks for letter/petition templates).`;

    // Map client chat history to the format expected by the generateContent or Chat SDK
    // Let's use simple chats.create from the gemini-api skill:
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    // Seed previous history if provided
    if (chatHistory && Array.isArray(chatHistory)) {
      // Re-populate the chat object history
      const history = chatHistory.map((item: { role: string; content: string }) => {
        return {
          role: item.role === "assistant" ? "model" : "user",
          parts: [{ text: item.content }]
        };
      });
      // Set the internal history
      (chat as any)._history = history;
    }

    const response = await chat.sendMessage({ message: prompt });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "An error occurred with Gemini AI service" });
  }
});

// Vite Middleware & Static asset serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in Development Mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in Production Mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started and running on http://localhost:${PORT}`);
  });
}

startServer();
