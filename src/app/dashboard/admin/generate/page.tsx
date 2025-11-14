import GenerateArticleForm from "@/components/dashboard/GenerateArticleForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenSquare } from "lucide-react";

export default function GenerateArticlePage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <PenSquare className="h-8 w-8 text-primary"/>
                <h1 className="text-3xl font-bold font-headline">توليد مقال</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>مولد المقالات بالذكاء الاصطناعي</CardTitle>
                    <CardDescription>استخدم الذكاء الاصطناعي لكتابة مقال جديد للمدونة.</CardDescription>
                </CardHeader>
                <CardContent>
                    <GenerateArticleForm />
                </CardContent>
            </Card>
        </div>
    );
}
