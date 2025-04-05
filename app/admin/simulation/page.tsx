'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import dynamic from 'next/dynamic';

// Import icons
import { 
  BarChart, 
  Play, 
  Save, 
  RefreshCw, 
  PieChart, 
  LineChart, 
  Timer,
  Calendar,
  Plane,
  Users,
  BrainCircuit,
  BarChart3,
  TrendingUp
} from "lucide-react";

// Dynamically import each chart component separately
const DynamicAreaChart = dynamic(
  () => import('./components/recharts-components').then(mod => mod.AreaChartComponent),
  {
    ssr: false,
    loading: () => <div className="h-[300px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md"></div>
  }
);

const DynamicPieChart = dynamic(
  () => import('./components/recharts-components').then(mod => mod.PieChartComponent),
  {
    ssr: false,
    loading: () => <div className="h-[300px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md"></div>
  }
);

const DynamicBarChart = dynamic(
  () => import('./components/recharts-components').then(mod => mod.BarChartComponent),
  {
    ssr: false,
    loading: () => <div className="h-[300px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md"></div>
  }
);

/**
 * Admin Simulation Page
 * 
 * Provides an interface for running demand simulations and stress tests:
 * - Configure simulation parameters
 * - Run different types of simulations (demand, pricing, etc.)
 * - View simulation results in various visualizations
 * 
 * This page serves as a placeholder for future simulation capabilities.
 */
export default function AdminSimulationPage() {
  const [simulationStatus, setSimulationStatus] = useState('idle'); // idle, running, completed
  const [simulationType, setSimulationType] = useState('demand');
  const [parameters, setParameters] = useState({
    userCount: 1000,
    duration: 30,
    timeScale: 'days',
    region: 'global',
    flightTypes: ['business', 'leisure'],
    demandMultiplier: 1.0
  });

  // Placeholder simulation result data
  const demandData = [
    { name: 'Day 1', demand: 120, capacity: 150 },
    { name: 'Day 2', demand: 132, capacity: 150 },
    { name: 'Day 3', demand: 145, capacity: 150 },
    { name: 'Day 4', demand: 140, capacity: 150 },
    { name: 'Day 5', demand: 158, capacity: 150 },
    { name: 'Day 6', demand: 171, capacity: 180 },
    { name: 'Day 7', demand: 190, capacity: 190 },
    { name: 'Day 8', demand: 185, capacity: 190 },
    { name: 'Day 9', demand: 192, capacity: 190 },
    { name: 'Day 10', demand: 210, capacity: 220 },
  ];

  const flightTypeData = [
    { name: 'Business', value: 45 },
    { name: 'Leisure', value: 30 },
    { name: 'Group Charter', value: 15 },
    { name: 'Medical', value: 10 },
  ];

  const routeDemandData = [
    { name: 'NYC-LAX', demand: 450 },
    { name: 'MIA-LAS', demand: 320 },
    { name: 'BOS-CHI', demand: 280 },
    { name: 'SFO-SEA', demand: 210 },
    { name: 'DFW-DEN', demand: 180 },
  ];

  const performanceData = [
    { name: 'Load Factor', value: 88 },
    { name: 'Offer Conversion', value: 12 },
    { name: 'Repeat Booking', value: 67 },
    { name: 'JetShare Fill Rate', value: 72 },
  ];

  // Start simulation
  const runSimulation = () => {
    setSimulationStatus('running');
    
    // In a real application, this would trigger a backend simulation
    // For now, we'll just simulate a delay and then show results
    setTimeout(() => {
      setSimulationStatus('completed');
    }, 2000);
  };

  // Reset simulation
  const resetSimulation = () => {
    setSimulationStatus('idle');
  };

  // COLORS for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Simulation Engine</h1>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={resetSimulation}
            disabled={simulationStatus === 'idle'}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-black"
            onClick={runSimulation}
            disabled={simulationStatus === 'running'}
          >
            {simulationStatus === 'running' ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Simulation
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Simulation Parameters Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Simulation Parameters</CardTitle>
            <CardDescription>
              Configure parameters for the demand simulation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Simulation Type</FormLabel>
              <Select 
                value={simulationType} 
                onValueChange={setSimulationType}
                disabled={simulationStatus === 'running'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select simulation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demand">Demand Forecast</SelectItem>
                  <SelectItem value="pricing">Price Elasticity</SelectItem>
                  <SelectItem value="capacity">Capacity Planning</SelectItem>
                  <SelectItem value="route">Route Optimization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FormLabel>User Seed Volume</FormLabel>
              <div className="flex items-center space-x-2">
                <Input 
                  type="number" 
                  value={parameters.userCount} 
                  onChange={(e) => setParameters({...parameters, userCount: parseInt(e.target.value)})}
                  disabled={simulationStatus === 'running'}
                />
                <span className="text-sm text-muted-foreground">users</span>
              </div>
            </div>

            <div className="space-y-2">
              <FormLabel>Simulation Duration</FormLabel>
              <div className="flex items-center space-x-2">
                <Input 
                  type="number" 
                  value={parameters.duration} 
                  onChange={(e) => setParameters({...parameters, duration: parseInt(e.target.value)})}
                  disabled={simulationStatus === 'running'}
                />
                <Select 
                  value={parameters.timeScale} 
                  onValueChange={(value) => setParameters({...parameters, timeScale: value})}
                  disabled={simulationStatus === 'running'}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Time scale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <FormLabel>Region</FormLabel>
              <Select 
                value={parameters.region} 
                onValueChange={(value) => setParameters({...parameters, region: value})}
                disabled={simulationStatus === 'running'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="north-america">North America</SelectItem>
                  <SelectItem value="europe">Europe</SelectItem>
                  <SelectItem value="asia">Asia</SelectItem>
                  <SelectItem value="middle-east">Middle East</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FormLabel>Demand Multiplier</FormLabel>
              <div className="pt-2">
                <Slider
                  value={[parameters.demandMultiplier * 100]}
                  min={50}
                  max={200}
                  step={5}
                  onValueChange={([value]) => setParameters({...parameters, demandMultiplier: value / 100})}
                  disabled={simulationStatus === 'running'}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0.5x</span>
                  <span>{parameters.demandMultiplier.toFixed(1)}x</span>
                  <span>2.0x</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full">
              <Separator className="my-2" />
              <div className="text-xs text-muted-foreground italic mt-2">
                This simulation engine will power predictive analytics and AI-driven decision making for flight operations.
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Simulation Results */}
        <div className="md:col-span-3 space-y-6">
          {simulationStatus === 'idle' ? (
            <Card className="h-80 flex items-center justify-center">
              <div className="text-center p-6">
                <BrainCircuit className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Simulation Ready</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Configure parameters and click "Run Simulation" to start
                </p>
              </div>
            </Card>
          ) : simulationStatus === 'running' ? (
            <Card className="h-80 flex items-center justify-center">
              <div className="text-center p-6">
                <RefreshCw className="h-12 w-12 text-amber-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium">Simulation in Progress</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Processing {parameters.userCount.toLocaleString()} users over {parameters.duration} {parameters.timeScale}
                </p>
                <div className="w-full mt-4 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-amber-500 h-2.5 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                </div>
              </div>
            </Card>
          ) : (
            <Tabs defaultValue="demand">
              <TabsList>
                <TabsTrigger value="demand">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Demand Forecast
                </TabsTrigger>
                <TabsTrigger value="types">
                  <PieChart className="h-4 w-4 mr-2" />
                  Flight Types
                </TabsTrigger>
                <TabsTrigger value="routes">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Popular Routes
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="demand" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Demand vs. Capacity Forecast</CardTitle>
                    <CardDescription>
                      Projected demand compared to available capacity over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {/* Dynamically imported chart component */}
                      <DynamicAreaChart data={demandData} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="types" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Flight Type Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of different flight types in the simulation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {/* Dynamically imported chart component */}
                      <DynamicPieChart data={flightTypeData} colors={COLORS} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="routes" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Routes by Demand</CardTitle>
                    <CardDescription>
                      Most popular flight routes in the simulation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {/* Dynamically imported chart component */}
                      <DynamicBarChart data={routeDemandData} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {simulationStatus === 'completed' && (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {performanceData.map((item, index) => (
                <Card key={index}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-0">
                    <div className="text-2xl font-bold">{item.value}%</div>
                    <div className="text-xs text-muted-foreground flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      <span>+{Math.floor(Math.random() * 5) + 1}% from baseline</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {simulationStatus === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>Simulation Insights</CardTitle>
            <CardDescription>
              AI-generated insights from the simulation results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:border-amber-800">
                <h3 className="font-medium flex items-center">
                  <BrainCircuit className="h-5 w-5 mr-2 text-amber-500" />
                  Demand Exceeds Capacity
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  The simulation indicates demand will exceed capacity by approximately 10% on days 5-10. Consider increasing available jets or implementing dynamic pricing to optimize revenue.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                <h3 className="font-medium flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                  Route Opportunity
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  NYC-LAX route shows highest demand but also highest competition. Consider adding 2 additional jets to the MIA-LAS route where demand is growing with lower competition.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
                <h3 className="font-medium flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-500" />
                  JetShare Performance
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  JetShare fill rate is 72%, which is strong but could be improved. Analysis suggests lowering the minimum booking threshold from 4 to 3 seats could increase fill rate to 85%.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 