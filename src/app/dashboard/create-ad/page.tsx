import AdCreationForm from "@/components/dashboard/AdCreationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenSquare } from "lucide-react";

export default function CreateAdPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <PenSquare className="h-8 w-8 text-primary"/>
                <h1 className="text-3xl font-bold font-headline">إنشاء حملة إعلانية</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>محاكي حملات جوجل الإعلانية</CardTitle>
                    <CardDescription>أدخل تفاصيل حملتك ودع الذكاء الاصطناعي يقترح عليك أفضل نسخة إعلانية. هذه محاكاة لتجربة إنشاء إعلان على جوجل.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AdCreationForm />
                </CardContent>
            </Card>
        </div>
    );
}
