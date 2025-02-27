
import { Card } from "@/components/ui/card";

export function ConsultationSection() {
  return (
    <Card className="p-8 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom duration-700">
      <h3 className="text-2xl font-bold bg-gradient-to-r from-rose-600 via-violet-600 to-teal-600 dark:from-rose-400 dark:via-violet-400 dark:to-teal-400 bg-clip-text text-transparent mb-6">
        Book a Consultation
      </h3>
      <div className="aspect-video w-full">
        <iframe 
          src="https://outlook.office.com/bookwithme/user/c9e0c61b439d439da88f930740cb677c@makonis.de/meetingtype/oMBQfrttp02v742OTM_65Q2?anonymous&ep=mLinkFromTile" 
          className="w-full h-full rounded-lg border border-white/20" 
          allow="camera; microphone; geolocation" 
        />
      </div>
    </Card>
  );
}
