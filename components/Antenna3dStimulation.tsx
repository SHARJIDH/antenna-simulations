import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Radio, Antenna, Waves, Info, PlayCircle, PauseCircle, RefreshCw, Settings, Book, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import MIMO3DVisualization from './MimoVisualization';

const MIMOInteractiveLearning = () => {
  // State management
  const [activeMode, setActiveMode] = useState('intro');
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState('alamouti');
  const [showTooltip, setShowTooltip] = useState({});
  const [antennaConfig, setAntennaConfig] = useState({
    tx: 2,
    rx: 2,
    spacing: 0.5
  });
  const [channelParams, setChannelParams] = useState({
    snr: 20,
    fadingType: 'rayleigh',
    coherenceTime: 100
  });

  // Simulation data states
  const [berData, setBerData] = useState([]);
  const [channelData, setChannelData] = useState([]);
  const [constellationPoints, setConstellationPoints] = useState([]);

  // Generate channel matrix H
  const generateChannelMatrix = () => {
    return Array(antennaConfig.rx).fill(0).map(() => 
      Array(antennaConfig.tx).fill(0).map(() => ({
        magnitude: Math.random(),
        phase: Math.random() * 2 * Math.PI
      }))
    );
  };

  // Alamouti scheme implementation
  const simulateAlamouti = () => {
    const H = generateChannelMatrix();
    const symbols = generateQPSKSymbols(2);
    return processAlamoutiTransmission(H, symbols);
  };

  // V-BLAST implementation
  const simulateVBLAST = () => {
    const H = generateChannelMatrix();
    const symbols = generateQPSKSymbols(antennaConfig.tx);
    return processVBLASTTransmission(H, symbols);
  };

  // QPSK symbol generation
  const generateQPSKSymbols = (count) => {
    const constellation = [
      { i: 1, q: 1 }, { i: -1, q: 1 },
      { i: -1, q: -1 }, { i: 1, q: -1 }
    ];
    return Array(count).fill(0).map(() => 
      constellation[Math.floor(Math.random() * 4)]
    );
  };

  // Educational content components
  const ModuleSelector = () => (
    <div className="flex space-x-4 mb-6">
      {['Introduction', 'SIMO', 'MISO', 'MIMO', 'Alamouti', 'V-BLAST'].map(module => (
        <button
          key={module}
          onClick={() => setActiveMode(module.toLowerCase())}
          className={`px-4 py-2 rounded-lg ${
            activeMode === module.toLowerCase() 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {module}
        </button>
      ))}
    </div>
  );

  // 3D Visualization Component
  const Visualization3D = () => (
    <div className="relative h-96 bg-gray-900 rounded-lg overflow-hidden">
      <MIMO3DVisualization 
      antennaConfig={antennaConfig}
      isSimulating={isSimulating}
    />
      
      {/* Control overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <button 
              className="text-white hover:text-blue-300"
              onClick={() => setIsSimulating(!isSimulating)}
            >
              {isSimulating ? <PauseCircle size={24} /> : <PlayCircle size={24} />}
            </button>
            <button 
              className="text-white hover:text-blue-300"
              onClick={() => resetSimulation()}
            >
              <RefreshCw size={24} />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-white">Speed: </span>
            <input 
              type="range" 
              min="0.1" 
              max="2" 
              step="0.1" 
              className="w-32"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Interactive Learning Components
  const ConceptExplainer = ({ concept }) => (
    <Alert className="mb-4">
      <Info className="h-4 w-4" />
      <AlertTitle>{concept.title}</AlertTitle>
      <AlertDescription>{concept.description}</AlertDescription>
    </Alert>
  );

  // Performance Metrics
  const PerformanceGraphs = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold mb-2">BER vs SNR</h3>
        <LineChart width={400} height={200} data={berData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="snr" label="SNR (dB)" />
          <YAxis type="log" domain={[0.00001, 1]} label="BER" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="alamouti" stroke="#8884d8" name="Alamouti" />
          <Line type="monotone" dataKey="vblast" stroke="#82ca9d" name="V-BLAST" />
        </LineChart>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold mb-2">Constellation Diagram</h3>
        {/* Placeholder for constellation diagram */}
        <div className="h-48 bg-gray-100 rounded flex items-center justify-center">
          Constellation Visualization
        </div>
      </div>
    </div>
  );

  // Interactive Configuration Panel
  const ConfigurationPanel = () => (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">System Configuration</h3>
        <Settings size={20} />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Transmission Scheme
          </label>
          <select 
            className="w-full p-2 border rounded"
            value={selectedScheme}
            onChange={(e) => setSelectedScheme(e.target.value)}
          >
            <option value="alamouti">Alamouti</option>
            <option value="vblast">V-BLAST</option>
            <option value="repetition">Repetition</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Antenna Configuration
          </label>
          <div className="flex space-x-2">
            <input 
              type="number" 
              min="1" 
              max="4"
              value={antennaConfig.tx}
              onChange={(e) => setAntennaConfig({
                ...antennaConfig,
                tx: parseInt(e.target.value)
              })}
              className="w-20 p-2 border rounded"
            />
            <span className="p-2">×</span>
            <input 
              type="number"
              min="1"
              max="4"
              value={antennaConfig.rx}
              onChange={(e) => setAntennaConfig({
                ...antennaConfig,
                rx: parseInt(e.target.value)
              })}
              className="w-20 p-2 border rounded"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Channel Type
          </label>
          <select 
            className="w-full p-2 border rounded"
            value={channelParams.fadingType}
            onChange={(e) => setChannelParams({
              ...channelParams,
              fadingType: e.target.value
            })}
          >
            <option value="rayleigh">Rayleigh Fading</option>
            <option value="rician">Rician Fading</option>
            <option value="awgn">AWGN Only</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Main educational content
  const getEducationalContent = () => {
    const content = {
      intro: {
        title: "Introduction to MIMO Systems",
        description: "MIMO systems use multiple antennas to improve reliability and throughput...",
        concepts: [
          { title: "Spatial Diversity", description: "Multiple antennas create independent paths..." },
          { title: "Spatial Multiplexing", description: "Multiple data streams can be transmitted..." }
        ]
      },
      alamouti: {
        title: "Alamouti Space-Time Code",
        description: "A clever coding scheme that provides full diversity...",
        mathModel: "X = [x1 -x2*; x2 x1*]",
        concepts: [
          { title: "Orthogonal Design", description: "The Alamouti code creates orthogonal channels..." },
          { title: "Maximum Diversity", description: "Achieves full diversity order of 2..." }
        ]
      },
      vblast: {
        title: "V-BLAST Architecture",
        description: "Vertical Bell Labs Layered Space-Time Architecture...",
        concepts: [
          { title: "Spatial Multiplexing", description: "Independent streams are transmitted..." },
          { title: "Successive Interference Cancellation", description: "Signals are detected iteratively..." }
        ]
      }
    };
    
    return content[activeMode] || content.intro;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-4">Interactive MIMO Learning Platform</h1>
          <ModuleSelector />
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left column - 3D Visualization */}
          <div className="col-span-2">
            <Visualization3D />
            <PerformanceGraphs />
          </div>

          {/* Right column - Controls and Education */}
          <div className="space-y-4">
            <ConfigurationPanel />
            
            {/* Educational Content */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">{getEducationalContent().title}</h2>
              <p className="mb-4">{getEducationalContent().description}</p>
              
              {getEducationalContent().concepts.map((concept, index) => (
                <ConceptExplainer key={index} concept={concept} />
              ))}
              
              {getEducationalContent().mathModel && (
                <div className="bg-gray-50 p-4 rounded mt-4">
                  <h3 className="font-bold mb-2">Mathematical Model</h3>
                  <code className="block">{getEducationalContent().mathModel}</code>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MIMOInteractiveLearning;