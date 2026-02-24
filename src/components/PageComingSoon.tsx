import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PageComingSoonProps {
  title: string;
  subtitle?: string;
  badgeLabel?: string;
}

export function PageComingSoon({ title, subtitle, badgeLabel }: PageComingSoonProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-10 pb-10 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Em breve</h2>
          <p className="text-lg text-muted-foreground">{title}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground/70">{subtitle}</p>
          )}
          <Separator className="my-4" />
          {badgeLabel && (
            <Badge variant="secondary">{badgeLabel}</Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
