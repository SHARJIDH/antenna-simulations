/* eslint-disable */
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Antenna, Radio, Waves, ArrowRight } from 'lucide-react';


const AntennaSimulationOne = () => {
  const [snrValue, setSnrValue] = useState(10);
  const [kFactor, setKFactor] = useState(5);
  
  // Generate BER vs SNR data
  function erfc(x) {
    const z = Math.abs(x);
    const t = 1 / (1 + 0.5 * z);
    const ans = t * Math.exp(-z * z - 1.26551223 + 
                  t * (1.00002368 + 
                  t * (0.37409196 + 
                  t * (0.09678418 + 
                  t * (-0.18628806 + 
                  t * (0.27886807 + 
                  t * (-1.13520398 + 
                  t * (1.48851587 + 
                  t * (-0.82215223 + 
                  t * 0.17087277)))))))));
  
    return x >= 0 ? ans : 2 - ans;
  }
  
  function generateBERData(numAntennas) {
    return Array.from({ length: 20 }, (_, i) => {
      const snr = i * 2;
      const ber = 0.5 * erfc(Math.sqrt(10 ** (snr / 10)) / Math.sqrt(2 * numAntennas));
      return { snr, ber: ber.toFixed(6), name: `${snr} dB` };
    });
  }
  
  
  
  function generateRayleighData(snrValue) {
    return Array.from({ length: 50 }, (_, i) => {
      const x = i / 5;
      // PDF of Rayleigh distribution
      const pdf = (x / Math.pow(snrValue, 2)) * Math.exp(-Math.pow(x, 2) / (2 * Math.pow(snrValue, 2)));
      return {
        x,
        pdf: pdf.toFixed(4),
        name: x.toFixed(1)
      };
    });
  }
  function generateRicianData(snrValue, kFactor) {
    return Array.from({ length: 50 }, (_, i) => {
      const x = i / 5;
      // Simplified Rician PDF (approximation)
      const pdf = (x / Math.pow(snrValue, 2)) * 
                 Math.exp(-(Math.pow(x, 2) + Math.pow(kFactor, 2)) / (2 * Math.pow(snrValue, 2))) *
                 Math.exp(x * kFactor / Math.pow(snrValue, 2));
      return {
        x,
        pdf: pdf.toFixed(4),
        name: x.toFixed(1)
      };
    });
  }
  


  // Simulation data for different antenna configurations
  const singleAntennaData = generateBERData(1);
  const twoAntennaData = generateBERData(2);
  const fourAntennaData = generateBERData(4);
  const rayleighData = generateRayleighData(snrValue);
  const ricianData = generateRicianData(snrValue, kFactor);
  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="simo">SIMO</TabsTrigger>
          <TabsTrigger value="miso">MISO</TabsTrigger>
          <TabsTrigger value="mimo">MIMO</TabsTrigger>
          <TabsTrigger value="fading">Fading Types</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold">Understanding Antenna Diversity</h3>
              <div className="flex items-center space-x-4 mb-4">
                <Antenna className="w-12 h-12" />
                <div>
                  <p className="text-lg">Antenna diversity is a wireless communication technique that uses multiple antennas to improve the quality and reliability of a wireless link.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 border rounded">
                  <h4 className="font-semibold mb-2">SIMO</h4>
                  <p>Single-Input Multiple-Output</p>
                  <div className="flex justify-center mt-2">
                    <Antenna className="w-6 h-6" />
                    <ArrowRight className="w-6 h-6" />
                    <div className="flex flex-col">
                      <Antenna className="w-6 h-6" />
                      <Antenna className="w-6 h-6" />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded">
                  <h4 className="font-semibold mb-2">MISO</h4>
                  <p>Multiple-Input Single-Output</p>
                  <div className="flex justify-center mt-2">
                    <div className="flex flex-col">
                      <Antenna className="w-6 h-6" />
                      <Antenna className="w-6 h-6" />
                    </div>
                    <ArrowRight className="w-6 h-6" />
                    <Antenna className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="p-4 border rounded">
                  <h4 className="font-semibold mb-2">MIMO</h4>
                  <p>Multiple-Input Multiple-Output</p>
                  <div className="flex justify-center mt-2">
                    <div className="flex flex-col">
                      <Antenna className="w-6 h-6" />
                      <Antenna className="w-6 h-6" />
                    </div>
                    <ArrowRight className="w-6 h-6" />
                    <div className="flex flex-col">
                      <Antenna className="w-6 h-6" />
                      <Antenna className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4">Diversity Combining Techniques</h4>
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-4 bg-gray-50 rounded">
                    <h5 className="font-semibold mb-2">Maximum Ratio Combining (MRC)</h5>
                    <p className="mb-2">Weights signals based on their SNR for optimal combining</p>
                    <div className="bg-white p-3 rounded border">
                      <p className="font-mono">y = Σ(wᵢ × rᵢ)</p>
                      <p className="text-sm mt-1">wᵢ = αᵢ* / N₀</p>
                      <p className="text-sm">where αᵢ is channel gain</p>
                    </div>
                    <p className="mt-2 text-sm">Achieves maximum SNR improvement</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded">
                    <h5 className="font-semibold mb-2">Selection Combining (SC)</h5>
                    <p className="mb-2">Selects the strongest signal among available branches</p>
                    <div className="bg-white p-3 rounded border">
                      <p className="font-mono">y = max(r₁, r₂, ..., rₙ)</p>
                      <p className="text-sm mt-1">SNR_out = max(SNR₁, SNR₂, ..., SNRₙ)</p>
                    </div>
                    <p className="mt-2 text-sm">Simple implementation, lower complexity</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded">
                    <h5 className="font-semibold mb-2">Equal Gain Combining (EGC)</h5>
                    <p className="mb-2">Combines signals with equal weights after phase alignment</p>
                    <div className="bg-white p-3 rounded border">
                      <p className="font-mono">y = Σ(rᵢ × e^(-jθᵢ))</p>
                      <p className="text-sm mt-1">where θᵢ is phase of branch i</p>
                    </div>
                    <p className="mt-2 text-sm">Good performance with simpler implementation than MRC</p>
                  </div>
                </div>

                
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simo">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">SIMO - Single-Input Multiple-Output</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Performance Analysis</h4>
                  <LineChart width={500} height={300} data={singleAntennaData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" domain={['auto', 'auto']} label={{ value: 'SNR (dB)', position: 'bottom' }} />
                    <YAxis scale="log" domain={['auto', 'auto']} label={{ value: 'BER', angle: -90, position: 'left' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="ber" stroke="#8884d8" name="BER vs SNR" />
                  </LineChart>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">Mathematical Model</h4>
                    <p>y[l] = h[l]x[l] + w[l], l = 1,2,...,L</p>
                    <p className="mt-2">Where:</p>
                    <ul className="list-disc pl-6">
                      <li>y[l] is received signal</li>
                      <li>h[l] are i.i.d Rayleigh faded channel gains</li>
                      <li>x[l] is transmitted signal</li>
                      <li>w[l] is additive noise</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">Key Benefits</h4>
                    <ul className="list-disc pl-6">
                      <li>Diversity gain of L (number of receive antennas)</li>
                      <li>Improved reliability</li>
                      <li>Better SNR through combining</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="miso">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">MISO - Multiple-Input Single-Output</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Alamouti Scheme Performance</h4>
                  <LineChart width={500} height={300} data={twoAntennaData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" label={{ value: 'SNR (dB)', position: 'bottom' }} />
                    <YAxis scale="log" domain={['auto', 'auto']} label={{ value: 'BER', angle: -90, position: 'left' }} />

                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="ber" stroke="#82ca9d" name="Alamouti MISO" />
                  </LineChart>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">Alamouti Space-Time Code</h4>
                    <p className="mb-2">Transmission matrix:</p>
                    <div className="bg-white p-2 rounded border">
                      <p>[ x₁  -x₂* ]</p>
                      <p>[ x₂   x₁* ]</p>
                    </div>
                    <p className="mt-2">Where x₁, x₂ are transmitted symbols</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">Properties</h4>
                    <ul className="list-disc pl-6">
                      <li>Full diversity gain of 2</li>
                      <li>Rate 1 symbol per channel use</li>
                      <li>Simple linear processing at receiver</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mimo">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">MIMO - Multiple-Input Multiple-Output</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">MIMO System Performance</h4>
                  <LineChart width={500} height={300} data={fourAntennaData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" label={{ value: 'SNR (dB)', position: 'bottom' }} />
                    <YAxis scale="log" domain={['auto', 'auto']} label={{ value: 'BER', angle: -90, position: 'left' }} />

                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="ber" stroke="#ff7300" name="4x4 MIMO" />
                  </LineChart>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">MIMO Channel Model</h4>
                    <p>Y = HX + W</p>
                    <p className="mt-2">Where:</p>
                    <ul className="list-disc pl-6">
                      <li>Y: Received signal matrix</li>
                      <li>H: Channel matrix</li>
                      <li>X: Transmitted signal matrix</li>
                      <li>W: Noise matrix</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">Advantages</h4>
                    <ul className="list-disc pl-6">
                      <li>Maximum diversity gain of N_t × N_r</li>
                      <li>Spatial multiplexing capability</li>
                      <li>Improved spectral efficiency</li>
                      <li>Better capacity scaling</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="fading">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Wireless Channel Fading Models</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">Rayleigh Fading</h4>
                    <div className="bg-white p-3 rounded border space-y-2">
                      <p className="font-medium">PDF:</p>
                      <p className="font-mono">
                        f(r) = (r/σ²)exp(-r²/2σ²)
                      </p>
                      <p className="font-medium mt-2">Channel Response:</p>
                      <p className="font-mono">
                        h(t) = hᵢ(t) + jhₖ(t)
                      </p>
                      <p className="font-medium mt-2">SNR:</p>
                      <p className="font-mono">
                        γ = (|h|²Eₛ)/N₀
                      </p>
                    </div>
                    <p className="mt-2 text-sm">Used when there is no line-of-sight (NLOS) path</p>
                  
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">Rician Fading</h4>
                    <div className="bg-white p-3 rounded border space-y-2">
                      <p className="font-medium">PDF:</p>
                      <p className="font-mono">
                        f(r) = (r/σ²)exp(-(r² + A²)/2σ²)I₀(rA/σ²)
                      </p>
                      <p className="font-medium mt-2">K-Factor:</p>
                      <p className="font-mono">
                        K = A²/2σ² (ratio of LOS to scattered power)
                      </p>
                      <p className="font-medium mt-2">Channel Response:</p>
                      <p className="font-mono">
                        h(t) = h_los(t) + h_scatter(t)
                      </p>
                    </div>
                    <p className="mt-2 text-sm">Used when there is a dominant line-of-sight (LOS) path</p>

                  </div>
                </div>

                <div className="col-span-2 bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold mb-2">Key Characteristics Comparison</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-medium mb-2">Rayleigh Fading</h5>
                      <ul className="list-disc pl-6">
                        <li>No dominant LOS component</li>
                        <li>Phase uniformly distributed [0, 2π]</li>
                        <li>Envelope follows Rayleigh distribution</li>
                        <li>Power follows exponential distribution</li>
                        <li>More severe fading conditions</li>
                      </ul>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-medium mb-2">Rician Fading</h5>
                      <ul className="list-disc pl-6">
                        <li>Strong LOS component present</li>
                        <li>K-factor determines fading severity</li>
                        <li>Envelope follows Rician distribution</li>
                        <li>As K → ∞, approaches AWGN channel</li>
                        <li>As K → 0, approaches Rayleigh fading</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AntennaSimulationOne;