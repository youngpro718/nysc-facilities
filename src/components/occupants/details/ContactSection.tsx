
import { Mail, Phone } from "lucide-react";

interface ContactSectionProps {
  email: string | null;
  phone: string | null;
}

export function ContactSection({ email, phone }: ContactSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Contact Information</h3>
      <div className="space-y-2">
        {email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <a href={`mailto:${email}`} className="hover:text-primary truncate">
              {email}
            </a>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <a href={`tel:${phone}`} className="hover:text-primary">
              {phone}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
