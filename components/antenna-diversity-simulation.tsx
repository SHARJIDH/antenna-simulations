import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Play, Pause, Antenna } from 'lucide-react';

const AntennaSimulation = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0.5);
  const [mode, setMode] = useState('simo');
  const [numTxAntennas, setNumTxAntennas] = useState(1);
  const [numRxAntennas, setNumRxAntennas] = useState(2);
  const [frequency, setFrequency] = useState(1);
  const [signalData, setSignalData] = useState(() => initializeSignalData());

  function initializeSignalData() {
    return Array.from({ length: 50 }, (_, index) => ({
      time: index,
      ...generateSignalPoint(index)
    }));
  }

  function generateSignalPoint(time) {
    const point = {
      time,
      snr: 0,
      baseSignal: 0
    };

    for (let i = 0; i < numTxAntennas; i++) {
      point[`tx${i + 1}`] = Math.sin(time * 0.1 * frequency + (i * Math.PI / 4));
    }

    for (let i = 0; i < numRxAntennas; i++) {
      let rxSignal = 0;
      for (let j = 0; j < numTxAntennas; j++) {
        const phaseShift = (i * j * Math.PI) / 4;
        rxSignal += point[`tx${j + 1}`] * Math.cos(phaseShift);
      }

      rxSignal += (Math.random() - 0.5) * noiseLevel;
      point[`rx${i + 1}`] = rxSignal;
    }
    let combinedSignal = 0;
    for (let i = 0; i < numRxAntennas; i++) {
      combinedSignal += point[`rx${i + 1}`];
    }
    point.combinedSignal = combinedSignal / numRxAntennas;

    // Calculate SNR
    const signalPower = Math.pow(combinedSignal, 2);
    const noisePower = Math.pow(noiseLevel, 2);
    point.snr = 10 * Math.log10(signalPower / noisePower);

    return point;
  }

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
  }, [isRunning, noiseLevel, numTxAntennas, numRxAntennas, frequency, mode]);

  const getLineColors = () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#800080', '#ff8c00', '#4b0082'];
    return colors;
  };

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
            </TabsList>
            
            <TabsContent value="config">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mode</label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simo">SIMO</SelectItem>
                      <SelectItem value="mimo">MIMO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Noise Level: {noiseLevel}</label>
                  <Slider
                    value={[noiseLevel]}
                    onValueChange={(value) => setNoiseLevel(value[0])}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Signal Frequency: {frequency} Hz</label>
                  <Slider
                    value={[frequency]}
                    onValueChange={(value) => setFrequency(value[0])}
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
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

            <TabsContent value="visualization">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center mb-4">
                {/* Transmit Antennas Visualization */}
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

                {/* Control Button */}
                <div className="flex justify-center">
                  <button
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    onClick={() => setIsRunning(!isRunning)}
                  >
                    {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isRunning ? 'Pause' : 'Start'}
                  </button>
                </div>

                {/* Receive Antennas Visualization */}
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
            {/* Transmit Signals */}
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="text-lg font-medium mb-4">Transmit Signals</h3>
              <LineChart
                width={800}
                height={200}
                data={signalData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[-2, 2]} />
                <Tooltip />
                <Legend />
                {Array.from({ length: numTxAntennas }).map((_, idx) => (
                  <Line
                    key={`tx${idx + 1}`}
                    type="monotone"
                    dataKey={`tx${idx + 1}`}
                    stroke={getLineColors()[idx]}
                    dot={false}
                    name={`Tx ${idx + 1}`}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </div>

            {/* Receive Signals */}
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="text-lg font-medium mb-4">Receive Signals</h3>
              <LineChart
                width={800}
                height={200}
                data={signalData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[-2, 2]} />
                <Tooltip />
                <Legend />
                {Array.from({ length: numRxAntennas }).map((_, idx) => (
                  <Line
                    key={`rx${idx + 1}`}
                    type="monotone"
                    dataKey={`rx${idx + 1}`}
                    stroke={getLineColors()[idx]}
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

            {/* SNR Chart */}
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="text-lg font-medium mb-4">Signal-to-Noise Ratio</h3>
              <LineChart
                width={800}
                height={200}
                data={signalData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AntennaSimulation;