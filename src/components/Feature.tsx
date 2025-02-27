
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Pencil, Save } from "lucide-react";

interface FeatureProps {
  features: string;
}

export function Feature({ features }: FeatureProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFeatures, setEditedFeatures] = useState(features);

  const handleSave = () => {
    // In a real app, you'd save these changes to your backend
    setIsEditing(false);
  };

  const featureList = features.split('\n').filter(Boolean);

  return (
    <Card className="p-6 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl mb-6">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-semibold text-rose-600 dark:text-rose-400 m-0">
          Features
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsEditing(true);
            setEditedFeatures(features);
          }}
          className="text-violet-600 dark:text-violet-400"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Refine
        </Button>
      </div>
      
      {isEditing ? (
        <div className="space-y-4 mt-4">
          <Textarea
            value={editedFeatures}
            onChange={(e) => setEditedFeatures(e.target.value)}
            className="w-full min-h-[200px]"
            placeholder="Enter features, one per line"
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setEditedFeatures(features);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <ul className="list-none p-0 m-0 space-y-2 mt-4">
          {featureList.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 mt-1 text-rose-500" />
              {feature}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
