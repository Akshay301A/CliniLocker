import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getHealthCardPublic } from "@/lib/api";

type PublicCard = {
  health_id: string;
  name: string | null;
  blood_group: string | null;
};

const PublicHealthCard = () => {
  const { healthId } = useParams();
  const [card, setCard] = useState<PublicCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!healthId) return;
    setLoading(true);
    getHealthCardPublic(healthId).then((data) => {
      setCard((data as PublicCard) || null);
      setLoading(false);
    });
  }, [healthId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading health card…
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Health card not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-md w-full rounded-2xl bg-white shadow-xl border border-slate-100 p-6 text-center space-y-3">
        <p className="text-xs uppercase tracking-widest text-slate-400">CliniLocker Health Card</p>
        <h1 className="text-2xl font-bold text-slate-900">{card.name || "CliniLocker User"}</h1>
        <p className="text-slate-600">Blood Group: {card.blood_group || "—"}</p>
        <p className="text-slate-500 text-sm">Health ID: {card.health_id}</p>
      </div>
    </div>
  );
};

export default PublicHealthCard;
