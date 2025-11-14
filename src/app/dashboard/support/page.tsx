import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Headset } from "lucide-react";

export default function SupportPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Headset className="h-8 w-8 text-primary"/>
                <h1 className="text-3xl font-bold font-headline">Support</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Create Support Ticket</CardTitle>
                    <CardDescription>Have an issue? Our team is here to help.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Support ticket form will be here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
