import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter } from 'recharts';
import { Play, Pause, Antenna } from 'lucide-react';

const AntennaSimulation = () => {
  // State for simulation controls
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('simo');
  const [numTxAntennas, setNumTxAntennas] = useState(1);
  const [numRxAntennas, setNumRxAntennas] = useState(2);
  const [frequency, setFrequency] = useState(1);
  const [noiseLevel, setNoiseLevel] = useState(0.5);
  const [fadingType, setFadingType] = useState('rayleigh');
  const [diversityTechnique, setDiversityTechnique] = useState('mrc');
  const [modulationScheme, setModulationScheme] = useState('bpsk');
  const [signalData, setSignalData] = useState([]);
  const [constellationData, setConstellationData] = useState([]);
  const [antennaStrengths, setAntennaStrengths] = useState([1, 1, 1, 1]);
  const powerWindowRef = useRef([]);
  const WINDOW_SIZE = 50;

  // Function to generate complex Gaussian noise
  function generateGaussianNoise(stdDev) {
    const u1 = Math.random();
    const u2 = Math.random();
    const mag = stdDev * Math.sqrt(-2.0 * Math.log(u1));
    const z1 = mag * Math.cos(2 * Math.PI * u2);
    const z2 = mag * Math.sin(2 * Math.PI * u2);
    return { real: z1, imag: z2 };
  }

  // Function to generate Rician fading
  function generateRicianFading(kFactor = 1) {
    const gaussian = generateGaussianNoise(1/Math.sqrt(2));
    const los = Math.sqrt(kFactor / (kFactor + 1)); // Line of sight component
    const scatter = Math.sqrt(1 / (kFactor + 1)); // Scattered component
    return {
      magnitude: Math.sqrt(
        Math.pow(los + scatter * gaussian.real, 2) + 
        Math.pow(scatter * gaussian.imag, 2)
      ),
      phase: Math.atan2(scatter * gaussian.imag, los + scatter * gaussian.real)
    };
  }

  // Function to generate fading based on selected type
  function generateFading() {
    switch (fadingType) {
      case 'rician':
        return generateRicianFading();
      case 'rayleigh':
      default:
        const gaussian = generateGaussianNoise(1/Math.sqrt(2));
        return {
          magnitude: Math.sqrt(Math.pow(gaussian.real, 2) + Math.pow(gaussian.imag, 2)),
          phase: Math.atan2(gaussian.imag, gaussian.real)
        };
    }
  }

  // Function to apply modulation
  function modulateSignal(signal) {
    switch (modulationScheme) {
      case 'qpsk':
        const symbol = Math.floor(Math.random() * 4);
        const phase = (symbol * Math.PI / 2) + (Math.PI / 4);
        return {
          real: signal * Math.cos(phase),
          imag: signal * Math.sin(phase)
        };
      case 'bpsk':
      default:
        return {
          real: signal * (Math.random() > 0.5 ? 1 : -1),
          imag: 0
        };
    }
  }

  // Function to combine signals using selected diversity technique
  function combineSignals(signals) {
    switch (diversityTechnique) {
      case 'sc':
        // Selection Combining - choose the strongest signal
        return Math.max(...signals.map(s => Math.abs(s)));
      case 'egc':
        // Equal Gain Combining - add signals with equal weights
        return signals.reduce((sum, s) => sum + s, 0) / signals.length;
      case 'mrc':
      default:
        // Maximal Ratio Combining - weight signals by their SNR
        const weights = signals.map(s => Math.abs(s) / (noiseLevel + 0.1));
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        return signals.reduce((sum, s, i) => sum + s * weights[i], 0) / totalWeight;
    }
  }

  function generateSignalPoint(time) {
    const point = {
      time,
      snr: 0,
      baseSignal: 0
    };

    // Generate transmit signals
    const txSignals = [];
    for (let i = 0; i < numTxAntennas; i++) {
      const baseSignal = antennaStrengths[i] * 
        Math.sin(2 * Math.PI * frequency * time * 0.1 + (i * Math.PI / 4));
      const modulatedSignal = modulateSignal(baseSignal);
      point[`tx${i + 1}`] = baseSignal;
      txSignals.push(modulatedSignal);
    }

    // Process receive signals
    const rxSignals = [];
    for (let i = 0; i < numRxAntennas; i++) {
      let rxSignal = { real: 0, imag: 0 };
      
      for (let j = 0; j < numTxAntennas; j++) {
        const fading = generateFading();
        const channelResponse = fading.magnitude;
        
        rxSignal.real += channelResponse * 
          (txSignals[j].real * Math.cos(fading.phase) - txSignals[j].imag * Math.sin(fading.phase));
        rxSignal.imag += channelResponse * 
          (txSignals[j].real * Math.sin(fading.phase) + txSignals[j].imag * Math.cos(fading.phase));
      }

      const noise = generateGaussianNoise(noiseLevel);
      rxSignal.real += noise.real;
      rxSignal.imag += noise.imag;
      
      const rxMagnitude = Math.sqrt(rxSignal.real * rxSignal.real + rxSignal.imag * rxSignal.imag);
      point[`rx${i + 1}`] = rxMagnitude;
      rxSignals.push(rxMagnitude);

      // Update constellation data
      if (i === 0) {
        setConstellationData(prev => [
          ...prev.slice(-100),
          { x: rxSignal.real, y: rxSignal.imag }
        ]);
      }
    }

    // Calculate combined signal
    const combinedSignal = combineSignals(rxSignals);
    point.combinedSignal = combinedSignal;

    // Calculate SNR
    powerWindowRef.current = [...powerWindowRef.current.slice(-WINDOW_SIZE + 1), combinedSignal];
    const signalPower = powerWindowRef.current.reduce((acc, val) => acc + val * val, 0) / WINDOW_SIZE;
    const noisePower = noiseLevel * noiseLevel;
    point.snr = 10 * Math.log10(signalPower / noisePower);

    return point;
  }

  // Initialize and update simulation
  useEffect(() => {
    const initialData = Array.from({ length: 50 }, (_, index) => ({
      time: index,
      ...generateSignalPoint(index)
    }));
    setSignalData(initialData);
  }, []);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setSignalData(prevData => {
          const newPoint = generateSignalPoint(prevData.length);
          return [...prevData.slice(1), { time: prevData.length, ...newPoint }];
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning, noiseLevel, numTxAntennas, numRxAntennas, frequency, mode, 
      fadingType, diversityTechnique, modulationScheme, antennaStrengths]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Antenna System Simulation</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="config" className="mb-6">
            <TabsList>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="config">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">System Mode</label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simo">SIMO</SelectItem>
                      <SelectItem value="mimo">MIMO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Diversity Technique</label>
                  <Select value={diversityTechnique} onValueChange={setDiversityTechnique}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mrc">Maximum Ratio Combining</SelectItem>
                      <SelectItem value="sc">Selection Combining</SelectItem>
                      <SelectItem value="egc">Equal Gain Combining</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Modulation Scheme</label>
                  <Select value={modulationScheme} onValueChange={setModulationScheme}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bpsk">BPSK</SelectItem>
                      <SelectItem value="qpsk">QPSK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mode === 'mimo' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tx Antennas: {numTxAntennas}</label>
                    <Slider
                      value={[numTxAntennas]}
                      onValueChange={(value) => setNumTxAntennas(Math.round(value[0]))}
                      min={1}
                      max={4}
                      step={1}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rx Antennas: {numRxAntennas}</label>
                  <Slider
                    value={[numRxAntennas]}
                    onValueChange={(value) => setNumRxAntennas(Math.round(value[0]))}
                    min={1}
                    max={4}
                    step={1}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fading Type</label>
                  <Select value={fadingType} onValueChange={setFadingType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rayleigh">Rayleigh</SelectItem>
                      <SelectItem value="rician">Rician</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Noise Level: {noiseLevel.toFixed(2)}</label>
                  <Slider
                    value={[noiseLevel]}
                    onValueChange={(value) => setNoiseLevel(value[0])}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>

                {Array.from({ length: numTxAntennas }).map((_, idx) => (
                  <div key={`strength-${idx}`} className="space-y-2">
                    <label className="text-sm font-medium">
                      Antenna {idx + 1} Strength: {antennaStrengths[idx].toFixed(2)}
                    </label>
                    <Slider
                      value={[antennaStrengths[idx]]}
                      onValueChange={(value) => {
                        const newStrengths = [...antennaStrengths];
                        newStrengths[idx] = value[0];
                        setAntennaStrengths(newStrengths);
                      }}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="visualization">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center mb-4">
                <div className="flex flex-col items-center space-y-4">
                  <h3 className="text-lg font-medium">Transmit Antennas</h3>
                  <div className="flex space-x-4">
                    {Array.from({ length: numTxAntennas }).map((_, idx) => (
                      <Antenna
                        key={`tx-${idx}`}
                        className="w-8 h-8 text-blue-500"
                        style={{
                          transform: `rotate(${45 * idx}deg)`,
                          opacity: isRunning ? '1' : '0.5'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    onClick={() => setIsRunning(!isRunning)}
                  >
                    {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isRunning ? 'Pause' : 'Start'}
                  </button>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <h3 className="text-lg font-medium">Receive Antennas</h3>
                  <div className="flex space-x-4">
                    {Array.from({ length: numRxAntennas }).map((_, idx) => (
                      <Antenna
                        key={`rx-${idx}`}
                        className="w-8 h-8 text-green-500"
                        style={{
                          transform: `rotate(${-45 * idx}deg)`,
                          opacity: isRunning ? '1' : '0.5'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Signal Visualizations */}
          <div className="space-y-8">
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="text-lg font-medium mb-4">Transmit Signals</h3>
              <LineChart
                width={800}
                height={200}
                data={signalData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" unit="s" />
                <YAxis domain={[-2, 2]}/>
                <Tooltip />
                <Legend />
                {Array.from({ length: numTxAntennas }).map((_, idx) => (
                  <Line
                    key={`tx${idx + 1}`}
                    type="monotone"
                    dataKey={`tx${idx + 1}`}
                    stroke={`hsl(${(idx * 360) / numTxAntennas}, 70%, 50%)`}
                    dot={false}
                    name={`Tx ${idx + 1}`}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </div>

            <div className="border rounded-lg p-4 bg-white">
              <h3 className="text-lg font-medium mb-4">Receive Signals</h3>
              <LineChart
                width={800}
                height={200}
                data={signalData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" unit="s" />
                <YAxis domain={[-2, 2]}  />
                <Tooltip />
                <Legend />
                {Array.from({ length: numRxAntennas }).map((_, idx) => (
                  <Line
                    key={`rx${idx + 1}`}
                    type="monotone"
                    dataKey={`rx${idx + 1}`}
                    stroke={`hsl(${(idx * 360) / numRxAntennas}, 70%, 50%)`}
                    dot={false}
                    name={`Rx ${idx + 1}`}
                    isAnimationActive={false}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="combinedSignal"
                  stroke="#000"
                  strokeWidth={2}
                  dot={false}
                  name="Combined Signal"
                  isAnimationActive={false}
                />
              </LineChart>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-white">
                <h3 className="text-lg font-medium mb-4">Signal-to-Noise Ratio</h3>
                <LineChart
                  width={400}
                  height={200}
                  data={signalData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" unit="s" />
                  <YAxis unit="dB" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="snr"
                    stroke="#8884d8"
                    dot={false}
                    name="SNR (dB)"
                    isAnimationActive={false}
                  />
                </LineChart>
              </div>

              <div className="border rounded-lg p-4 bg-white">
                <h3 className="text-lg font-medium mb-4">Constellation Diagram</h3>
                <ScatterChart
                  width={400}
                  height={200}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid />
                  <XAxis type="number" dataKey="x" name="Real" unit="" domain={[-2, 2]} />
                  <YAxis type="number" dataKey="y" name="Imaginary" unit="" domain={[-2, 2]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter
                    name="Symbols"
                    data={constellationData}
                    fill="#8884d8"
                    isAnimationActive={false}
                  />
                </ScatterChart>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AntennaSimulation;