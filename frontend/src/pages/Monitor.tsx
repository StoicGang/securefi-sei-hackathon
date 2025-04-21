import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Activity, 
  AlertTriangle, 
  ArrowDownRight, 
  AreaChart, 
  Percent, 
  BarChart3, 
  Wallet, 
  Search 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tokenData as defaultTokenData } from "@/data/liquidityData";

// Updated tokens array with new fields: liquidity_lock_status and related_terms
const tokens = [
  {
    token_name: "SEIYAN",
    token_address: "0x5f0E07dFeE5832Faa00c63F2D33A0D79150E8598",
    smart_contract_address: "0x4575f41308ec1483f3d399aa9a2826d74da13deb",
    liquidity_lock_status: "lock",
    related_terms: "Standard Lock, No Unlock Option"
  },
  {
    token_name: "FROG",
    token_address: "0xF9BDbF259eCe5ae17e29Bf92EB7ABd7B8b465Db9",
    smart_contract_address: "0x36A500F731e2FFA29207499EFb29326b671000AC",
    liquidity_lock_status: "lock",
    related_terms: "Standard Lock, No Unlock Option"
  },
  {
    token_name: "MILLI",
    token_address: "0x9559E7E8BD227a7c4B4f5E807a815C5178eE6dBE1",
    smart_contract_address: "akfgys26wk9xbmh9gtagz2umtvecjya4co5nayqwpump",
    liquidity_lock_status: "lock",
    related_terms: "Standard Lock, No Unlock Option"
  },
  {
    token_name: "CHIPS",
    token_address: "0xBd82f3bfE1dF0c84aEC88a22Ebc34C9A86595dc",
    smart_contract_address: "9gyfbPVwwZx4y1hotNSLcqXCQNpNqqz6ZRvo8yTLpump",
    liquidity_lock_status: "lock",
    related_terms: "Standard Lock, No Unlock Option"
  },
  {
    token_name: "POPO THE CAT",
    token_address: "0xC18b6a15FB0ceaf5eB18696EeFCb5bc7b9107149",
    smart_contract_address: "0x23f043426b2336e723b32fb3bf4a1ca410f7c49a",
    liquidity_lock_status: "Not Locked",
    related_terms: "Owner has Full control over the token"
  },
  {
    token_name: "Sei Less",
    token_address: "0x8c5529adb2524bc64130f6e6dC83D2606d8b079",
    smart_contract_address: "0x4B1E80cAC91e2216EEb63e29B957eB91Ae9C2Be8",
    liquidity_lock_status: "lock",
    related_terms: "Standard Lock, No Unlock Option"
  },
  {
    token_name: "ISEI",
    token_address: "0x5Cf6826140C1C56Ff49C808A1A75407Cd1DF9423",
    smart_contract_address: "0x576e2BeD8F7b46D34016198911Cdf9886f78bea7",
    liquidity_lock_status: "Not Locked",
    related_terms: "Owner has Full control over the token"
  },
  {
    token_name: "WILSON",
    token_address: "0x962Aae191622498BcA205c1c1B73E59aC7d295f2",
    smart_contract_address: "0x7fB1ee12Ca098aF9bE5313401d7fCC5c8d7968D8",
    liquidity_lock_status: "lock",
    related_terms: "Standard Lock, No Unlock Option"
  },
  {
    token_name: "Seibacca",
    token_address: "0x3eA30C06F48A6f696D3ba4b660C39DA96ed8f686",
    smart_contract_address: "0x42f0d280e1f4fb064650653445a3c904e61f64b1",
    liquidity_lock_status: "lock",
    related_terms: "Standard Lock, No Unlock Option"
  },
  {
    token_name: "HARD.on.sei",
    token_address: "0xB13E945556f3F69187599f4eDc1982f24f1046a",
    smart_contract_address: "0x42f0d280e1f4fb064650653445a3c904e61f64b1",
    liquidity_lock_status: "lock",
    related_terms: "Standard Lock, No Unlock Option"
  },
  {
    token_name: "INSPECTOR",
    token_address: "0x6291148AE49e0f0d847b97C4E060E49D87638DA",
    smart_contract_address: "0x42f0d280e1f4fb064650653445a3c904e61f64b1",
    liquidity_lock_status: "lock",
    related_terms: "Standard Lock, No Unlock Option"
  }
];

const Monitor = () => {
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0);
  // Instead of using a token address input, we use our tokens dropdown.
  const [chainId] = useState("solana");
  const [tokenData, setTokenData] = useState(defaultTokenData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Liquidity Monitor - AssureFi Guardian";
  }, []);

  const fetchTokenData = async () => {
    // Get the selected token details from the dropdown
    const selectedToken = tokens[selectedTokenIndex];
    // If no token address exists, show an error message.
    if (!selectedToken.token_address.trim()) {
      setError("Selected token does not have a valid token address");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://liquidity-monitoring-1.onrender.com/get_token?token_address=${selectedToken.token_address}&chain_id=${chainId}`,
        {
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      setTokenData(data);
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      console.error("Error fetching token data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format the price change data for the chart
  const priceChangeData = [
    { name: "1h", value: tokenData.metrics.price.change.h1 },
    { name: "6h", value: tokenData.metrics.price.change.h6 },
    { name: "24h", value: tokenData.metrics.price.change.h24 },
  ];

  // Format the volume data for the chart
  const volumeData = [
    { name: "1h", value: tokenData.metrics.volume.h1 },
    { name: "6h", value: tokenData.metrics.volume.h6 },
    { name: "24h", value: tokenData.metrics.volume.h24 },
  ];

  // Format transactions data
  const transactionsData = [
    { name: "Buys", value: tokenData.metrics.transactions.h1.buys },
    { name: "Sells", value: tokenData.metrics.transactions.h1.sells },
  ];

  // Colors for transaction data
  const transactionColors = ["#4ade80", "#f87171"];

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // Risk level indicator
  const getRiskLevelColor = (score: number) => {
    if (score >= 75) return "bg-red-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Generate simulated historical liquidity data based on current liquidity
  const hoursAgo = (hours: number) => {
    const date = new Date();
    date.setHours(date.getHours() - hours);
    return date.getTime();
  };

  const liquidityHistoricalData = [
    { time: hoursAgo(24), liquidity: tokenData.metrics.liquidity * 1.8 },
    { time: hoursAgo(18), liquidity: tokenData.metrics.liquidity * 1.5 },
    { time: hoursAgo(12), liquidity: tokenData.metrics.liquidity * 1.3 },
    { time: hoursAgo(6), liquidity: tokenData.metrics.liquidity * 1.1 },
    { time: hoursAgo(3), liquidity: tokenData.metrics.liquidity * 1.05 },
    { time: Date.now(), liquidity: tokenData.metrics.liquidity },
  ];

  // Custom number formatter
  const formatNumber = (value: any): string => {
    return typeof value === "number" ? value.toFixed(2) : String(value);
  };

  return (
    <DashboardLayout
      title="Liquidity Monitor"
      description="Track liquidity movements and detect potential exit scams"
    >
      <div className="grid gap-4 md:gap-8">
        {/* Token Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Select Token</CardTitle>
            <CardDescription>
              Choose a token from the list below to analyze its liquidity metrics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <select
                  className="border border-gray-600 rounded p-2 w-full bg-slate-900 text-white"
                  value={selectedTokenIndex}
                  onChange={(e) => setSelectedTokenIndex(Number(e.target.value))}
                >
                  {tokens.map((token, index) => (
                    <option 
                      key={index} 
                      value={index}
                      className="bg-slate-900 text-white"
                    >
                      {token.token_name}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={fetchTokenData} disabled={isLoading}>
                {isLoading ? "Loading..." : "Analyze"}
                {!isLoading && <Search className="ml-2 h-4 w-4" />}
              </Button>
            </div>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Token Overview Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <CardTitle>
                Token Overview: {tokenData.token_name} ({tokenData.token_symbol})
              </CardTitle>
            </div>
            <CardDescription>
              Last updated: {formatDate(tokenData.timestamp)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Current Price</div>
                <div className="text-2xl font-bold">
                  {tokenData.metrics.price.current.toExponential(2)}
                </div>
                <div className="flex items-center mt-1">
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-500">
                    {tokenData.metrics.price.change.h24}% (24h)
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Liquidity</div>
                <div className="text-2xl font-bold">
                  ${formatNumber(tokenData.metrics.liquidity)}
                </div>
                <div className="flex items-center mt-1">
                  <AreaChart className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-muted-foreground">
                    vs Market Cap: ${formatNumber(tokenData.metrics.market_cap)}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">24h Volume</div>
                <div className="text-2xl font-bold">
                  ${formatNumber(tokenData.metrics.volume.h24)}
                </div>
                <div className="flex items-center mt-1">
                  <BarChart3 className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">Active trading</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Risk Score</div>
                <div className="text-2xl font-bold">
                  {tokenData.risk?.risk_score ?? "N/A"}/100
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-2">
                  <div
                    className={`h-2 rounded-full ${getRiskLevelColor(tokenData.risk?.risk_score || 0)}`}
                    style={{ width: `${tokenData.risk?.risk_score || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Liquidity Lock Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Liquidity Lock Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Status:</strong>{" "}
                {tokens[selectedTokenIndex].liquidity_lock_status}
              </p>
              <p>
                <strong>Related Terms:</strong>{" "}
                {tokens[selectedTokenIndex].related_terms}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Liquidity Chart Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <AreaChart className="h-5 w-5 text-blue-500" />
              <CardTitle>Liquidity Tracker</CardTitle>
            </div>
            <CardDescription>
              Monitor liquidity pool changes and set alerts for suspicious withdrawals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={liquidityHistoricalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={(tick) => {
                      const date = new Date(tick);
                      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`$${formatNumber(value)}`, "Liquidity"]}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                  />
                  <Line type="monotone" dataKey="liquidity" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>
                Liquidity to Market Cap Ratio:{" "}
                {(tokenData.metrics.liquidity / tokenData.metrics.market_cap).toFixed(2)}
              </p>
              <p className="text-red-500 mt-1">
                {tokenData.metrics.liquidity > tokenData.metrics.market_cap &&
                  "⚠️ Warning: Liquidity exceeds market cap, potential for high volatility and manipulation"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Price Changes and Volume */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-red-500" />
                <CardTitle>Price Changes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priceChangeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, "Change"]} />
                    <Bar dataKey="value" fill="#f87171" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <CardTitle>Trading Volume</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${formatNumber(value)}`, "Volume"]} />
                    <Bar dataKey="value" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle>Risk Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>High Risk Detected</AlertTitle>
                <AlertDescription>
                  This token has a risk score of {tokenData.risk?.risk_score ?? "N/A"}/100
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <h4 className="font-medium">Vulnerabilities:</h4>
                <ul className="space-y-1 list-disc pl-5">
                  {tokenData.risk?.vulnerabilities?.length ? (
                    tokenData.risk.vulnerabilities.map((item, index) => (
                      <li key={index} className="text-sm text-red-500">{item}</li>
                    ))
                  ) : (
                    <p>No vulnerabilities found.</p>
                  )}
                </ul>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <h4 className="font-medium">Recommendations:</h4>
                <ul className="space-y-1 list-disc pl-5">
                  {tokenData.risk?.recommendations?.length ? (
                    tokenData.risk.recommendations.map((item, index) => (
                      <li key={index} className="text-sm">{item}</li>
                    ))
                  ) : (
                    <p>No recommendations available.</p>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-500" />
                <CardTitle>Transaction Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[150px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transactionsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Transactions" fill="#2563eb">
                      {transactionsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={transactionColors[index % transactionColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Buy/Sell Ratio</div>
                  <div className="text-xl font-bold">
                    {tokenData.metrics.transactions.h1.ratio.toFixed(2)}
                  </div>
                  <Badge variant={tokenData.metrics.transactions.h1.ratio >= 1 ? "success" : "destructive"} className="mt-1">
                    {tokenData.metrics.transactions.h1.ratio >= 1 ? "Bullish" : "Bearish"}
                  </Badge>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Recent Transactions</div>
                  <div className="text-xl font-bold">
                    {tokenData.metrics.transactions.h1.buys + tokenData.metrics.transactions.h1.sells}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">In the last hour</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>
              Analysis generated by our AI based on token metrics and market behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tokenData.ai_insights?.length ? (
                tokenData.ai_insights.map((insight, index) => (
                  <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="whitespace-pre-line text-sm">{insight}</p>
                  </div>
                ))
              ) : (
                <p>No AI insights available.</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            Updated based on latest blockchain data and market analysis
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Monitor;
