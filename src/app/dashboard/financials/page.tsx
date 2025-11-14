import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet } from "lucide-react";

export default function FinancialsPage() {
    return (
        <div className="space-y-8">
             <div className="flex items-center gap-4">
                <Wallet className="h-8 w-8 text-primary"/>
                <h1 className="text-3xl font-bold font-headline">Financials</h1>
            </div>
            <Tabs defaultValue="add-funds">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="add-funds">Add Funds</TabsTrigger>
                    <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="referral">Referral Program</TabsTrigger>
                </TabsList>
                <TabsContent value="add-funds">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Funds</CardTitle>
                            <CardDescription>Select a payment method to add funds to your account.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Payment options (Binance Pay, USDT, Vodafone Cash) will be here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="withdraw">
                     <Card>
                        <CardHeader>
                            <CardTitle>Withdraw Earnings</CardTitle>
                            <CardDescription>Request a withdrawal of your referral earnings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Withdrawal form will be here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="history">
                     <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>View all your past transactions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Transaction table will be here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="referral">
                     <Card>
                        <CardHeader>
                            <CardTitle>Referral Program</CardTitle>
                            <CardDescription>Share your referral link and earn rewards.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Your referral link and stats will be here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
