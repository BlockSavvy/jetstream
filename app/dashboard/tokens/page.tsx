'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Wallet,
  CreditCard,
  Plane,
  Calendar,
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  BarChart,
  DollarSign,
  Clock,
  Plus,
  Search,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils/format'
import { getJetImage } from '@/lib/utils/jet-images'

// Sample data for demonstration
const tokens = [
  {
    id: '1',
    jetModel: 'Gulfstream G650',
    manufacturer: 'Gulfstream Aerospace',
    percentage: 10,
    value: 2750000,
    purchaseDate: '2022-12-15',
    availableHours: 80,
    remainingHours: 65,
    status: 'active',
    appreciation: 5.2,
    image: '/placeholder.svg?height=200&width=300'
  },
  {
    id: '2',
    jetModel: 'Bombardier Global 6000',
    manufacturer: 'Bombardier',
    percentage: 5,
    value: 1250000,
    purchaseDate: '2023-02-28',
    availableHours: 40,
    remainingHours: 28,
    status: 'active',
    appreciation: 3.8,
    image: '/placeholder.svg?height=200&width=300'
  },
  {
    id: '3',
    jetModel: 'Embraer Phenom 300',
    manufacturer: 'Embraer',
    percentage: 12.5,
    value: 875000,
    purchaseDate: '2023-03-15',
    availableHours: 100,
    remainingHours: 88,
    status: 'active',
    appreciation: 2.9,
    image: '/placeholder.svg?height=200&width=300'
  }
];

const transactions = [
  {
    id: '1',
    type: 'purchase',
    tokenId: '1',
    jetModel: 'Gulfstream G650',
    percentage: 10,
    amount: 2625000,
    date: '2022-12-15'
  },
  {
    id: '2',
    type: 'purchase',
    tokenId: '2',
    jetModel: 'Bombardier Global 6000',
    percentage: 5,
    amount: 1200000,
    date: '2023-02-28'
  },
  {
    id: '3',
    type: 'purchase',
    tokenId: '3',
    jetModel: 'Embraer Phenom 300',
    percentage: 12.5,
    amount: 850000,
    date: '2023-03-15'
  },
  {
    id: '4',
    type: 'flight',
    tokenId: '1',
    jetModel: 'Gulfstream G650',
    hoursUsed: 5,
    route: 'New York → Los Angeles',
    date: '2023-04-10'
  },
  {
    id: '5',
    type: 'flight',
    tokenId: '2',
    jetModel: 'Bombardier Global 6000',
    hoursUsed: 7,
    route: 'Chicago → Miami',
    date: '2023-05-22'
  },
  {
    id: '6',
    type: 'flight',
    tokenId: '3',
    jetModel: 'Embraer Phenom 300',
    hoursUsed: 4,
    route: 'Boston → Washington D.C.',
    date: '2023-06-30'
  },
  {
    id: '7',
    type: 'flight',
    tokenId: '2',
    jetModel: 'Bombardier Global 6000',
    hoursUsed: 5,
    route: 'Miami → Las Vegas',
    date: '2023-07-15'
  }
];

export default function TokensPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('tokens')
  
  // Calculate portfolio metrics
  const totalValue = tokens.reduce((acc, token) => acc + token.value, 0)
  const totalAppreciation = (tokens.reduce((acc, token) => acc + (token.value * (token.appreciation / 100)), 0) / totalValue) * 100
  const totalRemainingHours = tokens.reduce((acc, token) => acc + token.remainingHours, 0)
  const totalHours = tokens.reduce((acc, token) => acc + token.availableHours, 0)
  
  // Filter tokens and transactions based on search
  const filteredTokens = tokens.filter(token => 
    token.jetModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredTransactions = transactions.filter(transaction => 
    transaction.jetModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaction.type === 'flight' && transaction.route && transaction.route.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Tokens</h1>
        <p className="text-muted-foreground">
          Manage your fractional jet ownership tokens
        </p>
      </div>
      
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
              Total Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <div className="flex items-center mt-1 text-xs">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{totalAppreciation.toFixed(1)}%
              </Badge>
              <span className="text-muted-foreground ml-2">from purchase value</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Plane className="h-4 w-4 mr-1 text-muted-foreground" />
              Flight Hours Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRemainingHours} hours</div>
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Used</span>
                <span>
                  {totalHours - totalRemainingHours}/{totalHours} hrs
                </span>
              </div>
              <Progress 
                value={(totalHours - totalRemainingHours) / totalHours * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wallet className="h-4 w-4 mr-1 text-muted-foreground" />
              Owned Jets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokens.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total ownership: {tokens.reduce((acc, token) => acc + token.percentage, 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Tabs - FIX: Ensure TabsContent is within the same Tabs component */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="w-full md:w-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="tokens" className="flex gap-2 items-center">
                <Wallet className="h-4 w-4" />
                <span>My Tokens</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex gap-2 items-center">
                <Clock className="h-4 w-4" />
                <span>History</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tokens or history..."
              className="pl-8 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            <span className="hidden md:inline">Filter</span>
          </Button>
        </div>
      </div>
      
      {/* Main content - FIX: Create a new Tabs component for the content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Tokens Tab */}
        <TabsContent value="tokens" className="m-0 space-y-4">
          <div className="flex justify-end">
            <Button className="bg-amber-500 hover:bg-amber-600 text-black" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Acquire New Token
            </Button>
          </div>
          
          {filteredTokens.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTokens.map((token) => (
                <Card key={token.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative h-40 md:h-auto md:w-40 xl:w-52">
                      <Image
                        src={getJetImage({manufacturer: token.manufacturer, model: token.jetModel.split(' ').slice(-1)[0]}, 0, token.image)}
                        alt={token.jetModel}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4 md:p-6 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{token.jetModel}</h3>
                          <p className="text-sm text-muted-foreground">{token.manufacturer}</p>
                        </div>
                        <Badge className="bg-amber-50 text-amber-800 hover:bg-amber-50 border-amber-200">
                          {token.percentage}% Ownership
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 my-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Current Value</p>
                          <p className="font-medium">{formatCurrency(token.value)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Appreciation</p>
                          <p className="font-medium flex items-center text-green-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {token.appreciation}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Hours Remaining</p>
                          <p className="font-medium">{token.remainingHours}/{token.availableHours}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <Badge variant="outline" className="capitalize">{token.status}</Badge>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="text-xs flex justify-between mb-1">
                          <span>Hours Used</span>
                          <span>{(token.availableHours - token.remainingHours)}/{token.availableHours}</span>
                        </div>
                        <Progress 
                          value={(token.availableHours - token.remainingHours) / (token.availableHours || 1) * 100} 
                          className="h-2"
                        />
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/dashboard/tokens/${token.id}`}>
                            <span>Details</span>
                          </Link>
                        </Button>
                        <Button size="sm" className="flex-1 bg-amber-500 hover:bg-amber-600 text-black">
                          <Plane className="h-4 w-4 mr-1" />
                          <span>Book Flight</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Wallet className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No tokens found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchTerm ? 'No tokens match your search criteria' : 'You don\'t have any ownership tokens yet'}
                </p>
                <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                  <Plus className="h-4 w-4 mr-1" />
                  Acquire Your First Jet Token
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Transactions Tab */}
        <TabsContent value="transactions" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Token Transaction History</CardTitle>
              <CardDescription>Your token purchases and flight usage history</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {filteredTransactions.length > 0 ? (
                <div className="divide-y">
                  {filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {transaction.type === 'purchase' ? (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Purchase</Badge>
                            ) : (
                              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200">Flight Usage</Badge>
                            )}
                            <h3 className="font-medium">
                              {transaction.jetModel}
                              {transaction.type === 'purchase' && ` - ${transaction.percentage}% ownership`}
                            </h3>
                          </div>
                          {transaction.type === 'purchase' ? (
                            <p className="text-sm text-muted-foreground">
                              Purchased on {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {transaction.route ?? 'Unknown route'} - Used {transaction.hoursUsed ?? 0} hours on {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {transaction.type === 'purchase' ? (
                            <div className="font-medium">{formatCurrency(transaction.amount ?? 0)}</div>
                          ) : (
                            <div className="font-medium">{transaction.hoursUsed} hours</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No transaction history found</h3>
                  <p className="text-muted-foreground max-w-md">
                    {searchTerm ? 'No transactions match your search criteria' : 'You don\'t have any token transactions yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 