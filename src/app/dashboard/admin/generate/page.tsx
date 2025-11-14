import GenerateArticleForm from "@/components/dashboard/GenerateArticleForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenSquare } from "lucide-react";

export default function GenerateArticlePage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <PenSquare className="h-8 w-8 text-primary"/>
                <h1 className="text-3xl font-bold font-headline">Generate Article</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>AI Article Generator</CardTitle>
                    <CardDescription>Use AI to write a new article for the blog.</CardDescription>
                </CardHeader>
                <CardContent>
                    <GenerateArticleForm />
                </CardContent>
            </Card>
        </div>
    );
}
