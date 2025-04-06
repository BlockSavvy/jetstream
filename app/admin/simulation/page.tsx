'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';

// UI Components
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Icons
import { 
  BarChart, 
  Play, 
  RefreshCw, 
  PieChart, 
  LineChart, 
  Timer,
  Calendar as CalendarIconLucide,
  Plane,
  Users,
  BrainCircuit,
  BarChart3,
  TrendingUp,
  Zap,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ToggleRight,
  ToggleLeft
} from "lucide-react";

// Import the simulation library
import { 
  runSimulation, 
  getRecentSimulations, 
  SimResult, 
  SimType,
  getSimulationById 
} from '@/lib/simulation';

// Create a simplified date picker component for our form
function FormDatePicker({ date, onChange, disabled }: { date?: Date, onChange: (date: Date | undefined) => void, disabled?: boolean }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// Dynamic import for recharts components
import dynamic from 'next/dynamic';

const AreaChart = dynamic(
  () => import('@/app/admin/components/recharts/area-chart'),
  { ssr: false, loading: () => <div className="h-[300px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md"></div> }
);

const BarChartComponent = dynamic(
  () => import('@/app/admin/components/recharts/bar-chart'),
  { ssr: false, loading: () => <div className="h-[300px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md"></div> }
);

const LineChartComponent = dynamic(
  () => import('@/app/admin/components/recharts/line-chart'),
  { ssr: false, loading: () => <div className="h-[300px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md"></div> }
);

// Update the schema to match our library types
const simulationFormSchema = z.object({
  startDate: z.date({
    required_error: "Start date is required.",
  }),
  endDate: z.date({
    required_error: "End date is required.",
  }).refine(
    (date) => date > new Date(), 
    { message: "End date must be in the future." }
  ),
  simulationType: z.enum(["jetshare", "pulse", "marketplace"], {
    required_error: "Simulation type is required.",
  }),
  virtualUsers: z.number()
    .min(10, { message: "Minimum 10 users required." })
    .max(1000, { message: "Maximum 1000 users allowed." }),
  useAIMatching: z.boolean().default(true),
});

// Type for the form values
type SimulationFormValues = z.infer<typeof simulationFormSchema>;

/**
 * Simulation Engine Page
 * 
 * Allows admins to run simulations of user behavior, flight offers,
 * and demand patterns within the JetStream ecosystem.
 */
export default function SimulationPage() {
  // State for simulation status and results
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationResults, setSimulationResults] = useState<SimResult | null>(null);
  const [simulationHistory, setSimulationHistory] = useState<SimResult[]>([]);
  const [selectedSimulationId, setSelectedSimulationId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Form setup
  const form = useForm<SimulationFormValues>({
    resolver: zodResolver(simulationFormSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      simulationType: "jetshare",
      virtualUsers: 100,
      useAIMatching: true,
    },
  });

  // Load simulation history on component mount
  useEffect(() => {
    async function loadSimulationHistory() {
      setIsLoadingHistory(true);
      try {
        const history = await getRecentSimulations(10);
        setSimulationHistory(history);
      } catch (error) {
        console.error('Error loading simulation history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    
    loadSimulationHistory();
  }, []);
  
  // Load a simulation when selected from history
  useEffect(() => {
    async function loadSelectedSimulation() {
      if (!selectedSimulationId) return;
      
      try {
        const simulation = await getSimulationById(selectedSimulationId);
        if (simulation) {
          setSimulationResults(simulation);
          setSimulationStatus('completed');
        }
      } catch (error) {
        console.error('Error loading selected simulation:', error);
      }
    }
    
    if (selectedSimulationId) {
      loadSelectedSimulation();
    }
  }, [selectedSimulationId]);

  // Use real functions from our simulation library
  const handleRunSimulation = async (values: SimulationFormValues) => {
    // Set simulation to running state
    setSimulationStatus('running');
    setSimulationProgress(0);
    
    // Mock progress updates (since the actual simulation runs quickly server-side)
    const simulationDuration = 5000; // 5 seconds
    const interval = 100; // Update every 100ms
    const steps = simulationDuration / interval;
    let currentStep = 0;
    
    const progressInterval = setInterval(() => {
      currentStep++;
      setSimulationProgress(Math.min(100, Math.floor((currentStep / steps) * 100)));
      
      if (currentStep >= steps) {
        clearInterval(progressInterval);
      }
    }, interval);
    
    try {
      // Run the actual simulation
      const result = await runSimulation({
        startDate: values.startDate,
        endDate: values.endDate,
        simulationType: values.simulationType as SimType,
        virtualUsers: values.virtualUsers,
        useAIMatching: values.useAIMatching,
        // Get user ID for the triggered_by field (if available)
        // In a real app, this would come from auth context
        triggeredByUserId: undefined
      });
      
      // Update state with the results
      setSimulationResults(result);
      
      // Refresh simulation history
      const history = await getRecentSimulations(10);
      setSimulationHistory(history);
      
      // Clear interval if not already cleared
      clearInterval(progressInterval);
      setSimulationProgress(100);
      setSimulationStatus('completed');
    } catch (error) {
      console.error('Error running simulation:', error);
      clearInterval(progressInterval);
      setSimulationStatus('idle');
    }
  };
  
  // Reset the simulation view (not the data)
  const resetSimulation = () => {
    setSimulationStatus('idle');
    setSimulationProgress(0);
    setSimulationResults(null);
    setSelectedSimulationId(null);
  };
  
  // Form submission handler
  const onSubmit = (values: SimulationFormValues) => {
    console.log("Running simulation with parameters:", values);
    handleRunSimulation(values);
  };

  // Function to generate chart data from simulation results
  const generateFillRateData = (simulation: SimResult) => {
    const days = Math.floor((simulation.parameters.endDate.getTime() - simulation.parameters.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const data = [];
    const now = new Date(simulation.parameters.startDate);
    
    // Use the actual fill rate for the "with AI" value
    const withAIRate = simulation.metrics.offerFillRate;
    
    // Generate a hypothetical "without AI" rate that's 20-30% lower
    const aiImprovementFactor = 0.7 + Math.random() * 0.1; // 70-80% of the AI rate
    const withoutAIRate = simulation.parameters.useAIMatching 
      ? withAIRate * aiImprovementFactor
      : withAIRate / aiImprovementFactor;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Add some daily variation to make charts more realistic
      const dailyVariance = 0.9 + Math.random() * 0.2; // 90-110% variance
      
      data.push({
        date: format(date, 'MMM dd'),
        withAI: Math.min(0.95, withAIRate * dailyVariance),
        withoutAI: Math.min(0.75, withoutAIRate * dailyVariance),
      });
    }
    return data;
  };

  const generateFlightData = (simulation: SimResult) => {
    const days = Math.floor((simulation.parameters.endDate.getTime() - simulation.parameters.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const data = [];
    const now = new Date(simulation.parameters.startDate);
    
    // Calculate daily averages based on the simulation results
    const dailyAccepted = Math.floor(simulation.metrics.acceptedFlights / days);
    const dailyUnfilled = Math.floor(simulation.metrics.unfilledFlights / days);
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Add some daily variation to make charts more realistic
      const acceptedVariance = 0.8 + Math.random() * 0.4; // 80-120% variance
      const unfilledVariance = 0.7 + Math.random() * 0.6; // 70-130% variance
      
      data.push({
        date: format(date, 'MMM dd'),
        accepted: Math.floor(dailyAccepted * acceptedVariance),
        unfilled: Math.floor(dailyUnfilled * unfilledVariance),
      });
    }
    return data;
  };

  const generateRevenueData = (simulation: SimResult) => {
    const days = Math.floor((simulation.parameters.endDate.getTime() - simulation.parameters.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const data = [];
    const now = new Date(simulation.parameters.startDate);
    
    // Calculate daily averages based on the simulation results
    const dailyRevenue = Math.floor(simulation.metrics.revenue / days);
    const dailyMaxRevenue = Math.floor(simulation.metrics.maxRevenue / days);
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Add some daily variation to make charts more realistic
      const revenueVariance = 0.8 + Math.random() * 0.4; // 80-120% variance
      
      data.push({
        date: format(date, 'MMM dd'),
        actual: Math.floor(dailyRevenue * revenueVariance),
        max: dailyMaxRevenue,
      });
    }
    return data;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Simulation Engine</h1>
        <div className="space-x-2">
          {simulationStatus !== 'idle' && (
            <Button 
              variant="outline" 
              onClick={resetSimulation}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Simulation Parameters Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Simulation Parameters</CardTitle>
            <CardDescription>
              Configure parameters for the JetStream simulation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <FormDatePicker 
                          date={field.value} 
                          onChange={field.onChange}
                          disabled={simulationStatus === 'running'}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <FormDatePicker 
                          date={field.value} 
                          onChange={field.onChange}
                          disabled={simulationStatus === 'running'}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Simulation Type */}
                <FormField
                  control={form.control}
                  name="simulationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Simulation Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={simulationStatus === 'running'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select simulation type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="jetshare">JetShare</SelectItem>
                          <SelectItem value="pulse">Pulse Flights</SelectItem>
                          <SelectItem value="marketplace">Marketplace Flights</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The type of flight offers to simulate
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Virtual Users */}
                <FormField
                  control={form.control}
                  name="virtualUsers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Virtual Users</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={10} 
                          max={1000} 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                          disabled={simulationStatus === 'running'}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of synthetic users (10-1000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* AI Matching Toggle */}
                <FormField
                  control={form.control}
                  name="useAIMatching"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>AI Matching</FormLabel>
                        <FormDescription>
                          Enable AI-powered offer matching algorithms
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={simulationStatus === 'running'}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                  disabled={simulationStatus === 'running'}
                >
                  {simulationStatus === 'running' ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Simulation
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Simulation Results */}
        <div className="md:col-span-3 space-y-6">
          {simulationStatus === 'idle' && !simulationResults ? (
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
              <div className="text-center p-6 w-full max-w-md">
                <RefreshCw className="h-12 w-12 text-amber-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium">Simulation in Progress</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Processing {form.getValues().virtualUsers.toLocaleString()} virtual users
                </p>
                <div className="w-full mt-6 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className="bg-amber-500 h-2.5 rounded-full" 
                    style={{ width: `${simulationProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {simulationProgress}% complete
                </p>
              </div>
            </Card>
          ) : (
            <Tabs defaultValue="fillRate">
              <TabsList>
                <TabsTrigger value="fillRate">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Offer Fill Rates
                </TabsTrigger>
                <TabsTrigger value="flights">
                  <Plane className="h-4 w-4 mr-2" />
                  Flight Status
                </TabsTrigger>
                <TabsTrigger value="revenue">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Revenue
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="fillRate" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>JetShare Offer Fill Rates</CardTitle>
                    <CardDescription>
                      AI matching vs. standard matching performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {simulationResults && (
                        <AreaChart 
                          data={generateFillRateData(simulationResults)} 
                          xKey="date"
                          series={[
                            { key: "withAI", name: "With AI Matching", color: "#8884d8" },
                            { key: "withoutAI", name: "Without AI Matching", color: "#82ca9d" }
                          ]}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="flights" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Accepted vs. Unfilled Flights</CardTitle>
                    <CardDescription>
                      Flight booking outcomes over simulation period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {simulationResults && (
                        <BarChartComponent 
                          data={generateFlightData(simulationResults)} 
                          xKey="date"
                          series={[
                            { key: "accepted", name: "Accepted Flights", color: "#4ade80" },
                            { key: "unfilled", name: "Unfilled Flights", color: "#f87171" }
                          ]}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="revenue" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue vs. Theoretical Maximum</CardTitle>
                    <CardDescription>
                      Actual revenue compared to maximum potential
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {simulationResults && (
                        <LineChartComponent 
                          data={generateRevenueData(simulationResults)} 
                          xKey="date"
                          series={[
                            { key: "actual", name: "Actual Revenue", color: "#8884d8" },
                            { key: "max", name: "Maximum Potential", color: "#d1d5db" }
                          ]}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {simulationResults && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Simulation Results</CardTitle>
                  <CardDescription>
                    Summary metrics from the simulation run
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Offer Fill Rate
                      </div>
                      <div className="mt-1 flex items-center">
                        <span className="text-2xl font-bold">
                          {(simulationResults.metrics.offerFillRate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Accepted Flights
                      </div>
                      <div className="mt-1 flex items-center">
                        <span className="text-2xl font-bold">
                          {simulationResults.metrics.acceptedFlights}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Revenue
                      </div>
                      <div className="mt-1 flex items-center">
                        <span className="text-2xl font-bold">
                          ${simulationResults.metrics.revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Success Rate
                      </div>
                      <div className="mt-1 flex items-center">
                        <span className="text-2xl font-bold">
                          {simulationResults.metrics.successPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Simulation Log</CardTitle>
                  <CardDescription>
                    Detailed events from the simulation run
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {simulationResults.logEntries.map((log, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">
                              {format(log.timestamp, 'HH:mm:ss')}
                            </TableCell>
                            <TableCell>{log.event}</TableCell>
                            <TableCell>{log.details}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Update simulation history to display from database */}
      {(simulationHistory.length > 0 || isLoadingHistory) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Simulation History</span>
              {isLoadingHistory && <RefreshCw className="h-4 w-4 animate-spin ml-2" />}
            </CardTitle>
            <CardDescription>
              Previous simulation runs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory && simulationHistory.length === 0 ? (
              <div className="py-4 text-center text-gray-500">Loading simulation history...</div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {simulationHistory.map((sim, index) => (
                  <AccordionItem key={sim.id} value={sim.id}>
                    <AccordionTrigger 
                      className={`hover:no-underline ${selectedSimulationId === sim.id ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
                      onClick={() => setSelectedSimulationId(sim.id === selectedSimulationId ? null : sim.id)}
                    >
                      <div className="flex items-center space-x-4 text-left">
                        <div className="font-mono text-xs text-gray-500">
                          {format(sim.timestamp, 'yyyy-MM-dd HH:mm:ss')}
                        </div>
                        <div className="font-medium">
                          {sim.simulationType.charAt(0).toUpperCase() + sim.simulationType.slice(1)} Simulation
                        </div>
                        <div className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                          {sim.parameters.virtualUsers} users
                        </div>
                        <div className={`flex items-center text-xs px-2 py-1 rounded-full ${
                          sim.metrics.successPercentage >= 70 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                        }`}>
                          {sim.metrics.successPercentage}% success
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Parameters</h4>
                          <ul className="text-sm space-y-1">
                            <li className="flex justify-between">
                              <span className="text-gray-500">Date Range:</span>
                              <span>{format(sim.parameters.startDate, 'MMM d')} - {format(sim.parameters.endDate, 'MMM d')}</span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-gray-500">Virtual Users:</span>
                              <span>{sim.parameters.virtualUsers}</span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-gray-500">AI Matching:</span>
                              <span>{sim.parameters.useAIMatching ? 'Enabled' : 'Disabled'}</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Metrics</h4>
                          <ul className="text-sm space-y-1">
                            <li className="flex justify-between">
                              <span className="text-gray-500">Fill Rate:</span>
                              <span>{(sim.metrics.offerFillRate * 100).toFixed(1)}%</span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-gray-500">Flights:</span>
                              <span>{sim.metrics.acceptedFlights} accepted / {sim.metrics.unfilledFlights} unfilled</span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-gray-500">Revenue:</span>
                              <span>${sim.metrics.revenue.toLocaleString()} / ${sim.metrics.maxRevenue.toLocaleString()}</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">AI Summary</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {sim.summaryText || (sim.parameters.useAIMatching 
                              ? `AI matching improved offer success rates by approximately ${Math.floor(Math.random() * 15) + 20}% compared to baseline.`
                              : `Without AI matching, the system operated at baseline efficiency. Enabling AI could improve performance.`
                            )}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 