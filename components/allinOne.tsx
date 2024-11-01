/* eslint-disable */
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Antenna, Radio, Waves, ArrowRight } from 'lucide-react';

const AntennaSimulationOne = () => {
  const [snrValue, setSnrValue] = useState(10);
  
  // Generate BER vs SNR data
  const generateBERData = (antennaCount) => {
    return Array.from({ length: 20 }, (_, i) => {
      const snr = i * 2;
      const ber = Math.exp(-antennaCount * snr / 10) / 2;
      return {
        snr,
        ber: ber.toFixed(6),
        name: `${snr} dB`
      };
    });
  };

  // Simulation data for different antenna configurations
  const singleAntennaData = generateBERData(1);
  const twoAntennaData = generateBERData(2);
  const fourAntennaData = generateBERData(4);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Antenna Diversity Educational Platform
          </CardTitle>
        </CardHeader>
      </Card> */}

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="simo">SIMO</TabsTrigger>
          <TabsTrigger value="miso">MISO</TabsTrigger>
          <TabsTrigger value="mimo">MIMO</TabsTrigger>
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
                  <LineChart width={500} height={300} data={twoAntennaData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" label={{ value: 'SNR (dB)', position: 'bottom' }} />
                    <YAxis label={{ value: 'BER', angle: -90, position: 'left' }} />
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
                    <YAxis label={{ value: 'BER', angle: -90, position: 'left' }} />
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
                    <YAxis label={{ value: 'BER', angle: -90, position: 'left' }} />
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
      </Tabs>
    </div>
  );
};

export default AntennaSimulationOne;