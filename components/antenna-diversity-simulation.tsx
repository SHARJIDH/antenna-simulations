/* eslint-disable */
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
} from "recharts";
import { Play, Pause, Antenna, Info, Radio, RadioWaves } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

const AntennaSimulation = () => {
  // State management
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("simo");
  const [numTxAntennas, setNumTxAntennas] = useState(1);
  const [numRxAntennas, setNumRxAntennas] = useState(2);
  const [frequency, setFrequency] = useState(1);
  const [noiseLevel, setNoiseLevel] = useState(0.5);
  const [fadingType, setFadingType] = useState("rayleigh");
  const [diversityTechnique, setDiversityTechnique] = useState("mrc");
  const [modulationScheme, setModulationScheme] = useState("bpsk");
  const [signalData, setSignalData] = useState([]);
  const [constellationData, setConstellationData] = useState([]);
  const [constellationDataCombined, setConstellationDataCombined] = useState(
    []
  );
  const [antennaStrengths, setAntennaStrengths] = useState([1, 1, 1, 1]);
  const [errorRate, setErrorRate] = useState(0);
  const powerWindowRef = useRef([]);
  const errorCountRef = useRef(0);
  const totalBitsRef = useRef(0);
  const timeCounterRef = useRef(0);
  const WINDOW_SIZE = 50;
  const [decodedConstellationData, setDecodedConstellationData] = useState([]);

  // Configuration options
  const configOptions = useMemo(
    () => ({
      modes: [
        { value: "simo", label: "SIMO (Single Input Multiple Output)" },
        { value: "mimo", label: "MIMO (Multiple Input Multiple Output)" },
      ],
      diversityTechniques: [
        { value: "mrc", label: "Maximum Ratio Combining" },
        { value: "sc", label: "Selection Combining" },
        { value: "egc", label: "Equal Gain Combining" },
      ],
      modulationSchemes: [
        { value: "bpsk", label: "BPSK (Binary Phase Shift Keying)" },
        { value: "qpsk", label: "QPSK (Quadrature Phase Shift Keying)" },
      ],
      fadingTypes: [
        { value: "rayleigh", label: "Rayleigh Fading" },
        { value: "rician", label: "Rician Fading" },
      ],
    }),
    []
  );

  // Gaussian noise generation
  function generateGaussianNoise(stdDev) {
    let u1, u2;
    do {
      u1 = Math.random();
      u2 = Math.random();
    } while (u1 <= Number.EPSILON);

    const mag = stdDev * Math.sqrt(-2.0 * Math.log(u1));
    const z1 = mag * Math.cos(2 * Math.PI * u2);
    const z2 = mag * Math.sin(2 * Math.PI * u2);
    return { real: z1, imag: z2 };
  }
  function calculateSNR(signal, noise) {
    if (noise <= Number.EPSILON) return 100; // Return high SNR for zero noise
    const signalPower = Math.pow(signal, 2);
    const noisePower = Math.pow(noise, 2);
    return 10 * Math.log10(signalPower / noisePower);
  }

  // Rician fading generation
  function generateRicianFading(kFactor = 1) {
    const gaussian = generateGaussianNoise(1 / Math.sqrt(2));
    const los = Math.sqrt(kFactor / (kFactor + 1));
    const scatter = Math.sqrt(1 / (kFactor + 1));

    const realPart = los + scatter * gaussian.real;
    const imagPart = scatter * gaussian.imag;

    return {
      magnitude: Math.sqrt(realPart * realPart + imagPart * imagPart),
      phase: Math.atan2(imagPart, realPart),
    };
  }

  // Fading generation
  function generateFading() {
    try {
      switch (fadingType) {
        case "rician":
          return generateRicianFading();
        case "rayleigh":
        default:
          const gaussian = generateGaussianNoise(1 / Math.sqrt(2));
          return {
            magnitude: Math.sqrt(
              gaussian.real * gaussian.real + gaussian.imag * gaussian.imag
            ),
            phase: Math.atan2(gaussian.imag, gaussian.real),
          };
      }
    } catch (error) {
      console.error("Error generating fading:", error);
      return { magnitude: 1, phase: 0 };
    }
  }

  // Signal modulation
  function modulateSignal(signal) {
    try {
      switch (modulationScheme) {
        case "qpsk": {
          const symbol = Math.floor(Math.random() * 4);
          const phase = (symbol * Math.PI) / 2 + Math.PI / 4;
          return {
            real: signal * Math.cos(phase),
            imag: signal * Math.sin(phase),
            originalSymbol: symbol,
          };
        }
        case "bpsk":
        default: {
          const bit = Math.random() > 0.5 ? 1 : -1;
          return {
            real: signal * bit,
            imag: 0,
            originalSymbol: bit > 0 ? 1 : 0,
          };
        }
      }
    } catch (error) {
      console.error("Error in modulation:", error);
      return { real: signal, imag: 0, originalSymbol: 0 };
    }
  }

  // Signal combining
  function combineSignals(signals, snrs) {
    if (signals.length === 0) return { real: 0, imag: 0 };
    if (signals.length === 1) return signals[0];

    switch (diversityTechnique) {
      case "sc": {
        const strongestIndex = snrs.indexOf(Math.max(...snrs));
        return signals[strongestIndex];
      }
      case "egc": {
        const normalizedSignals = signals.map((s) => ({
          real: s.real / Math.sqrt(s.real * s.real + s.imag * s.imag),
          imag: s.imag / Math.sqrt(s.real * s.real + s.imag * s.imag),
        }));
        return {
          real:
            normalizedSignals.reduce((sum, s) => sum + s.real, 0) /
            signals.length,
          imag:
            normalizedSignals.reduce((sum, s) => sum + s.imag, 0) /
            signals.length,
        };
      }
      case "mrc":
      default: {
        const weights = snrs.map((snr) => Math.pow(10, snr / 20)); // Convert dB to linear scale
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        return {
          real:
            signals.reduce((sum, s, i) => sum + s.real * weights[i], 0) /
            totalWeight,
          imag:
            signals.reduce((sum, s, i) => sum + s.imag * weights[i], 0) /
            totalWeight,
        };
      }
    }
  }

  // Signal point generation
  function generateSignalPoint(absoluteTime) {
    const point = {
      time: absoluteTime,
      displayTime: absoluteTime % WINDOW_SIZE,
      absoluteTime: absoluteTime,
      snr: 0,
      baseSignal: 0,
      ber: errorRate,
    };

    // Generate transmit signals
    const txSignals = [];
    const rxSignalsArray = Array(numRxAntennas)
      .fill()
      .map(() => []);

    for (let i = 0; i < numTxAntennas; i++) {
      const baseSignal =
        antennaStrengths[i] *
        Math.sin(
          2 * Math.PI * frequency * absoluteTime * 0.1 +
            (i * Math.PI) / numTxAntennas
        );
      point[`tx${i + 1}`] = baseSignal;
      txSignals.push({ real: baseSignal, imag: 0 });
    }

    // Process receive signals with improved combining
    const rxSignals = [];
    const rxSNRs = [];

    for (let i = 0; i < numRxAntennas; i++) {
      let rxSignal = { real: 0, imag: 0 };
      let signalPower = 0;

      for (let j = 0; j < numTxAntennas; j++) {
        const channelGain = noiseLevel <= Number.EPSILON ? 1 : Math.random();
        signalPower +=
          channelGain *
          channelGain *
          (txSignals[j].real * txSignals[j].real +
            txSignals[j].imag * txSignals[j].imag);

        rxSignal.real += channelGain * txSignals[j].real;
        rxSignal.imag += channelGain * txSignals[j].imag;
      }

      if (noiseLevel > Number.EPSILON) {
        const noise = generateGaussianNoise(noiseLevel);
        rxSignal.real += noise.real;
        rxSignal.imag += noise.imag;
      }

      const rxMagnitude = Math.sqrt(
        rxSignal.real * rxSignal.real + rxSignal.imag * rxSignal.imag
      );
      point[`rx${i + 1}`] = rxMagnitude;
      rxSignals.push(rxSignal);

      const snr = calculateSNR(rxMagnitude, noiseLevel);
      rxSNRs.push(snr);

      setConstellationData((prev) => [
        ...prev.slice(-50),
        { x: rxSignal.real, y: rxSignal.imag, antenna: i + 1 },
      ]);
    }

    const combinedSignal = combineSignals(rxSignals, rxSNRs);
    point.combinedSignal = Math.sqrt(
      combinedSignal.real * combinedSignal.real +
        combinedSignal.imag * combinedSignal.imag
    );

    setConstellationDataCombined((prev) => [
      ...prev.slice(-50),
      { x: combinedSignal.real, y: combinedSignal.imag },
    ]);
    let decodedSignal;
    if (mode === "simo") {
      // SIMO decoding
      decodedSignal = {
        real: combinedSignal.real > 0 ? 1 : -1,
        imag: combinedSignal.imag > 0 ? 0 : 0,
        originalSymbol:
          combinedSignal.real > 0
            ? combinedSignal.imag > 0
              ? 3
              : 1
            : combinedSignal.imag > 0
            ? 2
            : 0,
      };
    } else {
      // MIMO decoding
      switch (modulationScheme) {
        case "qpsk":
          decodedSignal = {
            real: combinedSignal.real > 0 ? 1 : -1,
            imag: combinedSignal.imag > 0 ? 1 : -1,
            originalSymbol:
              combinedSignal.real > 0
                ? combinedSignal.imag > 0
                  ? 3
                  : 1
                : combinedSignal.imag > 0
                ? 2
                : 0,
          };
          break;
        case "bpsk":
        default:
          decodedSignal = {
            real: combinedSignal.real > 0 ? 1 : -1,
            imag: 0,
            originalSymbol: combinedSignal.real > 0 ? 1 : 0,
          };
          break;
      }
    }

    setDecodedConstellationData((prev) => [
      ...prev.slice(-50),
      { x: decodedSignal.real, y: decodedSignal.imag },
    ]);

    // Update SNR calculation
    const signalPower = point.combinedSignal * point.combinedSignal;
    const noisePower = noiseLevel * noiseLevel;
    point.snr =
      noiseLevel <= Number.EPSILON
        ? 100
        : 10 * Math.log10(signalPower / (noisePower / numRxAntennas));

    return point;
  }

  // Initialize simulation
  useEffect(() => {
    try {
      timeCounterRef.current = 0;
      const initialData = Array.from({ length: WINDOW_SIZE }, (_, index) => ({
        ...generateSignalPoint(index),
        displayTime: index,
      }));
      setSignalData(initialData);
      errorCountRef.current = 0;
      totalBitsRef.current = 0;
    } catch (error) {
      console.error("Error initializing simulation:", error);
    }
  }, []);

  // Simulation loop
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        timeCounterRef.current += 1;

        setSignalData((prevData) => {
          try {
            const newPoint = generateSignalPoint(timeCounterRef.current);
            const updatedData = prevData.slice(1);
            updatedData.push({
              ...newPoint,
              displayTime: prevData[prevData.length - 1].displayTime + 1,
            });
            return updatedData;
          } catch (error) {
            console.error("Error in simulation loop:", error);
            return prevData;
          }
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isRunning,
    noiseLevel,
    numTxAntennas,
    numRxAntennas,
    frequency,
    mode,
    fadingType,
    diversityTechnique,
    modulationScheme,
    antennaStrengths,
  ]);

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
              {/* Current BER: {(errorRate * 100).toFixed(2)}% |  */}
              Mode: {mode.toUpperCase()} | Diversity:{" "}
              {diversityTechnique.toUpperCase()} | Modulation:{" "}
              {modulationScheme.toUpperCase()} | Time: {timeCounterRef.current}s
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {configOptions.modes.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Diversity Technique
                  </label>
                  <Select
                    value={diversityTechnique}
                    onValueChange={setDiversityTechnique}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {configOptions.diversityTechniques.map((technique) => (
                        <SelectItem
                          key={technique.value}
                          value={technique.value}
                        >
                          {technique.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* <div className="space-y-2">
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
                </div> */}

                {mode === "mimo" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Tx Antennas: {numTxAntennas}
                    </label>
                    <Slider
                      value={[numTxAntennas]}
                      onValueChange={(value) => {
                        const newValue = Math.round(value[0]);
                        setNumTxAntennas(newValue);
                        // Ensure antenna strengths array matches new antenna count
                        setAntennaStrengths((prev) => {
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
                  <label className="text-sm font-medium">
                    Rx Antennas: {numRxAntennas}
                  </label>
                  <Slider
                    value={[numRxAntennas]}
                    onValueChange={(value) =>
                      setNumRxAntennas(Math.round(value[0]))
                    }
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {configOptions.fadingTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Noise Level: {noiseLevel.toFixed(2)}
                  </label>
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
                      Antenna {idx + 1} Strength:{" "}
                      {antennaStrengths[idx].toFixed(2)}
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
                        <Image
                          src={"/antenna-3.svg"}
                          alt={"Y"}
                          width={60}
                          height={60}
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
                    {isRunning ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                    {isRunning ? "Pause" : "Start"}
                  </button>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <h3 className="text-lg font-medium">Receive Antennas</h3>
                  <div className="flex space-x-4">
                    {Array.from({ length: numRxAntennas }).map((_, idx) => (
                      <div key={`rx-${idx}`} className="relative">
                        <Image
                          src={"/antenna-3.svg"}
                          alt={"Y"}
                          width={60}
                          height={60}
                          style={{
                            transform: "scaleX(-1)",
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
                  <XAxis dataKey="displayTime" unit="s" />
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
                  <XAxis dataKey="displayTime" unit="s" />
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
                    strokeDasharray="5 5"
                    dot={false}
                    name="Combined Signal"
                    isAnimationActive={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-white">
                <h3 className="text-lg font-medium mb-4">
                  Signal-to-Noise Ratio
                </h3>
                <LineChart
                  width={400}
                  height={200}
                  data={signalData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayTime" unit="s" />
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
                <h3 className="text-lg font-medium mb-4">
                  Constellation Diagram Recieved
                </h3>
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
                    cursor={{ strokeDasharray: "3 3" }}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 ">
              <div className="border rounded-lg p-4 bg-white">
                <h3 className="text-lg font-medium mb-4">
                  Constellation Diagram Combined
                </h3>
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
                    cursor={{ strokeDasharray: "3 3" }}
                  />
                  <Scatter
                    name="Symbols"
                    data={constellationDataCombined}
                    fill="#8884d8"
                    isAnimationActive={false}
                  />
                </ScatterChart>
              </div>
              <div className="border rounded-lg p-4 bg-white">
                <h3 className="text-lg font-medium mb-4">
                  Constellation Diagram afer decode
                </h3>
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
                    cursor={{ strokeDasharray: "3 3" }}
                  />
                  <Scatter
                    name="Symbols"
                    data={decodedConstellationData}
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
