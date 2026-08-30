import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Play, 
  Sparkles, 
  Sliders, 
  Layers, 
  TrendingUp, 
  ShieldAlert, 
  Cpu, 
  RotateCw 
} from 'lucide-react';
import { listMLModels, runMLModel } from '../../services/api';
import { ForecastView } from './ForecastView';
import { AnomalyView } from './AnomalyView';
import { DriverAnalysisView } from './DriverAnalysisView';

export function MLModelRunner() {
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('bqml-time-series-forecast');
  const [params, setParams] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const data = await listMLModels();
      setModels(data.models || []);
      if (data.models && data.models.length > 0) {
        const defaultModel = data.models[0];
        setSelectedModelId(defaultModel.id);
        initParams(defaultModel);
      }
    } catch (err) {
      console.warn('Could not load ML models:', err);
    }
  };

  const initParams = (model) => {
    const initial = {};
    if (model.parameters) {
      model.parameters.forEach(p => {
        initial[p.name] = p.default;
      });
    }
    setParams(initial);
  };

  const handleSelectModel = (modelId) => {
    setSelectedModelId(modelId);
    const model = models.find(m => m.id === modelId);
    if (model) initParams(model);
    setResult(null);
  };

  const handleExecute = async () => {
    setIsLoading(true);
    try {
      const res = await runMLModel(selectedModelId, params);
      setResult(res);
    } catch (err) {
      alert(`Model execution error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedModel = models.find(m => m.id === selectedModelId);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 border border-blue-800/40 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <BrainCircuit className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Google Cloud ML Studio</span>
          </div>
          <h2 className="text-xl font-extrabold text-zinc-50">
            BigQuery ML & Vertex AI Execution Workbench
          </h2>
          <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
            Execute enterprise ML models directly against GCP data. Perform time-series forecasting, automated anomaly detection, key driver analysis, and custom endpoint inference.
          </p>
        </div>

        <button
          onClick={handleExecute}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          {isLoading ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Executing Model on GCP...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Selected Model</span>
            </>
          )}
        </button>
      </div>

      {/* Model Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {models.map((m) => {
          const isSelected = m.id === selectedModelId;
          return (
            <div
              key={m.id}
              onClick={() => handleSelectModel(m.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-white dark:bg-[#0c0c0f] border-blue-500 shadow-md ring-1 ring-blue-500'
                  : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {m.engine.split(' ')[0]}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>

              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                {m.name}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                {m.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Parameter Configuration Drawer */}
      {selectedModel && selectedModel.parameters && (
        <div className="p-4 rounded-xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            <Sliders className="w-3.5 h-3.5 text-blue-500" />
            <span>Model Execution Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {selectedModel.parameters.map((p) => (
              <div key={p.name} className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-500 block">
                  {p.label}
                </label>
                
                {p.options ? (
                  <select
                    value={params[p.name] ?? p.default}
                    onChange={(e) => setParams({ ...params, [p.name]: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {p.options.map(opt => <option key={opt} value={opt}>{opt * 100}% Confidence</option>)}
                  </select>
                ) : (
                  <input
                    type={p.type === 'int' || p.type === 'float' ? 'number' : 'text'}
                    value={params[p.name] ?? p.default}
                    step={p.type === 'float' ? '0.01' : '1'}
                    min={p.min}
                    max={p.max}
                    onChange={(e) => setParams({ ...params, [p.name]: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Output Visualizer */}
      {result && (
        <div className="pt-2">
          {result.type === 'forecasting' && <ForecastView result={result} />}
          {result.type === 'anomaly_detection' && <AnomalyView result={result} />}
          {result.type === 'driver_analysis' && <DriverAnalysisView result={result} />}
          {result.type === 'regression_inference' && (
            <div className="p-5 rounded-xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 space-y-4">
              <h4 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Vertex AI LTV Prediction Output</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <span className="text-xs text-zinc-500 block">Predicted 12M LTV</span>
                  <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">{result.prediction.predicted_12m_ltv}</span>
                </div>
                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs text-zinc-500 block">Assigned Tier</span>
                  <span className="text-xl font-bold text-zinc-800 dark:text-zinc-200">{result.prediction.customer_tier}</span>
                </div>
                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs text-zinc-500 block">Variance Confidence</span>
                  <span className="text-xl font-bold font-mono text-amber-500">{result.prediction.variance_confidence || "98.5%"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !isLoading && (
        <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
          <BrainCircuit className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Ready to execute model</h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Click "Run Selected Model" to trigger model inference and visualize confidence bands, anomaly markers, or causal drivers.
          </p>
        </div>
      )}

    </div>
  );
}
