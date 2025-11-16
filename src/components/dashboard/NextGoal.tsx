
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, PenSquare, Share2, Bot, CheckCircle } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import Link from 'next/link';

type UserProfile = {
  id: string;
  achievements?: { id: string, name: string, awardedAt: Timestamp }[];
}

type AchievementMeta = {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    cta: {
        text: string;
        link: string;
    }
}

const allAchievements: AchievementMeta[] = [
    {
        id: 'ad_pioneer',
        title: "كن رائد إعلانات",
        description: "أطلق حملتك الإعلانية الأولى لتجربة قوة الذكاء الاصطناعي في الوصول إلى جمهورك.",
        icon: <PenSquare className="h-6 w-6 text-primary" />,
        cta: {
            text: "أنشئ حملتك الأولى الآن",
            link: "/dashboard/create-ad"
        }
    },
    {
        id: 'team_builder',
        title: "ابنِ فريقك",
        description: "ادعُ صديقك الأول للانضمام إلى المنصة وابدأ في بناء شبكتك التسويقية.",
        icon: <Share2 className="h-6 w-6 text-primary" />,
        cta: {
            text: "اذهب لصفحة الإحالة",
            link: "/dashboard/referrals"
        }
    },
     {
        id: 'ai_contributor',
        title: "ساهم في الذكاء",
        description: "شغّل الوكيل المستقل للمساهمة في تحسين محتوى الموقع واكسب نقاطًا.",
        icon: <Bot className="h-6 w-6 text-primary" />,
        cta: {
            text: "شغّل الوكيل الآن",
            link: "/dashboard/agent"
        }
    },
    {
        id: 'reward_earner',
        title: "اصطد المكافآت",
        description: "اجمع 100 نقطة من تشغيل الوكيل المستقل واحصل على مكافأة رصيد إعلاني بقيمة 5$.",
        icon: <Award className="h-6 w-6 text-primary" />,
        cta: {
            text: "اجمع المزيد من النقاط",
            link: "/dashboard/agent"
        }
    }
];


export default function NextGoal({ userProfile }: { userProfile: UserProfile }) {
    
    const earnedAchievementIds = new Set(userProfile.achievements?.map(a => a.id) || []);

    const nextGoal = allAchievements.find(goal => !earnedAchievementIds.has(goal.id));

    if (!nextGoal) {
        return (
             <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-500"/>
                        <span>لقد أتقنت الأساسيات!</span>
                    </CardTitle>
                    <CardDescription>
                        تهانينا! لقد حصلت على جميع الإنجازات الرئيسية. أنت الآن خبير حقيقي في المنصة. استمر في النمو واستكشاف الميزات المتقدمة.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    return (
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    {nextGoal.icon}
                    <span>هدفك التالي: {nextGoal.title}</span>
                </CardTitle>
                <CardDescription>
                    {nextGoal.description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href={nextGoal.cta.link}>
                        {nextGoal.cta.text}
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )

}
