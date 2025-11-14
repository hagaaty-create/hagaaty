import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenSquare } from "lucide-react";

export default function CreateAdPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <PenSquare className="h-8 w-8 text-primary"/>
                <h1 className="text-3xl font-bold font-headline">AI Ad Generator</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Create New Ad Campaign</CardTitle>
                    <CardDescription>Describe your product or service and let our AI generate a compelling ad campaign.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Ad creation form will be here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
