import AdCreationForm from "@/components/dashboard/AdCreationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenSquare } from "lucide-react";

export default function CreateAdPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <PenSquare className="h-8 w-8 text-primary"/>
                <h1 className="text-3xl font-bold font-headline">مولد الإعلانات بالذكاء الاصطناعي</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>إنشاء حملة إعلانية جديدة</CardTitle>
                    <CardDescription>صف منتجك أو خدمتك ودع الذكاء الاصطناعي يولد نصًا إعلانيًا مقنعًا.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AdCreationForm />
                </CardContent>
            </Card>
        </div>
    );
}
