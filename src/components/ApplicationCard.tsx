import { Card, CardContent } from '@/components/ui/card';

interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
}

interface ApplicationCardProps {
  application: Application;
  onClick?: () => void;
}

export function ApplicationCard({ application, onClick }: ApplicationCardProps) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer transition-shadow hover:shadow-md"
    >
      <CardContent className="p-3">
        <p className="text-sm font-medium">{application.position}</p>
        <p className="text-xs text-muted-foreground">{application.company}</p>
      </CardContent>
    </Card>
  );
}