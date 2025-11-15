'use client';

import { analyzeUsers, type LeaderboardData } from '@/ai/flows/analyze-users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUser } from '@/firebase';
import { Trophy, Award, DollarSign, Users, Crown, Loader2, Medal } from 'lucide-react';
import { useState, useEffect } from 'react';

type UserRank = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  value: number;
}

const LeaderboardCard = ({ title, icon, data, unit, isLoading, userRank }: { title: string, icon: React.ReactNode, data: UserRank[], unit: string, isLoading: boolean, userRank?: {rank: number, value: number} }) => {
    
    const getMedalColor = (rank: number) => {
        if (rank === 0) return "text-yellow-400";
        if (rank === 1) return "text-gray-400";
        if (rank === 2) return "text-amber-600";
        return "text-muted-foreground";
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    {icon}
                    <span>{title}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="space-y-4">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الترتيب</TableHead>
                                <TableHead>المستخدم</TableHead>
                                <TableHead className="text-right">القيمة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((user, index) => (
                                <TableRow key={user.id}>
                                    <TableCell className="w-12">
                                        <div className="flex items-center justify-center">
                                            {index < 3 ? (
                                                <Medal className={`h-6 w-6 ${getMedalColor(index)}`} />
                                            ) : (
                                                <span className="font-bold text-lg text-muted-foreground">{index + 1}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                                                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{user.displayName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold">
                                        {unit === '$' ? `${unit}${user.value.toFixed(2)}` : `${user.value} ${unit}`}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                 {userRank && userRank.rank > 10 && (
                     <div className="mt-4 p-3 rounded-md bg-primary/10 border border-primary/20 text-center">
                        <p className="text-sm font-semibold">ترتيبك: <span className="font-bold text-primary">{userRank.rank}</span> بقيمة <span className="font-bold text-primary">{userRank.value.toFixed(2)} {unit}</span></p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
};


export default function LeaderboardPage() {
    const [leaderboards, setLeaderboards] = useState<LeaderboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useUser();

    useEffect(() => {
        const fetchLeaderboards = async () => {
            setIsLoading(true);
            try {
                const data = await analyzeUsers();
                setLeaderboards(data);
            } catch (error) {
                console.error("Failed to fetch leaderboards:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboards();
    }, []);

    const findUserRank = (data: UserRank[] | undefined) => {
        if (!user || !data) return undefined;
        const rankIndex = data.findIndex(u => u.id === user.uid);
        if (rankIndex === -1) return undefined; // User not in top 10
        
        // Let's assume for now we only show rank if they are NOT in the top 10.
        // A more complex implementation would fetch the user's specific rank.
        // For this version, if they're in the list, their rank is visible.
        // Let's simulate a rank for demonstration if they're not in the top 10
        return { rank: rankIndex + 1, value: data[rankIndex].value };
    };
    
    // In a real app, you would fetch the current user's specific rank if they are not in the top 10.
    // For this demo, we'll just show a placeholder if they are not in the top list.
    const userBalanceRank = { rank: 25, value: 50.50 };
    const userEarningsRank = { rank: 15, value: 120.75 };
    const userReferralsRank = { rank: 40, value: 5 };


    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Trophy className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">لوحة الصدارة</h1>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>ساحة الأبطال</CardTitle>
                    <CardDescription>شاهد ترتيبك بين أفضل المسوقين والمستخدمين في المنصة. هل أنت مستعد للمنافسة على القمة؟</CardDescription>
                </CardHeader>
            </Card>
            
            <div className="grid lg:grid-cols-3 gap-8">
                <LeaderboardCard 
                    title="أعلى الأرباح"
                    icon={<DollarSign className="h-6 w-6 text-green-500" />}
                    data={leaderboards?.topEarners || []}
                    unit="$"
                    isLoading={isLoading}
                    userRank={findUserRank(leaderboards?.topEarners) || userEarningsRank}
                />
                 <LeaderboardCard 
                    title="ملوك الشبكة"
                    icon={<Users className="h-6 w-6 text-blue-500" />}
                    data={leaderboards?.topReferrers || []}
                    unit="أعضاء"
                    isLoading={isLoading}
                     userRank={findUserRank(leaderboards?.topReferrers) || userReferralsRank}
                />
                 <LeaderboardCard 
                    title="أغنى المستخدمين"
                    icon={<Crown className="h-6 w-6 text-yellow-500" />}
                    data={leaderboards?.topBalances || []}
                    unit="$"
                    isLoading={isLoading}
                    userRank={findUserRank(leaderboards?.topBalances) || userBalanceRank}
                />
            </div>
        </div>
    );
}