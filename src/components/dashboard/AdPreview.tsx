'use client';

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, MousePointerClick, DollarSign, Activity, Power } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

type AdCampaign = {
    id: string;
    productName: string;
    headline: string;
    body: string;
    websiteUrl: string;
    status: 'draft' | 'reviewing' | 'active' | 'paused' | 'completed';
    createdAt: Timestamp;
    performance: {
        impressions: number;
        clicks: number;
        ctr: number;
    }
};

type AdPreviewProps = {
    campaign: AdCampaign;
    cost: number;
};

const statusMap: Record<AdCampaign['status'], { text: string; color: 'bg-green-500' | 'bg-yellow-500' | 'bg-gray-500' }> = {
    active: { text: "نشط", color: 'bg-green-500' },
    reviewing: { text: "تحت المراجعة", color: 'bg-yellow-500' },
    paused: { text: "متوقف", color: 'bg-gray-500' },
    completed: { text: "مكتمل", color: 'bg-gray-500' },
    draft: { text: "مسودة", color: 'bg-gray-500' },
};

export default function AdPreview({ campaign, cost }: AdPreviewProps) {
    
    const { text: statusText, color: statusColor } = statusMap[campaign.status] || statusMap.draft;

    return (
        <div className="space-y-6">
            {/* Google Ad Preview */}
            <Card className="border-border/50">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">إعلان</span>
                        <span className="text-muted-foreground text-sm">•</span>
                        <p className="text-sm text-green-600 truncate">{campaign.websiteUrl}</p>
                    </div>
                    <h3 className="text-blue-700 text-xl font-medium hover:underline cursor-pointer">{campaign.headline}</h3>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{campaign.body}</p>
                </CardContent>
            </Card>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Power className="h-4 w-4"/>
                            <span className="text-sm font-semibold">الحالة</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
                            <span className="font-bold text-lg">{statusText}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                         <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <DollarSign className="h-4 w-4"/>
                            <span className="text-sm font-semibold">المصروف</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="font-bold text-lg">${cost.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                         <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <MousePointerClick className="h-4 w-4"/>
                            <span className="text-sm font-semibold">النقرات</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="font-bold text-lg">{campaign.performance.clicks.toLocaleString()}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                         <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Eye className="h-4 w-4"/>
                            <span className="text-sm font-semibold">مرات الظهور</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="font-bold text-lg">{campaign.performance.impressions.toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

    