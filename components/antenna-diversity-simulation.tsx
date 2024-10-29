import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter } from 'recharts';
import { Play, Pause, Antenna, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AntennaSimulation = () => {
  // Enhanced state management
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
  const [errorRate, setErrorRate] = useState(0);
  const powerWindowRef = useRef([]);
  const errorCountRef = useRef(0);
  const totalBitsRef = useRef(0);
  const WINDOW_SIZE = 50;

  // Memoized configuration options
  const configOptions = useMemo(() => ({
    modes: [
      { value: 'simo', label: 'SIMO (Single Input Multiple Output)' },
      { value: 'mimo', label: 'MIMO (Multiple Input Multiple Output)' }
    ],
    diversityTechniques: [
      { value: 'mrc', label: 'Maximum Ratio Combining' },
      { value: 'sc', label: 'Selection Combining' },
      { value: 'egc', label: 'Equal Gain Combining' }
    ],
    modulationSchemes: [
      { value: 'bpsk', label: 'BPSK (Binary Phase Shift Keying)' },
      { value: 'qpsk', label: 'QPSK (Quadrature Phase Shift Keying)' }
    ],
    fadingTypes: [
      { value: 'rayleigh', label: 'Rayleigh Fading' },
      { value: 'rician', label: 'Rician Fading' }
    ]
  }), []);

  // Enhanced Gaussian noise generation with Box-Muller transform
  function generateGaussianNoise(stdDev) {
    let u1, u2;
    do {
      u1 = Math.random();
      u2 = Math.random();
    } while (u1 <= Number.EPSILON);  // Avoid log(0)
    
    const mag = stdDev * Math.sqrt(-2.0 * Math.log(u1));
    const z1 = mag * Math.cos(2 * Math.PI * u2);
    const z2 = mag * Math.sin(2 * Math.PI * u2);
    return { real: z1, imag: z2 };
  }

  // Enhanced Rician fading with configurable K-factor
  function generateRicianFading(kFactor = 1) {
    const gaussian = generateGaussianNoise(1/Math.sqrt(2));
    const los = Math.sqrt(kFactor / (kFactor + 1));
    const scatter = Math.sqrt(1 / (kFactor + 1));
    
    const realPart = los + scatter * gaussian.real;
    const imagPart = scatter * gaussian.imag;
    
    return {
      magnitude: Math.sqrt(realPart * realPart + imagPart * imagPart),
      phase: Math.atan2(imagPart, realPart)
    };
  }

  // Improved fading generation with error handling
  function generateFading() {
    try {
      switch (fadingType) {
        case 'rician':
          return generateRicianFading();
        case 'rayleigh':
        default:
          const gaussian = generateGaussianNoise(1/Math.sqrt(2));
          return {
            magnitude: Math.sqrt(gaussian.real * gaussian.real + gaussian.imag * gaussian.imag),
            phase: Math.atan2(gaussian.imag, gaussian.real)
          };
      }
    } catch (error) {
      console.error('Error generating fading:', error);
      return { magnitude: 1, phase: 0 };
    }
  }

  // Enhanced modulation with error detection
  function modulateSignal(signal) {
    try {
      switch (modulationScheme) {
        case 'qpsk': {
          const symbol = Math.floor(Math.random() * 4);
          const phase = (symbol * Math.PI / 2) + (Math.PI / 4);
          const modulatedSignal = {
            real: signal * Math.cos(phase),
            imag: signal * Math.sin(phase),
            originalSymbol: symbol
          };
          return modulatedSignal;
        }
        case 'bpsk':
        default: {
          const bit = Math.random() > 0.5 ? 1 : -1;
          return {
            real: signal * bit,
            imag: 0,
            originalSymbol: bit > 0 ? 1 : 0
          };
        }
      }
    } catch (error) {
      console.error('Error in modulation:', error);
      return { real: signal, imag: 0, originalSymbol: 0 };
    }
  }

  // Improved signal combining with SNR estimation
  function combineSignals(signals, snrs) {
    try {
      switch (diversityTechnique) {
        case 'sc':
          const strongestIndex = snrs.indexOf(Math.max(...snrs));
          return signals[strongestIndex];
        case 'egc':
          return signals.reduce((sum, s) => sum + s, 0) / signals.length;
        case 'mrc':
        default:
          const weights = snrs.map(snr => Math.pow(10, snr/10));
          const totalWeight = weights.reduce((sum, w) => sum + w, 0);
          return signals.reduce((sum, s, i) => sum + s * weights[i], 0) / totalWeight;
      }
    } catch (error) {
      console.error('Error combining signals:', error);
      return signals[0] || 0;
    }
  }

  // Enhanced signal point generation with error tracking
  function generateSignalPoint(time) {
    const point = {
      time,
      snr: 0,
      baseSignal: 0,
      ber: errorRate
    };

    // Generate transmit signals with phase diversity
    const txSignals = [];
    for (let i = 0; i < numTxAntennas; i++) {
      const baseSignal = antennaStrengths[i] * 
        Math.sin(2 * Math.PI * frequency * time * 0.1 + (i * Math.PI / numTxAntennas));
      const modulatedSignal = modulateSignal(baseSignal);
      point[`tx${i + 1}`] = baseSignal;
      txSignals.push({ ...modulatedSignal, strength: antennaStrengths[i] });
    }

    // Process receive signals with improved channel estimation
    const rxSignals = [];
    const rxSNRs = [];
    
    for (let i = 0; i < numRxAntennas; i++) {
      let rxSignal = { real: 0, imag: 0 };
      let signalPower = 0;
      
      for (let j = 0; j < numTxAntennas; j++) {
        const fading = generateFading();
        const channelResponse = fading.magnitude * txSignals[j].strength;
        
        rxSignal.real += channelResponse * 
          (txSignals[j].real * Math.cos(fading.phase) - txSignals[j].imag * Math.sin(fading.phase));
        rxSignal.imag += channelResponse * 
          (txSignals[j].real * Math.sin(fading.phase) + txSignals[j].imag * Math.cos(fading.phase));
        
        signalPower += channelResponse * channelResponse;
      }

      const noise = generateGaussianNoise(noiseLevel);
      rxSignal.real += noise.real;
      rxSignal.imag += noise.imag;
      
      const rxMagnitude = Math.sqrt(rxSignal.real * rxSignal.real + rxSignal.imag * rxSignal.imag);
      point[`rx${i + 1}`] = rxMagnitude;
      rxSignals.push(rxMagnitude);

      // Calculate SNR for this antenna
      const noisePower = noiseLevel * noiseLevel;
      const snr = 10 * Math.log10(signalPower / noisePower);
      rxSNRs.push(snr);

      // Update constellation data with improved tracking
      if (i === 0) {
        setConstellationData(prev => [
            ...prev.slice(-100),
            { x: rxSignal.real, y: rxSignal.imag, snr: snr }
          ]);
      }
    }

    // Calculate combined signal and update error tracking
    const combinedSignal = combineSignals(rxSignals, rxSNRs);
    point.combinedSignal = combinedSignal;

    // Update error rate calculation
    const decodedSymbol = combinedSignal > 0 ? 1 : 0;
    if (decodedSymbol !== txSignals[0].originalSymbol) {
      errorCountRef.current++;
    }
    totalBitsRef.current++;
    
    if (totalBitsRef.current > 0) {
      setErrorRate(errorCountRef.current / totalBitsRef.current);
    }

    // Calculate overall SNR
    powerWindowRef.current = [...powerWindowRef.current.slice(-WINDOW_SIZE + 1), combinedSignal];
    const signalPower = powerWindowRef.current.reduce((acc, val) => acc + val * val, 0) / WINDOW_SIZE;
    const noisePower = noiseLevel * noiseLevel;
    point.snr = 10 * Math.log10(signalPower / noisePower);

    return point;
  }

  // Initialize simulation with error handling
  useEffect(() => {
    try {
      const initialData = Array.from({ length: 50 }, (_, index) => ({
        time: index,
        ...generateSignalPoint(index)
      }));
      setSignalData(initialData);
      errorCountRef.current = 0;
      totalBitsRef.current = 0;
    } catch (error) {
      console.error('Error initializing simulation:', error);
    }
  }, []);

  // Main simulation loop with cleanup
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setSignalData(prevData => {
          try {
            const newPoint = generateSignalPoint(prevData.length);
            
            // Create a new array with `prevData` minus the first element, and add `newPoint` at the end
            const updatedData = prevData.slice(1); // Removes the first element
            updatedData.push({ time: prevData.length, ...newPoint }); // Adds the new data point
  
            return updatedData;
          } catch (error) {
            console.error('Error in simulation loop:', error);
            return prevData;
          }
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, noiseLevel, numTxAntennas, numRxAntennas, frequency, mode, 
      fadingType, diversityTechnique, modulationScheme, antennaStrengths]);
  

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Advanced Antenna System Simulation
            <Info className="w-4 h-4 text-gray-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              Current BER: {(errorRate * 100).toFixed(2)}% | 
              Mode: {mode.toUpperCase()} | 
              Diversity: {diversityTechnique.toUpperCase()} | 
              Modulation: {modulationScheme.toUpperCase()}
            </AlertDescription>
          </Alert>

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
                      {configOptions.modes.map(mode => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Diversity Technique</label>
                  <Select value={diversityTechnique} onValueChange={setDiversityTechnique}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {configOptions.diversityTechniques.map(technique => (
                        <SelectItem key={technique.value} value={technique.value}>
                          {technique.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Modulation Scheme</label>
                  <Select value={modulationScheme} onValueChange={setModulationScheme}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {configOptions.modulationSchemes.map(scheme => (
                        <SelectItem key={scheme.value} value={scheme.value}>
                          {scheme.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {mode === 'mimo' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tx Antennas: {numTxAntennas}</label>
                    <Slider
                      value={[numTxAntennas]}
                      onValueChange={(value) => {
                        const newValue = Math.round(value[0]);
                        setNumTxAntennas(newValue);
                        // Ensure antenna strengths array matches new antenna count
                        setAntennaStrengths(prev => {
                          const newStrengths = [...prev];
                          while (newStrengths.length < newValue) {
                            newStrengths.push(1);
                          }
                          return newStrengths.slice(0, newValue);
                        });
                      }}
                      min={1}
                      max={4}
                      step={1}
                      className="w-full"
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
                    className="w-full"
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
                      {configOptions.fadingTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
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
                    className="w-full"
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
                      className="w-full"
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
                      <div key={`tx-${idx}`} className="relative">
                        <Antenna
                          className="w-8 h-8 text-blue-500"
                          style={{
                            transform: `rotate(${45 * idx}deg)`,
                            opacity: isRunning ? '1' : '0.5',
                            transition: 'all 0.3s ease'
                          }}
                        />
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-200 rounded-full text-xs flex items-center justify-center">
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
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
                      <div key={`rx-${idx}`} className="relative">
                        <Antenna
                          className="w-8 h-8 text-green-500"
                          style={{
                            transform: `rotate(${-45 * idx}deg)`,
                            opacity: isRunning ? '1' : '0.5',
                            transition: 'all 0.3s ease'
                          }}
                        />
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-200 rounded-full text-xs flex items-center justify-center">
                          {idx + 1}
                        </div>
                      </div>
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
              <div className="w-full overflow-hidden">
                <LineChart
                  width={800}
                  height={200}
                  data={signalData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" unit="s" />
                  <YAxis domain={[-2, 2]} />
                  <Tooltip 
                    formatter={(value) => value.toFixed(3)}
                    labelFormatter={(label) => `Time: ${label}s`}
                  />
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
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-white">
              <h3 className="text-lg font-medium mb-4">Receive Signals</h3>
              <div className="w-full overflow-hidden">
                <LineChart
                  width={800}
                  height={200}
                  data={signalData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" unit="s" />
                  <YAxis domain={[-2, 2]} />
                  <Tooltip 
                    formatter={(value) => value.toFixed(3)}
                    labelFormatter={(label) => `Time: ${label}s`}
                  />
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
                      strokeWidth={1.5}
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
                  <Tooltip 
                    formatter={(value) => `${value.toFixed(2)} dB`}
                    labelFormatter={(label) => `Time: ${label}s`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="snr"
                    stroke="#8884d8"
                    dot={false}
                    name="SNR (dB)"
                    isAnimationActive={false}
                    strokeWidth={2}
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
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Real" 
                    unit="" 
                    domain={[-2, 2]} 
                    tickFormatter={(value) => value.toFixed(1)}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Imaginary" 
                    unit="" 
                    domain={[-2, 2]}
                    tickFormatter={(value) => value.toFixed(1)}
                  />
                  <Tooltip 
                    formatter={(value) => value.toFixed(3)}
                    cursor={{ strokeDasharray: '3 3' }}
                  />
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