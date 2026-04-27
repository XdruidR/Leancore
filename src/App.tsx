/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { Check, Sparkles, BrainCircuit, FileSearch, X, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

const ALL_PHASES = ['DEFINE', 'MEASURE', 'ANALYZE', 'IMPROVE', 'CONTROL'];

export default function App() {
  const [activePhase, setActivePhase] = useState('MEASURE');
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Develop Data Collection Plan', desc: 'Identify sources, frequency, and owners for site inspection logs.', done: true },
    { id: 2, title: 'Validate Measurement System', desc: 'Perform Gauge R&R on digital level sensors.', done: false },
    { id: 3, title: 'Calculate Sigma Baseline', desc: 'Determine process capability based on last 30 days of data.', done: false },
    { id: 4, title: 'Update Process Map', desc: 'Refine the high-level SIPOC with granular site activities.', done: false },
  ]);

  const [artifacts, setArtifacts] = useState([
    { title: 'SIPOC_Diagram.pdf', desc: 'Uploaded by J. Doe • Define Phase', action: 'VIEW' },
    { title: 'Site_Inspection_Logs_V2.xlsx', desc: 'Auto-synced from FIELD_APP', action: 'OPEN' },
    { title: 'Project_Charter_Signed.docx', desc: 'Approval from Stakeholder', action: 'VIEW' },
  ]);

  const KPIs = {
    defectRate: "4.8% (↑ 0.4% vs Target)",
    cycleTime: "18d (↓ 2d improvement)",
    materialWaste: "12.4t (Within range)",
    compliance: "94% (Stable)"
  };

  // AI State
  const [isSuggestingPhase, setIsSuggestingPhase] = useState(false);
  const [phaseSuggestions, setPhaseSuggestions] = useState<{title: string, desc: string}[] | null>(null);

  const [isSuggestingVault, setIsSuggestingVault] = useState(false);
  const [vaultSuggestions, setVaultSuggestions] = useState<{type: string, title: string, description: string, recommendedPhase: string}[] | null>(null);

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [statusSummary, setStatusSummary] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const advancePhase = () => {
    const currentIndex = ALL_PHASES.indexOf(activePhase);
    if (currentIndex < ALL_PHASES.length - 1) {
      setActivePhase(ALL_PHASES[currentIndex + 1]);
      setPhaseSuggestions(null); // Clear phase suggestions
    }
  };

  const phaseIndex = ALL_PHASES.indexOf(activePhase);

  // --- AI API Calls ---
  const handlePhaseSuggestions = async () => {
    setIsSuggestingPhase(true);
    setPhaseSuggestions(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a Lean Six Sigma expert. The user is managing a construction quality project called "Riverfront Tower QC".
Current Phase: ${activePhase}
Tasks: ${JSON.stringify(tasks)}
KPIs: ${JSON.stringify(KPIs)}
Artifacts: ${JSON.stringify(artifacts)}

Provide 3-5 concrete, realistic suggestions for what else the team should consider doing in the ${activePhase} phase. 
Consider potential risks, follow-up analyses, or missing information.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                desc: { type: Type.STRING }
              },
              required: ["title", "desc"]
            }
          }
        }
      });
      
      const text = response.text || "[]";
      setPhaseSuggestions(JSON.parse(text.trim()));
    } catch (err) {
      console.error(err);
      setPhaseSuggestions([{title: "Error", desc: "Failed to generate suggestions. Please check your API key and connection."}]);
    } finally {
      setIsSuggestingPhase(false);
    }
  };

  const handleVaultSuggestions = async () => {
    setIsSuggestingVault(true);
    setVaultSuggestions(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a Lean Six Sigma expert. Project "Riverfront Tower QC".
Current Phase: ${activePhase}
KPIs: ${JSON.stringify(KPIs)}
Existing Artifacts: ${JSON.stringify(artifacts)}

Suggest 2-3 critical missing artifacts (datasets, documents, SOPs) that should be added to the project vault to better manage construction quality at this stage.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "e.g., Document, Data Set, Diagram" },
                title: { type: Type.STRING, description: "Name of the artifact" },
                description: { type: Type.STRING, description: "Why it is needed" },
                recommendedPhase: { type: Type.STRING, description: "Which phase this belongs to" }
              },
              required: ["type", "title", "description", "recommendedPhase"]
            }
          }
        }
      });
      
      const text = response.text || "[]";
      setVaultSuggestions(JSON.parse(text.trim()));
    } catch (err) {
      console.error(err);
      setVaultSuggestions([{type: "Error", title: "Could not fetch", description: "Failed to load suggestions.", recommendedPhase: "N/A"}]);
    } finally {
      setIsSuggestingVault(false);
    }
  };

  const handleStatusSummary = async () => {
    setShowStatusModal(true);
    if (statusSummary) return;

    setIsSummarizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a Lean Six Sigma expert. Provide a concise project status summary for "Riverfront Tower QC". 
Format the response as plain text with line breaks and unicode bullet characters (•). Do NOT use Markdown formatting (no asterisks, no bolding, no italics).

Context:
- Project: Riverfront Tower QC
- Phase: ${activePhase}
- Tasks Completion: ${tasks.filter(t => t.done).length}/${tasks.length} complete
- KPIs: ${JSON.stringify(KPIs)}
- Artifacts: ${artifacts.map(a => a.title).join(', ')}

Please structure as:
CURRENT STATUS & PROGRESS
(Brief summary paragraph)

KEY FINDINGS & ISSUES
(Bulleted list)

RECOMMENDED NEXT STEPS
(Bulleted list)`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      setStatusSummary(response.text || "Failed to generate summary.");
    } catch (err) {
      console.error(err);
      setStatusSummary("Error generating summary. Please check your API configuration.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 font-sans flex flex-col">
      {/* Header */}
      <header className="h-[72px] bg-white border-b-2 border-black flex items-center justify-between px-4 sm:px-6 shrink-0 w-full z-10 sticky top-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <span className="font-black text-lg sm:text-xl tracking-tight">LEANCORE_</span>
            <span className="text-zinc-500 text-xs sm:text-sm ml-2 sm:ml-3 hidden sm:inline">Project: Riverfront Tower QC</span>
          </div>
          <button 
            onClick={handleStatusSummary}
            className="ml-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 py-1.5 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Status Summary</span>
            <span className="sm:hidden">Summary</span>
          </button>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-[10px] sm:text-xs text-right hidden lg:block">
            <div className="font-bold">Template: Construction Quality</div>
            <div className="text-zinc-500">Last updated: Just now</div>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-200 border-2 border-black rounded-full shrink-0 flex items-center justify-center font-bold text-xs">
            JD
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-5 flex flex-col xl:grid xl:grid-cols-12 xl:grid-rows-[auto_1fr_1fr] gap-4">
        
        {/* Timeline */}
        <div className="xl:col-span-12 xl:row-span-1 flex flex-wrap lg:flex-nowrap gap-2 items-center shrink-0 w-full">
          {ALL_PHASES.map((phase, idx) => {
            const isCompleted = idx < phaseIndex;
            const isActive = idx === phaseIndex;
            
            let phaseClasses = "flex-1 min-h-10 min-w-[80px] sm:min-w-[100px] flex items-center justify-center border-2 border-black rounded-md text-[10px] sm:text-[11px] font-bold px-2 py-1 transition-colors cursor-pointer ";
            
            if (isCompleted) {
              phaseClasses += "bg-slate-200 text-slate-400 line-through hover:bg-slate-300";
            } else if (isActive) {
              phaseClasses += "bg-black text-white";
            } else {
              phaseClasses += "bg-white text-zinc-950 hover:bg-zinc-50";
            }

            return (
              <button 
                key={phase}
                onClick={() => {
                  setActivePhase(phase);
                  setPhaseSuggestions(null);
                }}
                className={phaseClasses}
              >
                {phase}
              </button>
            );
          })}
        </div>

        {/* Main Work Card */}
        <div className="xl:col-span-7 xl:row-span-2 bg-white border-2 border-black rounded-xl p-4 sm:p-5 flex flex-col relative min-h-[400px] shadow-sm">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-3 text-zinc-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Phase Execution: {activePhase}
          </div>
          
          <div className="flex justify-between items-start gap-4 mb-2 sm:mb-4">
            <div>
              <h2 className="m-0 text-xl sm:text-2xl font-bold">Data Collection & Baseline</h2>
              <p className="text-zinc-600 text-xs sm:text-sm mt-1 sm:mt-2">
                Gather current state performance metrics to establish a statistical baseline for the defect rate in concrete pouring.
              </p>
            </div>
            <button 
              onClick={handlePhaseSuggestions}
              disabled={isSuggestingPhase}
              className="shrink-0 bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 text-yellow-800 py-2 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isSuggestingPhase ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSuggestingPhase ? 'Analyzing...' : 'AI Suggestions'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pb-4 space-y-1">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 py-3 border-b border-zinc-100 group">
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`w-5 h-5 border-2 border-black rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 ${task.done ? 'bg-black' : 'bg-white hover:bg-zinc-100'}`}
                >
                  {task.done && <Check className="w-3 h-3 text-white stroke-[3]"/>}
                </button>
                <div 
                  className="flex-1 cursor-pointer" 
                  onClick={() => toggleTask(task.id)}
                >
                  <div className={`font-semibold text-sm transition-colors ${task.done ? 'text-zinc-400 line-through' : 'text-zinc-900 group-hover:text-black'}`}>
                    {task.title}
                  </div>
                  <div className={`text-xs mt-0.5 ${task.done ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {task.desc}
                  </div>
                </div>
              </div>
            ))}

            {/* AI Phase Suggestions Render */}
            {phaseSuggestions && phaseSuggestions.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50/50 border border-yellow-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <h4 className="text-sm font-bold text-yellow-900 flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-yellow-600" /> AI Suggestions for {activePhase}
                </h4>
                <ul className="space-y-3">
                  {phaseSuggestions.map((sug, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-semibold text-zinc-900">{sug.title}: </span>
                      <span className="text-zinc-700">{sug.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button 
            onClick={advancePhase}
            disabled={phaseIndex === ALL_PHASES.length - 1}
            className="bg-black text-white border-none py-2.5 px-4 rounded-md font-semibold text-sm cursor-pointer mt-4 shrink-0 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
          >
            {phaseIndex === ALL_PHASES.length - 1 ? 'Project Complete' : 'Complete Phase & Advance'}
          </button>
        </div>

        {/* KPI Pulse */}
        <div className="xl:col-span-5 xl:row-span-1 bg-white border-2 border-black rounded-xl p-4 sm:p-5 flex flex-col relative min-h-[250px] shadow-sm">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-3 text-zinc-500 flex items-center gap-2">
            Live KPI Pulse
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-1">
            <div className="border border-zinc-200 p-3 rounded-lg flex flex-col justify-center hover:border-black transition-colors">
              <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Defect Rate</div>
              <div className="text-xl sm:text-2xl font-extrabold my-1 text-red-500">4.8%</div>
              <div className="text-[9px] sm:text-[10px] text-red-500 font-medium flex items-center">
                ↑ 0.4% vs Target
              </div>
            </div>
            <div className="border border-zinc-200 p-3 rounded-lg flex flex-col justify-center hover:border-black transition-colors">
              <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Cycle Time</div>
              <div className="text-xl sm:text-2xl font-extrabold my-1">18d</div>
              <div className="text-[9px] sm:text-[10px] text-green-500 font-medium flex items-center">
                ↓ 2d improvement
              </div>
            </div>
            <div className="border border-zinc-200 p-3 rounded-lg flex flex-col justify-center hover:border-black transition-colors">
              <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Material Waste</div>
              <div className="text-xl sm:text-2xl font-extrabold my-1">12.4t</div>
              <div className="text-[9px] sm:text-[10px] text-zinc-500 font-medium">Within range</div>
            </div>
            <div className="border border-zinc-200 p-3 rounded-lg flex flex-col justify-center hover:border-black transition-colors">
              <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Compliance</div>
              <div className="text-xl sm:text-2xl font-extrabold my-1">94%</div>
              <div className="text-[9px] sm:text-[10px] text-green-500 font-medium flex items-center">
                Stable
              </div>
            </div>
          </div>
        </div>

        {/* Artifact Vault */}
        <div className="xl:col-span-5 xl:row-span-1 bg-white border-2 border-black rounded-xl p-4 sm:p-5 flex flex-col relative min-h-[250px] shadow-sm">
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2 mt-1">
              Artifact Vault
            </div>
            <button 
              onClick={handleVaultSuggestions}
              disabled={isSuggestingVault}
              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 py-1.5 px-2 rounded font-bold flex items-center gap-1.5 transition-colors text-[10px] sm:text-xs disabled:opacity-50"
            >
              {isSuggestingVault ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSearch className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isSuggestingVault ? 'Scanning...' : 'Suggest Missing'}</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-3 space-y-2 pr-1">
            {artifacts.map((artifact, i) => (
              <div key={i} className="flex items-center justify-between p-2 sm:p-2.5 bg-zinc-50 border border-zinc-200 rounded-md text-xs hover:border-black hover:bg-white shadow-sm transition-all cursor-pointer group">
                <div>
                  <strong className="block text-zinc-900 mb-0.5">{artifact.title}</strong>
                  <span className="text-[9px] sm:text-[10px] text-zinc-500">{artifact.desc}</span>
                </div>
                <div className="font-bold text-zinc-400 group-hover:text-black transition-colors">{artifact.action}</div>
              </div>
            ))}

            {vaultSuggestions && vaultSuggestions.length > 0 && (
              <div className="mt-3 space-y-2 animate-in fade-in duration-300">
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-4 mb-2">AI Suggested Additions</div>
                {vaultSuggestions.map((sug, i) => (
                  <div key={i} className="flex items-start justify-between p-2 sm:p-2.5 bg-blue-50/50 border border-blue-200 border-dashed rounded-md text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded">{sug.type}</span>
                        <strong className="text-zinc-900">{sug.title}</strong>
                      </div>
                      <span className="text-[10px] text-zinc-600 block">{sug.description}</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 font-bold px-2 py-1 bg-white border border-blue-200 rounded text-[10px] uppercase ml-2 shrink-0">Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-auto border-t border-dashed border-zinc-300 pt-3 text-[10px] sm:text-[11px] text-zinc-500 shrink-0 text-center sm:text-left bg-zinc-50/50 p-2 rounded">
            Drag and drop files here to attach to <strong className="text-zinc-700 font-semibold">{activePhase}</strong> phase.
          </div>
        </div>

      </main>

      {/* Status Modal Overlay */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 rounded-t-xl shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <BrainCircuit className="text-indigo-600" /> 
                AI Project Status Summary
              </h3>
              <button 
                onClick={() => setShowStatusModal(false)}
                className="p-1 hover:bg-zinc-200 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-zinc-600" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              {isSummarizing ? (
                <div className="flex flex-col items-center justify-center text-zinc-500 py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="font-medium text-sm">Analyzing DMAIC metrics and tasks...</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm text-zinc-700 leading-relaxed font-sans">
                  {statusSummary}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 shrink-0 flex justify-end rounded-b-xl">
              <button 
                onClick={() => setShowStatusModal(false)}
                className="bg-black text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-zinc-800 transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}