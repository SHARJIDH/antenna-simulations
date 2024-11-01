/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Waypoints, 
  Antenna, 
  Workflow, 
  Waves, 
  Signal 
} from 'lucide-react';

// Rayleigh Fading Channel Simulation
export const  RayleighFadingSimulation = () => {
  const [signalStrength, setSignalStrength] = useState(50);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw signal waves with Rayleigh distribution
    ctx.beginPath();
    ctx.strokeStyle = 'blue';
    for (let x = 0; x < canvas.width; x += 10) {
      const amplitude = Math.random() * signalStrength;
      const frequency = Math.sin(x * 0.1) * amplitude;
      ctx.lineTo(x, canvas.height/2 + frequency);
    }
    ctx.stroke();
  }, [signalStrength]);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Rayleigh Fading Channel Simulation</h2>
      <div className="flex items-center space-x-4">
        <label>Signal Variability:</label>
        <input 
          type="range" 
          min="10" 
          max="100" 
          value={signalStrength}
          onChange={(e) => setSignalStrength(Number(e.target.value))}
          className="w-full"
        />
      </div>
      <canvas 
        ref={canvasRef} 
        width="600" 
        height="200" 
        className="mt-4 bg-white border"
      />
      <p className="mt-2 text-sm">
        Observe how signal strength varies randomly in a Rayleigh fading channel.
        Adjust the slider to see different signal variability scenarios.
      </p>
    </div>
  );
};

// Antenna Diversity Simulation
export const AntennaDiversitySimulationOne = () => {
  const [antennaCount, setAntennaCount] = useState(2);
  const [signalQuality, setSignalQuality] = useState([50, 60]);

  const updateSignalQuality = () => {
    const newQualities = Array(antennaCount).fill(0).map(() => 
      Math.floor(Math.random() * 70 + 30)
    );
    setSignalQuality(newQualities);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Antenna Diversity Simulation</h2>
      <div className="flex items-center space-x-4 mb-4">
        <label>Number of Antennas:</label>
        <select 
          value={antennaCount}
          onChange={(e) => setAntennaCount(Number(e.target.value))}
          className="border p-1"
        >
          {[2, 4, 6].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
        <button 
          onClick={updateSignalQuality}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Regenerate Signals
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {signalQuality.map((quality, index) => (
          <div 
            key={index} 
            className="bg-white p-3 rounded shadow"
          >
            <h3>Antenna {index + 1}</h3>
            <div 
              className="h-4 bg-blue-500" 
              style={{ width: `${quality}%` }}
            />
            <p>Signal Quality: {quality}%</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm">
        Multiple antennas provide alternative signal paths, 
        improving overall communication reliability.
      </p>
    </div>
  );
};

// Frequency Diversity Simulation
const FrequencyDiversitySimulation = () => {
  const [frequencies, setFrequencies] = useState([
    { freq: 2.4, strength: 70 },
    { freq: 5.0, strength: 60 },
    { freq: 6.0, strength: 50 }
  ]);

  const updateFrequencyStrengths = () => {
    const newFrequencies = frequencies.map(f => ({
      ...f,
      strength: Math.floor(Math.random() * 70 + 30)
    }));
    setFrequencies(newFrequencies);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Frequency Diversity Simulation</h2>
      <button 
        onClick={updateFrequencyStrengths}
        className="bg-blue-500 text-white px-3 py-1 rounded mb-4"
      >
        Simulate Channel Conditions
      </button>
      <div className="space-y-3">
        {frequencies.map((f, index) => (
          <div 
            key={index} 
            className="bg-white p-3 rounded shadow flex items-center"
          >
            <div className="w-1/3">Frequency: {f.freq} GHz</div>
            <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${f.strength}%` }}
              />
            </div>
            <div className="ml-3">{f.strength}%</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm">
        Transmitting across multiple frequencies provides 
        resilience against channel fading.
      </p>
    </div>
  );
};

// Channel Uncertainty Simulation
const ChannelUncertaintySimulation = () => {
  const [noiseLevel, setNoiseLevel] = useState(30);
  const [signalRecoveryRate, setSignalRecoveryRate] = useState(70);

  const simulateChannelRecovery = () => {
    const recoveryRate = 100 - noiseLevel;
    setSignalRecoveryRate(Math.max(20, recoveryRate));
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Channel Uncertainty Simulation</h2>
      <div className="space-y-4">
        <div>
          <label>Channel Noise Level:</label>
          <input 
            type="range" 
            min="10" 
            max="80" 
            value={noiseLevel}
            onChange={(e) => setNoiseLevel(Number(e.target.value))}
            className="w-full"
          />
          <p>Current Noise: {noiseLevel}%</p>
        </div>
        <button 
          onClick={simulateChannelRecovery}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Simulate Channel Recovery
        </button>
        <div className="bg-white p-3 rounded shadow">
          <h3>Signal Recovery Performance</h3>
          <div className="bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${signalRecoveryRate}%` }}
            />
          </div>
          <p>Signal Recovery Rate: {signalRecoveryRate}%</p>
        </div>
      </div>
      <p className="mt-2 text-sm">
        Adjust noise levels to see how communication systems 
        attempt to recover signal integrity.
      </p>
    </div>
  );
};

// Main Component
const TelecomSimulationsPage = () => {
  const [activeSimulation, setActiveSimulation] = useState('rayleigh');

  const simulations = [
    { 
      key: 'rayleigh', 
      title: 'Rayleigh Fading Channel', 
      component: <RayleighFadingSimulation />,
      icon: <Waves />
    },
    { 
      key: 'antenna', 
      title: 'Antenna Diversity', 
      component: <AntennaDiversitySimulation />,
      icon: <Antenna />
    },
    { 
      key: 'frequency', 
      title: 'Frequency Diversity', 
      component: <FrequencyDiversitySimulation />,
      icon: <Waypoints />
    },
    { 
      key: 'uncertainty', 
      title: 'Channel Uncertainty', 
      component: <ChannelUncertaintySimulation />,
      icon: <Signal />
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-center mb-8"
      >
        Telecommunications Concept Simulations
      </motion.h1>

      <div className="flex justify-center space-x-4 mb-6">
        {simulations.map(sim => (
          <button
            key={sim.key}
            onClick={() => setActiveSimulation(sim.key)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded
              ${activeSimulation === sim.key 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'}
            `}
          >
            {sim.icon}
            <span>{sim.title}</span>
          </button>
        ))}
      </div>

      <motion.div
        key={activeSimulation}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {simulations.find(sim => sim.key === activeSimulation)?.component}
      </motion.div>
    </div>
  );
};

export default TelecomSimulationsPage;